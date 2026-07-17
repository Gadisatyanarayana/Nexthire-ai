# Execution Protocol Specification (Frozen)

This document defines the strict protocols governing the communication between the Queue, Worker, Sandbox, Judge, and Event Bus.

## 1. Observability Protocol
Every execution flow MUST propagate the following context:
```typescript
interface ExecutionContext {
  traceId: string;
  submissionId: string;
  workerId: string;
  sandboxId: string;
  judgeVersion: string;
  compilerVersion: string;
  queueName: string;
}
```

## 2. Worker Protocol
The worker pulls from the Priority Queue and orchestrates the pipeline.
- `Submission -> Compiler -> Artifact -> Runner -> Raw Result -> Comparator -> Verdict -> Score -> Review`
- The worker is stateless. State is managed via `coding_submissions` updates.

## 3. Sandbox Protocol
The Sandbox Manager injects policies.
```typescript
interface ExecutionProfile {
  cpuCores: number;
  memoryLimitKb: number;
  wallClockTimeMs: number;
  cpuTimeMs: number;
  maxProcesses: number;
  maxThreads: number;
  networkEnabled: boolean;
  maxFileSizeKb: number;
}
```

## 4. Judge Protocol
The Judge evaluates the `Raw Result`.
- Standard Output Comparator: Strict string matching.
- Floating Comparator: Precision tolerance.
- Custom Checker: Executes a `.cpp` binary to evaluate stdout.
- Interactive Interactor: Communicates via stdin/stdout pipes.

## 5. Event Protocol
Events are strictly versioned.
- `CodingSubmitted.v1`
- `CompilationStarted.v1`
- `CompilationFinished.v1`
- `ExecutionStarted.v1`
- `ExecutionFinished.v1`
- `CodingJudged.v1`
- `CodingReviewed.v1`

## 6. Outbox Protocol
The worker MUST commit the final Verdict to `coding_submissions` and the `CodingJudged.v1` event to `outbox_events` in the SAME database transaction.
