# Language Capability & Sandbox Registry (Frozen)

This document defines how new languages, environments, and resource policies plug into the Core Execution Engine without modifying core logic.

## 1. The LanguageProvider Plugin System
Each language must register its capabilities dynamically.

```typescript
export interface LanguageCapability {
  id: string;             // e.g., 'python-3.11'
  name: string;           // 'Python 3.11'
  
  // Feature Flags shaping the IDE and Execution Engine
  supportsCompile: boolean;
  supportsFormatting: boolean;
  supportsLinting: boolean;
  supportsInteractive: boolean; // REPL capabilities
  supportsSQL: boolean;
  
  // Execution Hooks
  getCompilationCommand(filePath: string): string[]; // Returns ['gcc', '-O2', filePath]
  getExecutionCommand(artifactPath: string): string[];
}
```

## 2. Resource Policies (ExecutionPolicy)
Limits are detached from the Language and bound to the `Problem` or `Sandbox`.

```typescript
export interface ExecutionPolicy {
  cpuCores: number;
  wallClockTimeMs: number; // Hard kill time
  cpuTimeMs: number;       // CPU usage time
  memoryLimitKb: number;
  maxProcesses: number;
  maxThreads: number;
  maxFileSizeKb: number;
  networkEnabled: boolean;
  allowedEnvVars: string[];
}
```

## 3. Sandbox Adapters
Execution Engine communicates strictly through `SandboxProvider`, abstracting the isolation technology.

```typescript
export interface SandboxProvider {
  providerName: string; // 'docker' | 'gvisor' | 'firecracker' | 'deno'
  
  initializeContainer(policy: ExecutionPolicy): Promise<string>;
  copyArtifactToSandbox(containerId: string, artifactUri: string): Promise<void>;
  executeCommand(containerId: string, command: string[]): Promise<ExecutionResult>;
  destroyContainer(containerId: string): Promise<void>;
}
```
