# Contest Events Catalog (Frozen)

All events are strictly versioned to prevent payload breakage.

### `ContestCreated.v1`
```typescript
{ contestId: string; tenantId: string; timestamp: string; }
```

### `ContestPublished.v1`
```typescript
{ contestId: string; snapshotId: string; integrityHash: string; timestamp: string; }
```

### `ContestStarted.v1`
```typescript
{ contestId: string; participantCount: number; timestamp: string; }
```

### `ContestPaused.v1` / `ContestResumed.v1`
```typescript
{ contestId: string; reason: string; actorId: string; timestamp: string; }
```

### `ContestFinished.v1`
```typescript
{ contestId: string; timestamp: string; }
```

### `ContestFrozen.v1` / `ContestUnfrozen.v1`
```typescript
{ contestId: string; timestamp: string; }
```

### `ContestLeaderboardUpdated.v1`
```typescript
{ contestId: string; userId: string; score: number; rank: number; timestamp: string; }
```

### `ContestRatingCalculated.v1`
```typescript
{ contestId: string; ratings: { userId: string, old: number, new: number }[]; timestamp: string; }
```

### `ContestReplayCreated.v1`
```typescript
{ contestId: string; replayS3Uri: string; timestamp: string; }
```

### `ContestAppealSubmitted.v1` / `ContestAppealResolved.v1`
```typescript
{ appealId: string; contestId: string; submissionId: string; status: string; timestamp: string; }
```
