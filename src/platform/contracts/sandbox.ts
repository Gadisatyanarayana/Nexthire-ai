import { ExecutionPolicy } from './execution';

export interface ExecutionResult {
  exitCode: number;
  stdoutUri?: string;
  stderrUri?: string;
  cpuTimeMs: number;
  memoryPeakKb: number;
  error?: string;
}

export interface SandboxProvider {
  providerName: string;
  
  initializeContainer(policy: ExecutionPolicy): Promise<string>;
  copyArtifactToSandbox(containerId: string, artifactUri: string): Promise<void>;
  executeCommand(containerId: string, command: string[]): Promise<ExecutionResult>;
  destroyContainer(containerId: string): Promise<void>;
}
