# Coding Domain Events (Frozen)

These events are strictly versioned. Breaking changes require a `.v2`. All events originate via the Outbox Pattern.

## Execution Lifecycle Events

### `CodingSubmitted.v1`
Dispatched when the Priority Queue ingests a new submission.
```typescript
{
  submissionId: string;
  problemId: string;
  userId: string;
  language: string;
  timestamp: string;
}
```

### `CompilationStarted.v1`
```typescript
{
  submissionId: string;
  compilerVersion: string;
  timestamp: string;
}
```

### `CompilationFinished.v1`
```typescript
{
  submissionId: string;
  success: boolean;
  artifactUri?: string; 
  timestamp: string;
}
```

### `ExecutionStarted.v1`
```typescript
{
  submissionId: string;
  sandboxProvider: string; // e.g. "gVisor"
  timestamp: string;
}
```

### `ExecutionFinished.v1`
```typescript
{
  submissionId: string;
  exitCode: number;
  cpuTimeMs: number;
  memoryPeakKb: number;
  timestamp: string;
}
```

### `CodingJudged.v1`
The final definitive verdict published to CQRS Analytics.
```typescript
{
  submissionId: string;
  problemId: string;
  userId: string;
  verdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE';
  runtimeMs: number;
  memoryKb: number;
  passedEdgeCases: boolean;
  timestamp: string;
}
```
