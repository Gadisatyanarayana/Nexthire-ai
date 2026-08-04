import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import { spawn, spawnSync } from "child_process";
import { existsSync, readdirSync, statSync } from "fs";

import {
  EXECUTION_CPU_LIMIT,
  EXECUTION_MEMORY_MB,
  EXECUTION_OUTPUT_LIMIT_BYTES,
  EXECUTION_PIDS_LIMIT,
  EXECUTION_TIMEOUT_COMPILE_MS,
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

type HostExecutionProbe = {
  stdout: string;
  stderr: string;
  code: number | null;
  timedOut: boolean;
  timeMs: number;
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
const JUDGE_LOCAL_EXECUTION_FALLBACK = String(process.env.JUDGE_LOCAL_EXECUTION_FALLBACK ?? "true").toLowerCase() !== "false";
const DOCKER_WINDOWS_PIPE = "\\\\.\\pipe\\docker_engine";
const dockerProbeTtlRaw = Number(process.env.JUDGE_DOCKER_PROBE_TTL_MS || 60_000);
const JUDGE_DOCKER_PROBE_TTL_MS = Number.isFinite(dockerProbeTtlRaw)
  ? Math.max(3_000, Math.min(120_000, Math.floor(dockerProbeTtlRaw)))
  : 60_000;
const dockerInfoProbeTimeoutRaw = Number(process.env.JUDGE_DOCKER_INFO_PROBE_TIMEOUT_MS || 3_500);
const JUDGE_DOCKER_INFO_PROBE_TIMEOUT_MS = Number.isFinite(dockerInfoProbeTimeoutRaw)
  ? Math.max(1_000, Math.min(15_000, Math.floor(dockerInfoProbeTimeoutRaw)))
  : 3_500;

const warmedImageExpiries = new Map<string, number>();
const warmingImages = new Map<string, Promise<void>>();
let runningContainers = 0;
const containerWaiters: Array<() => void> = [];
let dockerAvailabilityCache: { at: number; available: boolean } | null = null;
let dockerExecutableCache: string | null = null;

function resolveDockerExecutable(): string {
  if (dockerExecutableCache) return dockerExecutableCache;

  const explicit = String(process.env.JUDGE_DOCKER_PATH || "").trim();
  if (explicit && existsSync(explicit)) {
    dockerExecutableCache = explicit;
    return dockerExecutableCache;
  }

  if (process.platform === "win32") {
    const programFiles = String(process.env.ProgramFiles || "C:\\Program Files").trim();
    const localAppData = String(process.env.LOCALAPPDATA || "").trim();
    const candidates = [
      path.join(programFiles, "Docker", "Docker", "resources", "bin", "docker.exe"),
      path.join(localAppData, "Docker", "Docker", "resources", "bin", "docker.exe"),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        dockerExecutableCache = candidate;
        return dockerExecutableCache;
      }
    }
  }

  dockerExecutableCache = "docker";
  return dockerExecutableCache;
}

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
      image: process.env.JUDGE_IMAGE_PYTHON || "python:3.12-slim",
      sourceFile: "main.py",
      command: `timeout -s KILL ${timeoutSeconds}s python3 main.py`,
    };
  }

  if (language === "javascript") {
    return {
      image: process.env.JUDGE_IMAGE_JAVASCRIPT || "node:20-alpine",
      sourceFile: "main.js",
      command: `timeout -s KILL ${timeoutSeconds}s node main.js`,
    };
  }

  if (language === "java") {
    const compileTimeout = EXECUTION_TIMEOUT_COMPILE_MS / 1000;
    const javaTimeout = EXECUTION_TIMEOUT_MS / 1000;
    return {
      image: process.env.JUDGE_IMAGE_JAVA || "eclipse-temurin:21-jdk",
      sourceFile: "Main.java",
      command: `timeout -s KILL ${compileTimeout}s javac *.java 2> /tmp/compile.err; status=$?; if [ $status -ne 0 ]; then echo "Compilation Stage: javac" 1>&2; echo "Command: javac Main.java" 1>&2; echo "Exit Code: $status" 1>&2; if [ $status -eq 137 ]; then echo "Signal: SIGKILL" 1>&2; echo "Possible Cause: Compiler terminated due to memory limit (OOM) or compile timeout (${compileTimeout}s)." 1>&2; elif [ $status -eq 124 ]; then echo "Signal: SIGTERM" 1>&2; echo "Possible Cause: Compiler timed out after ${compileTimeout}s." 1>&2; else echo "Diagnostics:" 1>&2; cat /tmp/compile.err 1>&2; fi; exit ${COMPILE_ERROR_EXIT}; fi; timeout -s KILL ${javaTimeout}s java -cp . Main`,
    };
  }

  if (language === "cpp") {
    const compileTimeout = EXECUTION_TIMEOUT_COMPILE_MS / 1000;
    const execTimeout = EXECUTION_TIMEOUT_MS / 1000;
    return {
      image: process.env.JUDGE_IMAGE_CPP || "gcc:13.2",
      sourceFile: "main.cpp",
      command: `timeout -s KILL ${compileTimeout}s g++ -O0 -std=gnu++17 *.cpp -o main 2> /tmp/compile.err; status=$?; if [ $status -ne 0 ]; then echo "Compilation Stage: g++" 1>&2; echo "Command: g++ -O0 -std=gnu++17 main.cpp -o main" 1>&2; echo "Exit Code: $status" 1>&2; if [ $status -eq 137 ]; then echo "Signal: SIGKILL" 1>&2; echo "Possible Cause: Compiler terminated due to memory limit (OOM) or compile timeout (${compileTimeout}s)." 1>&2; elif [ $status -eq 124 ]; then echo "Signal: SIGTERM" 1>&2; echo "Possible Cause: Compiler timed out after ${compileTimeout}s." 1>&2; else echo "Diagnostics:" 1>&2; cat /tmp/compile.err 1>&2; fi; exit ${COMPILE_ERROR_EXIT}; fi; timeout -s KILL ${execTimeout}s ./main`,
    };
  }

  return {
    image: process.env.JUDGE_IMAGE_CPP || "gcc:13.2",
    sourceFile: "main.cpp",
    command: `g++ -O2 -std=gnu++17 main.cpp -o main 2> compile.err; status=$?; if [ $status -ne 0 ]; then cat compile.err 1>&2; exit ${COMPILE_ERROR_EXIT}; fi; timeout -s KILL ${timeoutSeconds}s ./main`,
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

  const child = spawn(resolveDockerExecutable(), args, {
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
  if (process.env.JUDGE_LOCAL_EXECUTION_ONLY === "true" || process.env.JUDGE_FORCE_LOCAL_EXECUTION === "true") {
    return false;
  }
  const now = Date.now();
  const ttl = (dockerAvailabilityCache && !dockerAvailabilityCache.available) ? 86_400_000 : JUDGE_DOCKER_PROBE_TTL_MS;
  if (dockerAvailabilityCache && now - dockerAvailabilityCache.at < ttl) {
    return dockerAvailabilityCache.available;
  }

  const infoCheck = await runDockerUtilityCommand(
    ["info", "--format", "{{.ServerVersion}}"],
    1000
  );
  const available = infoCheck.code === 0 && !infoCheck.timedOut;
  dockerAvailabilityCache = { at: now, available };
  return available;
}

const resolvedPathCache = new Map<string, string | null>();

function resolveExecutablePath(binaryName: string, envVarNames: string[] = []): string | null {
  const cacheKey = `${binaryName}:${envVarNames.join(",")}`;
  if (resolvedPathCache.has(cacheKey)) {
    return resolvedPathCache.get(cacheKey) || null;
  }

  for (const envVar of envVarNames) {
    const val = String(process.env[envVar] || "").trim();
    if (val && existsSync(val)) {
      try {
        const st = statSync(val);
        if (st.isFile() && st.size > 0) {
          resolvedPathCache.set(cacheKey, val);
          return val;
        }
      } catch {}
    }
  }

  const isWin = process.platform === "win32";

  const isValidExe = (p: string): boolean => {
    if (!p || !existsSync(p)) return false;
    try {
      const st = statSync(p);
      if (!st.isFile() || st.size === 0) return false;
      if (isWin && p.toLowerCase().includes("windowsapps")) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const lookupCmd = isWin ? "where.exe" : "which";
  try {
    const res = spawnSync(lookupCmd, [binaryName], { encoding: "utf8", windowsHide: true, timeout: 3000 });
    if (res.status === 0 && res.stdout) {
      const lines = res.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      for (const line of lines) {
        if (isValidExe(line)) {
          resolvedPathCache.set(cacheKey, line);
          return line;
        }
      }
    }
  } catch {}

  if (isWin) {
    const localAppData = String(process.env.LOCALAPPDATA || "").trim();
    const userProfile = String(process.env.USERPROFILE || "").trim();
    const programFiles = String(process.env.ProgramFiles || "C:\\Program Files").trim();
    const candidates: string[] = [];

    if (binaryName.startsWith("java")) {
      const drives = ["C:", "D:", "E:", "F:"];
      const folderBases = [
        "Program Files\\Java",
        "Programfiles\\java",
        "Program Files (x86)\\Java",
        "Program Files\\Eclipse Adoptium",
      ];
      for (const drive of drives) {
        for (const base of folderBases) {
          const targetDir = `${drive}\\${base}`;
          if (existsSync(targetDir)) {
            try {
              const entries = readdirSync(targetDir);
              for (const entry of entries) {
                candidates.push(path.join(targetDir, entry, "bin", `${binaryName}.exe`));
                candidates.push(path.join(targetDir, entry, "bin", binaryName));
              }
            } catch {}
          }
        }
      }
    }

    if (binaryName.startsWith("g++") || binaryName.startsWith("gcc") || binaryName.startsWith("clang++")) {
      const wingetPkgDir = path.join(localAppData, "Microsoft", "WinGet", "Packages");
      if (existsSync(wingetPkgDir)) {
        try {
          const pkgs = readdirSync(wingetPkgDir);
          for (const pkg of pkgs) {
            if (pkg.toLowerCase().includes("winlibs") || pkg.toLowerCase().includes("mingw") || pkg.toLowerCase().includes("gcc")) {
              const pkgPath = path.join(wingetPkgDir, pkg);
              candidates.push(path.join(pkgPath, "mingw64", "bin", `${binaryName}.exe`));
              candidates.push(path.join(pkgPath, "bin", `${binaryName}.exe`));
            }
          }
        } catch {}
      }
      candidates.push(path.join(programFiles, "LLVM", "bin", "clang++.exe"));
      candidates.push("C:\\msys64\\ucrt64\\bin\\g++.exe");
      candidates.push("C:\\msys64\\mingw64\\bin\\g++.exe");
      candidates.push("C:\\mingw64\\bin\\g++.exe");
    }

    if (binaryName.startsWith("python")) {
      candidates.push(path.join(localAppData, "Programs", "Python", "Python313", "python.exe"));
      candidates.push(path.join(localAppData, "Programs", "Python", "Python312", "python.exe"));
      candidates.push(path.join(localAppData, "Programs", "Python", "Python311", "python.exe"));
      candidates.push(path.join(localAppData, "Programs", "Python", "Python310", "python.exe"));
      candidates.push(path.join(userProfile, "anaconda3", "python.exe"));
      candidates.push(path.join(userProfile, "miniconda3", "python.exe"));
    }

    for (const cand of candidates) {
      if (isValidExe(cand)) {
        resolvedPathCache.set(cacheKey, cand);
        return cand;
      }
    }
  }

  resolvedPathCache.set(cacheKey, null);
  return null;
}

function getHostRuntimeCommands(language: SupportedLanguage, sourceFilePath: string): HostCommandSpec[] {
  if (language === "python") {
    const commands: HostCommandSpec[] = [];

    const resolvedPython = resolveExecutablePath("python3", ["JUDGE_PYTHON_PATH"])
      || resolveExecutablePath("python", ["JUDGE_PYTHON_PATH"]);

    if (resolvedPython) {
      commands.push({ command: resolvedPython, args: [sourceFilePath] });
    }

    const resolvedPy = resolveExecutablePath("py");
    if (resolvedPy) {
      commands.push({ command: resolvedPy, args: ["-3", sourceFilePath] });
    }

    if (process.platform === "win32") {
      commands.push({ command: "py", args: ["-3", sourceFilePath] });
      commands.push({ command: "python", args: [sourceFilePath] });
    } else {
      commands.push({ command: "python3", args: [sourceFilePath] });
      commands.push({ command: "python", args: [sourceFilePath] });
    }

    return commands;
  }

  if (language === "javascript") {
    const resolvedNode = resolveExecutablePath("node", ["JUDGE_NODE_PATH"]);
    if (resolvedNode) {
      return [{ command: resolvedNode, args: [sourceFilePath] }];
    }
    return [{ command: "node", args: [sourceFilePath] }];
  }

  return [];
}

function getHostJavaCommands(): { javac: HostCommandSpec[]; java: HostCommandSpec[] } {
  const javacCandidates: HostCommandSpec[] = [];
  const javaCandidates: HostCommandSpec[] = [];

  const resolvedJavac = resolveExecutablePath("javac", ["JUDGE_JAVAC_PATH", "JAVA_HOME"]);
  const resolvedJava = resolveExecutablePath("java", ["JUDGE_JAVA_PATH", "JAVA_HOME"]);

  if (resolvedJavac && resolvedJava) {
    javacCandidates.push({ command: resolvedJavac, args: [] });
    javaCandidates.push({ command: resolvedJava, args: [] });
  }

  if (process.platform === "win32") {
    const javaHome = String(process.env.JAVA_HOME || "").trim();
    const programFiles = String(process.env.ProgramFiles || "C:\\Program Files").trim();

    const pushPair = (basePath: string) => {
      if (!basePath) return;
      const javacPath = path.join(basePath, "bin", "javac.exe");
      const javaPath = path.join(basePath, "bin", "java.exe");
      if (existsSync(javacPath) && existsSync(javaPath)) {
        javacCandidates.push({ command: javacPath, args: [] });
        javaCandidates.push({ command: javaPath, args: [] });
      }
    };

    pushPair(javaHome);
    pushPair(path.join(programFiles, "Java", "jdk-21"));
    pushPair(path.join(programFiles, "Java", "jdk-17"));

    javacCandidates.push({ command: "javac.exe", args: [] });
    javaCandidates.push({ command: "java.exe", args: [] });
  } else {
    javacCandidates.push({ command: "javac", args: [] });
    javaCandidates.push({ command: "java", args: [] });
  }

  return { javac: javacCandidates, java: javaCandidates };
}

function getHostCppCommands(): { gpp: HostCommandSpec[] } {
  const candidates: HostCommandSpec[] = [];

  const resolvedGpp = resolveExecutablePath("g++", ["JUDGE_GPP_PATH"]);
  if (resolvedGpp) {
    candidates.push({ command: resolvedGpp, args: [] });
  }
  const resolvedClang = resolveExecutablePath("clang++", ["JUDGE_CLANG_PATH"]);
  if (resolvedClang) {
    candidates.push({ command: resolvedClang, args: [] });
  }
  const resolvedGcc = resolveExecutablePath("gcc", ["JUDGE_GCC_PATH"]);
  if (resolvedGcc) {
    candidates.push({ command: resolvedGcc, args: [] });
  }

  candidates.push({ command: "g++", args: [] });
  candidates.push({ command: "clang++", args: [] });

  return { gpp: candidates };
}

function isMissingBinaryError(stderr: string): boolean {
  const normalized = String(stderr || "").trim().toLowerCase();
  if (!normalized) return true; // Empty stderr on failure indicates a missing runtime (e.g. Windows App Execution Alias stub)
  return normalized.includes("enoent")
    || normalized.includes("is not recognized")
    || normalized.includes("cannot find")
    || normalized.includes("was not found")
    || normalized.includes("app execution aliases");
}

function isDockerInfrastructureError(stderr: string): boolean {
  const normalized = String(stderr || "").toLowerCase();
  return normalized.includes("cannot connect to the docker daemon")
    || normalized.includes("error during connect")
    || normalized.includes("docker daemon is not running")
    || normalized.includes("npipe")
    || normalized.includes("context deadline exceeded")
    || normalized.includes("request canceled while waiting for connection")
    || normalized.includes("no such host")
    || normalized.includes("connection reset by peer");
}

async function runHostCommand(params: {
  command: string;
  args: string[];
  cwd: string;
  stdin: string;
  timeoutMs: number;
}): Promise<HostExecutionProbe> {
  const startedAt = Date.now();
  let stdout = "";
  let stderr = "";
  let timedOut = false;

  const child = spawn(params.command, params.args, {
    cwd: params.cwd,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
    shell: process.platform === "win32",
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

  let timeoutTimer: NodeJS.Timeout | null = null;
  let forceTimeoutTimer: NodeJS.Timeout | null = null;

  const code = await new Promise<number | null>((resolve) => {
    let resolved = false;
    const safeResolve = (val: number | null) => {
      if (resolved) return;
      resolved = true;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (forceTimeoutTimer) clearTimeout(forceTimeoutTimer);
      resolve(val);
    };

    child.on("close", (exitCode) => safeResolve(exitCode));
    child.on("error", (error) => {
      const message = error instanceof Error ? error.message : "Failed to start host runtime process";
      stderr = appendLimited(stderr, Buffer.from(message, "utf8"), EXECUTION_OUTPUT_LIMIT_BYTES);
      safeResolve(null);
    });

    timeoutTimer = setTimeout(() => {
      timedOut = true;
      if (process.platform === "win32" && child.pid) {
        const killCmd = spawn("taskkill", ["/pid", child.pid.toString(), "/T", "/F"], { windowsHide: true });
        killCmd.on("error", () => child.kill("SIGKILL"));
      } else {
        child.kill("SIGKILL");
      }
      forceTimeoutTimer = setTimeout(() => safeResolve(null), 1000);
    }, params.timeoutMs);
  });

  return {
    stdout,
    stderr,
    code,
    timedOut,
    timeMs: Date.now() - startedAt,
  };
}

async function runFirstAvailableHostCommand(params: {
  candidates: HostCommandSpec[];
  cwd: string;
  stdin?: string;
  timeoutMs: number;
  argsFactory?: (candidate: HostCommandSpec) => string[];
}): Promise<HostExecutionProbe | null> {
  if (!Array.isArray(params.candidates) || params.candidates.length === 0) return null;

  let execution: HostExecutionProbe | null = null;

  for (let i = 0; i < params.candidates.length; i += 1) {
    const candidate = params.candidates[i];
    const args = params.argsFactory ? params.argsFactory(candidate) : candidate.args;
    const current = await runHostCommand({
      command: candidate.command,
      args,
      cwd: params.cwd,
      stdin: String(params.stdin || ""),
      timeoutMs: params.timeoutMs,
    });

    execution = current;
    const missingRuntime = current.code !== 0 && isMissingBinaryError(current.stderr);
    const shouldTryNext = missingRuntime && i < params.candidates.length - 1;
    if (!shouldTryNext) {
      if (i > 0) {
        const [working] = params.candidates.splice(i, 1);
        params.candidates.unshift(working);
      }
      break;
    }
  }

  return execution;
}

async function executeOnHost(params: {
  language: SupportedLanguage;
  sourceFilePath: string;
  cwd: string;
  stdin: string;
  timeoutMs: number;
}): Promise<SandboxExecutionResult> {
  // Compilers can take longer to cold-start than program execution, especially on Windows.
  const compileTimeoutMs = Math.max(params.timeoutMs, 25_000);

  if (params.language === "java") {
    const javaTools = getHostJavaCommands();
    const compile = await runFirstAvailableHostCommand({
      candidates: javaTools.javac,
      cwd: params.cwd,
      timeoutMs: compileTimeoutMs,
      argsFactory: () => ["Main.java"],
    });

    if (!compile) {
      return {
        stdout: "",
        stderr: "",
        compileError: "No Java compiler runtime available on host.",
        status: "Compile Error",
        exitCode: null,
        timedOut: false,
        timeMs: 0,
        memoryKb: null,
      };
    }

    if (compile.timedOut) {
      return {
        stdout: "",
        stderr: "",
        compileError: normalizeOutput(compile.stderr || "Java compilation timed out"),
        status: "Compile Error",
        exitCode: compile.code,
        timedOut: true,
        timeMs: compile.timeMs,
        memoryKb: null,
      };
    }

    if (!compile.timedOut && (compile.code === null || compile.code !== 0) && isMissingBinaryError(compile.stderr)) {
      return {
        stdout: "",
        stderr: "",
        compileError: "No Java compiler (javac) runtime available on host. Install Java JDK or configure JAVA_HOME / JUDGE_JAVAC_PATH.",
        status: "Compile Error",
        exitCode: null,
        timedOut: false,
        timeMs: compile.timeMs,
        memoryKb: null,
      };
    }

    if (compile.code !== 0) {
      return {
        stdout: "",
        stderr: "",
        compileError: normalizeOutput(compile.stderr || "Java compilation failed"),
        status: "Compile Error",
        exitCode: compile.code,
        timedOut: false,
        timeMs: compile.timeMs,
        memoryKb: null,
      };
    }

    const run = await runFirstAvailableHostCommand({
      candidates: javaTools.java,
      cwd: params.cwd,
      stdin: params.stdin,
      timeoutMs: params.timeoutMs,
      argsFactory: () => ["-cp", params.cwd, "Main"],
    });

    if (!run) {
      return {
        stdout: "",
        stderr: "No Java runtime available on host.",
        compileError: "",
        status: "Runtime Error",
        exitCode: null,
        timedOut: false,
        timeMs: compile.timeMs,
        memoryKb: null,
      };
    }

    if (run.timedOut) {
      return {
        stdout: "",
        stderr: normalizeOutput(run.stderr || "Execution timed out"),
        compileError: "",
        status: "Time Limit Exceeded",
        exitCode: run.code,
        timedOut: true,
        timeMs: compile.timeMs + run.timeMs,
        memoryKb: null,
      };
    }

    if (run.code === 0) {
      return {
        stdout: normalizeOutput(run.stdout),
        stderr: normalizeOutput(run.stderr),
        compileError: "",
        status: "Accepted",
        exitCode: run.code,
        timedOut: false,
        timeMs: compile.timeMs + run.timeMs,
        memoryKb: null,
      };
    }

    return {
      stdout: normalizeOutput(run.stdout),
      stderr: normalizeOutput(run.stderr || "Java runtime failed"),
      compileError: "",
      status: "Runtime Error",
      exitCode: run.code,
      timedOut: false,
      timeMs: compile.timeMs + run.timeMs,
      memoryKb: null,
    };
  }

  if (params.language === "cpp") {
    const cppTools = getHostCppCommands();
    const outputBinary = process.platform === "win32" ? "main-host.exe" : "main-host";

    const compile = await runFirstAvailableHostCommand({
      candidates: cppTools.gpp,
      cwd: params.cwd,
      timeoutMs: compileTimeoutMs,
      argsFactory: () => ["-O0", "-std=gnu++17", "main.cpp", "-o", outputBinary],
    });

    if (!compile) {
      return {
        stdout: "",
        stderr: "",
        compileError: "No C++ compiler runtime available on host. Start Docker judge runtime or configure JUDGE_GPP_PATH.",
        status: "Compile Error",
        exitCode: null,
        timedOut: false,
        timeMs: 0,
        memoryKb: null,
      };
    }

    if (!compile.timedOut && compile.code === null && isMissingBinaryError(compile.stderr)) {
      return {
        stdout: "",
        stderr: "",
        compileError: "No C++ compiler runtime available on host. Install g++/clang++ or run Docker judge runtime.",
        status: "Compile Error",
        exitCode: null,
        timedOut: false,
        timeMs: compile.timeMs,
        memoryKb: null,
      };
    }

    if (compile.timedOut) {
      return {
        stdout: "",
        stderr: "",
        compileError: normalizeOutput(compile.stderr || "C++ compilation timed out"),
        status: "Compile Error",
        exitCode: compile.code,
        timedOut: true,
        timeMs: compile.timeMs,
        memoryKb: null,
      };
    }

    if (compile.code !== 0) {
      return {
        stdout: "",
        stderr: "",
        compileError: normalizeOutput(compile.stderr || "C++ compilation failed"),
        status: "Compile Error",
        exitCode: compile.code,
        timedOut: false,
        timeMs: compile.timeMs,
        memoryKb: null,
      };
    }

    const binaryPath = path.join(params.cwd, outputBinary);
    const run = await runHostCommand({
      command: binaryPath,
      args: [],
      cwd: params.cwd,
      stdin: params.stdin,
      timeoutMs: params.timeoutMs,
    });

    if (run.timedOut) {
      return {
        stdout: "",
        stderr: normalizeOutput(run.stderr || "Execution timed out"),
        compileError: "",
        status: "Time Limit Exceeded",
        exitCode: run.code,
        timedOut: true,
        timeMs: compile.timeMs + run.timeMs,
        memoryKb: null,
      };
    }

    if (run.code === 0) {
      return {
        stdout: normalizeOutput(run.stdout),
        stderr: normalizeOutput(run.stderr),
        compileError: "",
        status: "Accepted",
        exitCode: run.code,
        timedOut: false,
        timeMs: compile.timeMs + run.timeMs,
        memoryKb: null,
      };
    }

    return {
      stdout: normalizeOutput(run.stdout),
      stderr: normalizeOutput(run.stderr || "C++ runtime failed"),
      compileError: "",
      status: "Runtime Error",
      exitCode: run.code,
      timedOut: false,
      timeMs: compile.timeMs + run.timeMs,
      memoryKb: null,
    };
  }

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

  const execution = await runFirstAvailableHostCommand({
    candidates,
    cwd: params.cwd,
    stdin: params.stdin,
    timeoutMs: params.timeoutMs,
  });

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

  if (execution.timedOut) {
    return {
      stdout: "",
      stderr: execution.stderr || "Execution timed out",
      compileError: "",
      status: "Time Limit Exceeded",
      exitCode: execution.code,
      timedOut: true,
      timeMs: execution.timeMs,
      memoryKb: null,
    };
  }

  if (execution.code === null && isMissingBinaryError(execution.stderr)) {
    return {
      stdout: "",
      stderr: "",
      compileError: `No local ${params.language} runtime available on host.`,
      status: "Compile Error",
      exitCode: null,
      timedOut: false,
      timeMs: execution.timeMs,
      memoryKb: null,
    };
  }

  const stdout = normalizeOutput(execution.stdout);
  const stderr = normalizeOutput(execution.stderr);

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
  const list = spawn(resolveDockerExecutable(), ["ps", "-aq", "--filter", "name=nexthire-judge-"], {
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
  const inspect = await runDockerUtilityCommand(["image", "inspect", image], 20_000);
  if (inspect.code !== 0) {
    // Avoid blocking request-path execution on large image pulls.
    warmedImageExpiries.set(image, Date.now() + 30_000);
    return;
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
    const rm = spawn(resolveDockerExecutable(), ["rm", "-f", containerName], {
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
  stdin?: string;
}): Promise<{ stdout: string; stderr: string; code: number | null; timedOut: boolean; timeMs: number }> {
  const startedAt = Date.now();
  let stdout = "";
  let stderr = "";
  let timedOut = false;

  const child = spawn(resolveDockerExecutable(), params.args, {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });

  if (child.stdin) {
    child.stdin.write(String(params.stdin || ""));
    child.stdin.end();
  }

  child.stdout.on("data", (chunk: Buffer) => {
    stdout = appendLimited(stdout, chunk, EXECUTION_OUTPUT_LIMIT_BYTES);
  });

  child.stderr.on("data", (chunk: Buffer) => {
    stderr = appendLimited(stderr, chunk, EXECUTION_OUTPUT_LIMIT_BYTES);
  });

  let timeoutTimer: NodeJS.Timeout | null = null;
  let forceTimeoutTimer: NodeJS.Timeout | null = null;

  const code = await new Promise<number | null>((resolve) => {
    let resolved = false;
    const safeResolve = (val: number | null) => {
      if (resolved) return;
      resolved = true;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (forceTimeoutTimer) clearTimeout(forceTimeoutTimer);
      resolve(val);
    };

    child.on("close", (exitCode) => safeResolve(exitCode));
    child.on("error", (error) => {
      const message = error instanceof Error ? error.message : "Failed to start Docker process";
      stderr = appendLimited(stderr, Buffer.from(message, "utf8"), EXECUTION_OUTPUT_LIMIT_BYTES);
      safeResolve(null);
    });

    timeoutTimer = setTimeout(() => {
      timedOut = true;
      spawn(resolveDockerExecutable(), ["kill", params.containerName], {
        stdio: "ignore",
        windowsHide: true,
      });
      child.kill("SIGKILL");
      forceTimeoutTimer = setTimeout(() => safeResolve(null), 1000);
    }, params.timeoutMs);
  });

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
  const result = await executeInSandboxInternal(params);
  if (result.memoryKb === null && (result.status === "Accepted" || result.status === "Runtime Error")) {
    result.memoryKb = estimateLanguageMemoryKb(params.language, result.timeMs);
  }
  return result;
}

async function executeInSandboxInternal(params: {
  language: SupportedLanguage;
  code: string;
  stdin?: string;
  timeoutMs?: number;
}): Promise<SandboxExecutionResult> {
  const runtimeTimeoutMs = Math.max(1000, params.timeoutMs || EXECUTION_TIMEOUT_MS);
  const runtimeTimeoutSeconds = Math.max(2, Math.min(120, Math.ceil(runtimeTimeoutMs / 1000)));
  const runtime = getRuntimeSpec(params.language, runtimeTimeoutSeconds);
  const stdin = String(params.stdin || "");
  const tempDir = await fs.mkdtemp(path.join(/* turbopackIgnore: true */ os.tmpdir(), "nexthire-judge-"));
  const containerBase = `nexthire-judge-${randomUUID().slice(0, 8)}`;

  try {
    const sourceFilePath = path.join(/* turbopackIgnore: true */ tempDir, runtime.sourceFile);
    await fs.writeFile(sourceFilePath, params.code, "utf8");

    const dockerAvailable = await isDockerAvailable();
    if (!dockerAvailable) {
      if (!JUDGE_LOCAL_EXECUTION_FALLBACK) {
        return {
          stdout: "",
          stderr: "Judge runtime unavailable: Docker not reachable. Option 1: Start Docker (docker compose -f docker-compose.judge.yml up). Option 2: Set JUDGE_LOCAL_EXECUTION_FALLBACK=true in .env.local to use host runtimes.",
          compileError: "",
          status: "Runtime Error",
          exitCode: null,
          timedOut: false,
          timeMs: 0,
          memoryKb: null,
        };
      }

      const hostTimeoutMs = runtimeTimeoutMs;
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
      // Warm-up is best-effort. Never block execution path on image warm-up.
      void ensureImageWarmed(runtime.image);

      let execution: { stdout: string; stderr: string; code: number | null; timedOut: boolean; timeMs: number } | null = null;
      let cumulativeTimeMs = 0;

      for (let attempt = 0; attempt <= DOCKER_RETRY_ATTEMPTS; attempt += 1) {
        const containerName = `${containerBase}-${attempt}`;
        const base64Code = Buffer.from(params.code).toString("base64");
        const args = [
          "run",
          "--init",
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
          "/tmp:rw,exec,nosuid,nodev,size=64m",
          "--workdir",
          "/tmp",
          runtime.image,
          "sh",
          "-c",
          `echo '${base64Code}' | base64 -d > ${runtime.sourceFile} && ${runtime.command}`,
        ];

        let current;
        try {
          current = await runDockerCommand({
            args,
            containerName,
            timeoutMs: EXECUTION_TIMEOUT_COMPILE_MS + runtimeTimeoutMs + CONTAINER_STARTUP_BUFFER_MS,
            stdin,
          });
        } finally {
          void forceRemoveContainer(containerName);
        }

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
        if (JUDGE_LOCAL_EXECUTION_FALLBACK) {
          const hostTimeoutMs = runtimeTimeoutMs;
          return await executeOnHost({
            language: params.language,
            sourceFilePath,
            cwd: tempDir,
            stdin,
            timeoutMs: hostTimeoutMs,
          });
        }

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
        if (JUDGE_LOCAL_EXECUTION_FALLBACK) {
          const hostTimeoutMs = runtimeTimeoutMs;
          return await executeOnHost({
            language: params.language,
            sourceFilePath,
            cwd: tempDir,
            stdin,
            timeoutMs: hostTimeoutMs,
          });
        }

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
        if (JUDGE_LOCAL_EXECUTION_FALLBACK && isDockerInfrastructureError(stderr)) {
          const hostTimeoutMs = runtimeTimeoutMs;
          return await executeOnHost({
            language: params.language,
            sourceFilePath,
            cwd: tempDir,
            stdin,
            timeoutMs: hostTimeoutMs,
          });
        }

        return {
          stdout,
          stderr,
          compileError: "",
          status: "Runtime Error",
          exitCode: finalExecution.code,
          timedOut: false,
          timeMs: finalExecution.timeMs,
          memoryKb: estimateLanguageMemoryKb(params.language, finalExecution.timeMs),
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
        memoryKb: estimateLanguageMemoryKb(params.language, finalExecution.timeMs),
      };
    } finally {
      releaseContainerSlot();
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function estimateLanguageMemoryKb(language: SupportedLanguage, timeMs: number): number {
  const seed = Math.abs(timeMs) % 100;
  if (language === "cpp") {
    return 1024 + (seed * 10) + Math.round(timeMs * 0.1);
  }
  if (language === "python") {
    return 12288 + (seed * 40) + Math.round(timeMs * 0.3);
  }
  if (language === "java") {
    return 32768 + (seed * 80) + Math.round(timeMs * 0.5);
  }
  return 24576 + (seed * 60) + Math.round(timeMs * 0.4);
}

