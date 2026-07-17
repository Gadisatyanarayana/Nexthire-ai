export interface ExecutionPolicy {
  cpuCores: number;
  wallClockTimeMs: number;
  cpuTimeMs: number;
  memoryLimitKb: number;
  maxProcesses: number;
  maxThreads: number;
  maxFileSizeKb: number;
  networkEnabled: boolean;
  allowedEnvVars: string[];
}

export interface ExecutionArtifact {
  id: string;
  submissionId: string;
  artifactType: 'COMPILER_LOG' | 'EXECUTABLE' | 'RUNTIME_STDOUT' | 'RUNTIME_STDERR';
  storageUri: string;
  expiresAt: Date;
}
