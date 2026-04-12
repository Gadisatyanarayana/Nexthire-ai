import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import { spawn } from "child_process";

import {
  EXECUTION_CPU_LIMIT,
  EXECUTION_MEMORY_MB,
  EXECUTION_OUTPUT_LIMIT_BYTES,
  EXECUTION_PIDS_LIMIT,
  EXECUTION_TIMEOUT_MS,
  JUDGE_MAX_PARALLEL_CONTAINERS,
  JUDGE_PREPULL_IMAGES,
} from "./config";
import type { SupportedLanguage } from "./types";

type SandboxStatus = "Accepted" | "Compile Error" | "Runtime Error" | "Time Limit Exceeded";

export type SandboxExecutionResult = {
  stdout: string;
  stderr: string;
  compileError: string;
  status: SandboxStatus;
  exitCode: number | null;
  timedOut: boolean;
  timeMs: number;
  memoryKb: number | null;
};

type RuntimeSpec = {
  image: string;
  sourceFile: string;
  command: string;
};

type HostCommandSpec = {
  command: string;
  args: string[];
};

const COMPILE_ERROR_EXIT = 101;
const RUNTIME_TIMEOUT_EXIT = 124;
const KILLED_TIMEOUT_EXIT = 137;
const startupBufferRaw = Number(process.env.JUDGE_CONTAINER_STARTUP_BUFFER_MS || 30_000);
const CONTAINER_STARTUP_BUFFER_MS = Number.isFinite(startupBufferRaw)
  ? Math.max(1_000, Math.min(120_000, Math.floor(startupBufferRaw)))
  : 30_000;
const retryAttemptsRaw = Number(process.env.JUDGE_DOCKER_RETRY_ATTEMPTS || 0);
const DOCKER_RETRY_ATTEMPTS = Number.isFinite(retryAttemptsRaw)
  ? Math.max(0, Math.min(2, Math.floor(retryAttemptsRaw)))
  : 0;
const warmTtlRaw = Number(process.env.JUDGE_IMAGE_WARM_TTL_MS || 10 * 60 * 1000);
const JUDGE_IMAGE_WARM_TTL_MS = Number.isFinite(warmTtlRaw)
  ? Math.max(30_000, Math.min(60 * 60 * 1000, Math.floor(warmTtlRaw)))
  : 10 * 60 * 1000;
const JUDGE_LOCAL_EXECUTION_FALLBACK = String(process.env.JUDGE_LOCAL_EXECUTION_FALLBACK || "true").toLowerCase() !== "false";
const DOCKER_WINDOWS_PIPE = "\\\\.\\pipe\\docker_engine";
const dockerProbeTtlRaw = Number(process.env.JUDGE_DOCKER_PROBE_TTL_MS || 15_000);
const JUDGE_DOCKER_PROBE_TTL_MS = Number.isFinite(dockerProbeTtlRaw)
  ? Math.max(3_000, Math.min(60_000, Math.floor(dockerProbeTtlRaw)))
  : 15_000;

const warmedImageExpiries = new Map<string, number>();
const warmingImages = new Map<string, Promise<void>>();
let runningContainers = 0;
const containerWaiters: Array<() => void> = [];
let dockerAvailabilityCache: { at: number; available: boolean } | null = null;

async function acquireContainerSlot(): Promise<void> {
  if (runningContainers < JUDGE_MAX_PARALLEL_CONTAINERS) {
    runningContainers += 1;
    return;
  }

  await new Promise<void>((resolve) => {
    containerWaiters.push(resolve);
  });
  runningContainers += 1;
}

function releaseContainerSlot(): void {
  runningContainers = Math.max(0, runningContainers - 1);
  const next = containerWaiters.shift();
  if (next) next();
}

function getRuntimeSpec(language: SupportedLanguage, timeoutSeconds: number): RuntimeSpec {
  if (language === "python") {
    return {
      image: process.env.JUDGE_IMAGE_PYTHON || "python:3.10-slim",
      sourceFile: "main.py",
      command: `timeout -s KILL ${timeoutSeconds}s python3 /workspace/main.py < /workspace/stdin.txt`,
    };
  }

  if (language === "javascript") {
    return {
      image: process.env.JUDGE_IMAGE_JAVASCRIPT || "node:20-alpine",
      sourceFile: "main.js",
      command: `timeout -s KILL ${timeoutSeconds}s node /workspace/main.js < /workspace/stdin.txt`,
    };
  }

  if (language === "java") {
    return {
      image: process.env.JUDGE_IMAGE_JAVA || "eclipse-temurin:17-jdk-alpine",
      sourceFile: "Main.java",
      command: `javac /workspace/Main.java 2>/workspace/compile.err; status=$?; if [ $status -ne 0 ]; then cat /workspace/compile.err 1>&2; exit ${COMPILE_ERROR_EXIT}; fi; timeout -s KILL ${timeoutSeconds}s java -cp /workspace Main < /workspace/stdin.txt`,
    };
  }

  return {
    image: process.env.JUDGE_IMAGE_CPP || "gcc:13.2",
    sourceFile: "main.cpp",
    command: `g++ -O2 -std=gnu++17 /workspace/main.cpp -o /workspace/main 2>/workspace/compile.err; status=$?; if [ $status -ne 0 ]; then cat /workspace/compile.err 1>&2; exit ${COMPILE_ERROR_EXIT}; fi; timeout -s KILL ${timeoutSeconds}s /workspace/main < /workspace/stdin.txt`,
  };
}

function appendLimited(buffer: string, chunk: Buffer, limit: number): string {
  if (buffer.length >= limit) return buffer;
  const remaining = limit - buffer.length;
  return buffer + chunk.toString("utf8").slice(0, remaining);
}

function normalizeOutput(value: string): string {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

async function runDockerUtilityCommand(args: string[], timeoutMs: number): Promise<{ code: number | null; timedOut: boolean }> {
  let timedOut = false;

  const child = spawn("docker", args, {
    stdio: ["ignore", "ignore", "ignore"],
    windowsHide: true,
  });

  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, timeoutMs);

  const code = await new Promise<number | null>((resolve) => {
    child.on("close", (exitCode) => resolve(exitCode));
    child.on("error", () => resolve(null));
  });

  clearTimeout(timer);
  return { code, timedOut };
}

async function isDockerAvailable(): Promise<boolean> {
  const now = Date.now();
  if (dockerAvailabilityCache && now - dockerAvailabilityCache.at < JUDGE_DOCKER_PROBE_TTL_MS) {
    return dockerAvailabilityCache.available;
  }

  if (process.platform === "win32") {
    const pipeReachable = await fs.access(DOCKER_WINDOWS_PIPE).then(() => true).catch(() => false);
    if (!pipeReachable) {
      dockerAvailabilityCache = { at: now, available: false };
      return false;
    }
  }

  const check = await runDockerUtilityCommand(["info", "--format", "{{.ServerVersion}}"], 5_000);
  const available = check.code === 0 && !check.timedOut;
  dockerAvailabilityCache = { at: now, available };
  return available;
}

function getHostRuntimeCommands(language: SupportedLanguage, sourceFilePath: string): HostCommandSpec[] {
  if (language === "python") {
    if (process.platform === "win32") {
      const localAppData = String(process.env.LOCALAPPDATA || "").trim();
      const userProfile = String(process.env.USERPROFILE || "").trim();

      const commands: HostCommandSpec[] = [
        { command: "python", args: [sourceFilePath] },
      ];
      const windowsCandidates: HostCommandSpec[] = [
        { command: path.join(localAppData, "Programs", "Python", "Python313", "python.exe"), args: [sourceFilePath] },
        { command: path.join(localAppData, "Programs", "Python", "Python312", "python.exe"), args: [sourceFilePath] },
        { command: path.join(localAppData, "Programs", "Python", "Python311", "python.exe"), args: [sourceFilePath] },
        { command: path.join(localAppData, "Programs", "Python", "Python310", "python.exe"), args: [sourceFilePath] },
        { command: path.join(userProfile, "anaconda3", "python.exe"), args: [sourceFilePath] },
      ];

      for (const candidate of windowsCandidates) {
        if (!candidate.command) continue;
        commands.push(candidate);
      }

      return commands;
    }

    return [
      { command: "python3", args: [sourceFilePath] },
      { command: "python", args: [sourceFilePath] },
      { command: "py", args: ["-3", sourceFilePath] },
    ];
  }

  if (language === "javascript") {
    return [{ command: "node", args: [sourceFilePath] }];
  }

  return [];
}

function isMissingBinaryError(stderr: string): boolean {
  const normalized = String(stderr || "").toLowerCase();
  return normalized.includes("enoent")
    || normalized.includes("is not recognized")
    || normalized.includes("cannot find")
    || normalized.includes("was not found")
    || normalized.includes("app execution aliases");
}

async function runHostCommand(params: {
  command: string;
  args: string[];
  cwd: string;
  stdin: string;
  timeoutMs: number;
}): Promise<{ stdout: string; stderr: string; code: number | null; timedOut: boolean; timeMs: number }> {
  const startedAt = Date.now();
  let stdout = "";
  let stderr = "";
  let timedOut = false;

  const child = spawn(params.command, params.args, {
    cwd: params.cwd,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
      shell: false,
  });

  child.stdout.on("data", (chunk: Buffer) => {
    stdout = appendLimited(stdout, chunk, EXECUTION_OUTPUT_LIMIT_BYTES);
  });

  child.stderr.on("data", (chunk: Buffer) => {
    stderr = appendLimited(stderr, chunk, EXECUTION_OUTPUT_LIMIT_BYTES);
  });

  if (child.stdin) {
    child.stdin.write(params.stdin);
    child.stdin.end();
  }

  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, params.timeoutMs);

  const code = await new Promise<number | null>((resolve) => {
    child.on("close", (exitCode) => resolve(exitCode));
    child.on("error", (error) => {
      const message = error instanceof Error ? error.message : "Failed to start host runtime process";
      stderr = appendLimited(stderr, Buffer.from(message, "utf8"), EXECUTION_OUTPUT_LIMIT_BYTES);
      resolve(null);
    });
  });

  clearTimeout(timer);

  return {
    stdout,
    stderr,
    code,
    timedOut,
    timeMs: Date.now() - startedAt,
  };
}

async function executeOnHost(params: {
  language: SupportedLanguage;
  sourceFilePath: string;
  cwd: string;
  stdin: string;
  timeoutMs: number;
}): Promise<SandboxExecutionResult> {
  const candidates = getHostRuntimeCommands(params.language, params.sourceFilePath);
  if (candidates.length === 0) {
    return {
      stdout: "",
      stderr: `Docker is unavailable and local fallback does not support ${params.language}.`,
      compileError: "",
      status: "Runtime Error",
      exitCode: null,
      timedOut: false,
      timeMs: 0,
      memoryKb: null,
    };
  }

  let execution: { stdout: string; stderr: string; code: number | null; timedOut: boolean; timeMs: number } | null = null;

  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const current = await runHostCommand({
      command: candidate.command,
      args: candidate.args,
      cwd: params.cwd,
      stdin: params.stdin,
      timeoutMs: params.timeoutMs,
    });

    execution = current;
    const missingRuntime = current.code !== 0 && isMissingBinaryError(current.stderr);
    const shouldTryNext = missingRuntime && i < candidates.length - 1;
    if (!shouldTryNext) break;
  }

  if (!execution) {
    return {
      stdout: "",
      stderr: "Local fallback execution did not start.",
      compileError: "",
      status: "Runtime Error",
      exitCode: null,
      timedOut: false,
      timeMs: 0,
      memoryKb: null,
    };
  }

  const stdout = normalizeOutput(execution.stdout);
  const stderr = normalizeOutput(execution.stderr);

  if (execution.timedOut) {
    return {
      stdout: "",
      stderr: stderr || "Execution timed out",
      compileError: "",
      status: "Time Limit Exceeded",
      exitCode: execution.code,
      timedOut: true,
      timeMs: execution.timeMs,
      memoryKb: null,
    };
  }

  if (execution.code === 0) {
    return {
      stdout,
      stderr,
      compileError: "",
      status: "Accepted",
      exitCode: execution.code,
      timedOut: false,
      timeMs: execution.timeMs,
      memoryKb: null,
    };
  }

  return {
    stdout,
    stderr: stderr || "Local fallback execution failed",
    compileError: "",
    status: "Runtime Error",
    exitCode: execution.code,
    timedOut: false,
    timeMs: execution.timeMs,
    memoryKb: null,
  };
}

async function cleanupStaleJudgeContainers(): Promise<void> {
  const list = spawn("docker", ["ps", "-aq", "--filter", "name=nexthire-judge-"], {
    stdio: ["ignore", "pipe", "ignore"],
    windowsHide: true,
  });

  let ids = "";
  list.stdout.on("data", (chunk: Buffer) => {
    ids += chunk.toString("utf8");
  });

  await new Promise<void>((resolve) => {
    list.on("close", () => resolve());
    list.on("error", () => resolve());
  });

  const containerIds = ids
    .split(/\r?\n/)
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 64);

  if (containerIds.length === 0) return;
  await runDockerUtilityCommand(["rm", "-f", ...containerIds], 30_000);
}

function getRuntimeImages(): string[] {
  const images = [
    getRuntimeSpec("python", 2).image,
    getRuntimeSpec("javascript", 2).image,
    getRuntimeSpec("cpp", 2).image,
    getRuntimeSpec("java", 2).image,
  ];

  return Array.from(new Set(images));
}

function normalizeHostVolumePath(hostPath: string): string {
  if (process.platform !== "win32") return hostPath;
  return hostPath
    .replace(/^[A-Za-z]:/, (drive) => `/${drive[0].toLowerCase()}`)
    .replace(/\\/g, "/");
}

async function warmImage(image: string): Promise<void> {
  if (JUDGE_PREPULL_IMAGES) {
    await runDockerUtilityCommand(["pull", image], 300_000);
  }

  const inspect = await runDockerUtilityCommand(["image", "inspect", image], 20_000);
  if (inspect.code !== 0) {
    await runDockerUtilityCommand(["pull", image], 300_000);
  }

  await runDockerUtilityCommand(
    ["run", "--rm", "--network", "none", "--entrypoint", "sh", image, "-lc", "true"],
    45_000
  );

  warmedImageExpiries.set(image, Date.now() + JUDGE_IMAGE_WARM_TTL_MS);
}

export async function prepullSandboxImages(): Promise<void> {
  if (!JUDGE_PREPULL_IMAGES) return;
  const images = getRuntimeImages();
  await Promise.all(images.map((image) => runDockerUtilityCommand(["pull", image], 300_000)));
}

async function ensureImageWarmed(image: string): Promise<void> {
  const now = Date.now();
  const expiresAt = warmedImageExpiries.get(image) || 0;
  if (expiresAt > now) return;

  const inFlight = warmingImages.get(image);
  if (inFlight) {
    await inFlight;
    return;
  }

  const task = (async () => {
    try {
      await warmImage(image);
    } catch {
      // Prewarming is best-effort and should never block sandbox execution.
      warmedImageExpiries.set(image, Date.now() + 30_000);
    } finally {
      warmingImages.delete(image);
    }
  })();

  warmingImages.set(image, task);
  await task;
}

export async function prewarmSandboxImages(): Promise<void> {
  const images = getRuntimeImages();

  await Promise.all(images.map((image) => ensureImageWarmed(image)));
  if (process.env.JUDGE_CLEANUP_STALE_CONTAINERS !== "false") {
    await cleanupStaleJudgeContainers().catch(() => undefined);
  }
}

async function forceRemoveContainer(containerName: string): Promise<void> {
  await new Promise<void>((resolve) => {
    const rm = spawn("docker", ["rm", "-f", containerName], {
      stdio: "ignore",
    });
    rm.on("close", () => resolve());
    rm.on("error", () => resolve());
  });
}

async function runDockerCommand(params: {
  args: string[];
  containerName: string;
  timeoutMs: number;
}): Promise<{ stdout: string; stderr: string; code: number | null; timedOut: boolean; timeMs: number }> {
  const startedAt = Date.now();
  let stdout = "";
  let stderr = "";
  let timedOut = false;

  const child = spawn("docker", params.args, {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  child.stdout.on("data", (chunk: Buffer) => {
    stdout = appendLimited(stdout, chunk, EXECUTION_OUTPUT_LIMIT_BYTES);
  });

  child.stderr.on("data", (chunk: Buffer) => {
    stderr = appendLimited(stderr, chunk, EXECUTION_OUTPUT_LIMIT_BYTES);
  });

  const timer = setTimeout(() => {
    timedOut = true;
    void forceRemoveContainer(params.containerName);
    child.kill("SIGKILL");
  }, params.timeoutMs);

  const code = await new Promise<number | null>((resolve) => {
    child.on("close", (exitCode) => resolve(exitCode));
    child.on("error", (error) => {
      const message = error instanceof Error ? error.message : "Failed to start Docker process";
      stderr = appendLimited(stderr, Buffer.from(message, "utf8"), EXECUTION_OUTPUT_LIMIT_BYTES);
      resolve(null);
    });
  });

  clearTimeout(timer);

  if (timedOut) {
    await forceRemoveContainer(params.containerName);
  }

  return {
    stdout,
    stderr,
    code,
    timedOut,
    timeMs: Date.now() - startedAt,
  };
}

export async function executeInSandbox(params: {
  language: SupportedLanguage;
  code: string;
  stdin?: string;
  timeoutMs?: number;
}): Promise<SandboxExecutionResult> {
  const runtimeTimeoutMs = Math.max(1000, params.timeoutMs || EXECUTION_TIMEOUT_MS);
  const runtimeTimeoutSeconds = Math.max(2, Math.min(20, Math.ceil(runtimeTimeoutMs / 1000)));
  const runtime = getRuntimeSpec(params.language, runtimeTimeoutSeconds);
  const stdin = String(params.stdin || "");
  const tempDir = await fs.mkdtemp(path.join(/* turbopackIgnore: true */ os.tmpdir(), "nexthire-judge-"));
  const containerBase = `nexthire-judge-${randomUUID().slice(0, 8)}`;

  try {
    const sourceFilePath = path.join(/* turbopackIgnore: true */ tempDir, runtime.sourceFile);
    await fs.writeFile(sourceFilePath, params.code, "utf8");
    await fs.writeFile(path.join(/* turbopackIgnore: true */ tempDir, "stdin.txt"), stdin, "utf8");

    const dockerAvailable = await isDockerAvailable();
    if (!dockerAvailable) {
      if (!JUDGE_LOCAL_EXECUTION_FALLBACK) {
        // Keep service responsive in dev/recovery scenarios even when Docker daemon is offline.
      }
      const hostTimeoutMs = runtimeTimeoutMs + CONTAINER_STARTUP_BUFFER_MS;
      return await executeOnHost({
        language: params.language,
        sourceFilePath,
        cwd: tempDir,
        stdin,
        timeoutMs: hostTimeoutMs,
      });
    }

    await acquireContainerSlot();
    try {

      let execution: { stdout: string; stderr: string; code: number | null; timedOut: boolean; timeMs: number } | null = null;
      let cumulativeTimeMs = 0;

      for (let attempt = 0; attempt <= DOCKER_RETRY_ATTEMPTS; attempt += 1) {
        const containerName = `${containerBase}-${attempt}`;
        const hostWorkspacePath = normalizeHostVolumePath(tempDir);
        const args = [
          "run",
          "--rm",
          "--name",
          containerName,
          "--network",
          "none",
          "--cpus",
          String(EXECUTION_CPU_LIMIT),
          "--memory",
          `${EXECUTION_MEMORY_MB}m`,
          "--pids-limit",
          String(EXECUTION_PIDS_LIMIT),
          "--cap-drop",
          "ALL",
          "--security-opt",
          "no-new-privileges",
          "--read-only",
          "--tmpfs",
          "/tmp:rw,noexec,nosuid,nodev,size=64m",
          "--workdir",
          "/workspace",
          "-v",
          `${hostWorkspacePath}:/workspace:rw`,
          runtime.image,
          "sh",
          "-lc",
          runtime.command,
        ];

        const current = await runDockerCommand({
          args,
          containerName,
          timeoutMs: runtimeTimeoutMs + CONTAINER_STARTUP_BUFFER_MS,
        });

        cumulativeTimeMs += current.timeMs;
        execution = current;

        const retryable = current.timedOut || current.code === null;
        if (!retryable || attempt >= DOCKER_RETRY_ATTEMPTS) {
          break;
        }
      }

      if (!execution) {
        return {
          stdout: "",
          stderr: "Docker execution failed before process start",
          compileError: "",
          status: "Runtime Error",
          exitCode: null,
          timedOut: false,
          timeMs: cumulativeTimeMs,
          memoryKb: null,
        };
      }

      const finalExecution = {
        ...execution,
        timeMs: Math.max(execution.timeMs, cumulativeTimeMs),
      };

      const stdout = normalizeOutput(finalExecution.stdout);
      const stderr = normalizeOutput(finalExecution.stderr);

      if (finalExecution.code === RUNTIME_TIMEOUT_EXIT || finalExecution.code === KILLED_TIMEOUT_EXIT) {
        return {
          stdout: "",
          stderr: stderr || "Execution timed out",
          compileError: "",
          status: "Time Limit Exceeded",
          exitCode: finalExecution.code,
          timedOut: true,
          timeMs: finalExecution.timeMs,
          memoryKb: null,
        };
      }

      if (finalExecution.timedOut) {
        return {
          stdout: "",
          stderr: stderr || `Sandbox startup timed out after ${runtimeTimeoutMs + CONTAINER_STARTUP_BUFFER_MS}ms`,
          compileError: "",
          status: "Runtime Error",
          exitCode: finalExecution.code,
          timedOut: true,
          timeMs: finalExecution.timeMs,
          memoryKb: null,
        };
      }

      if (finalExecution.code === COMPILE_ERROR_EXIT) {
        return {
          stdout: "",
          stderr: "",
          compileError: stderr,
          status: "Compile Error",
          exitCode: finalExecution.code,
          timedOut: false,
          timeMs: finalExecution.timeMs,
          memoryKb: null,
        };
      }

      if (finalExecution.code === null) {
        return {
          stdout,
          stderr: stderr || "Docker process failed to start or exited unexpectedly",
          compileError: "",
          status: "Runtime Error",
          exitCode: finalExecution.code,
          timedOut: false,
          timeMs: finalExecution.timeMs,
          memoryKb: null,
        };
      }

      if (finalExecution.code !== 0) {
        return {
          stdout,
          stderr,
          compileError: "",
          status: "Runtime Error",
          exitCode: finalExecution.code,
          timedOut: false,
          timeMs: finalExecution.timeMs,
          memoryKb: null,
        };
      }

      return {
        stdout,
        stderr,
        compileError: "",
        status: "Accepted",
        exitCode: finalExecution.code,
        timedOut: false,
        timeMs: finalExecution.timeMs,
        memoryKb: null,
      };
    } finally {
      releaseContainerSlot();
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
