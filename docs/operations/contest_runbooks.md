# Contest Operational Runbooks (Frozen)

This defines the SOP for Incident Management during Live Contests.

## 1. Pausing a Live Contest
**Trigger**: Complete Judge outage, Redis cluster failure, or severe platform DDOS.
**Action**:
1. Execute `POST /api/v1/contest/:id/pause`.
2. State transitions to `PAUSED`.
3. Broadcast Engine pushes `ContestPaused.v1` to all connected clients.
4. Active submissions in Queue are placed in a `HOLD` state.

## 2. Rejudging Submissions
**Trigger**: A hidden test case was incorrect, discovered mid-contest.
**Action**:
1. Fix problem aggregate.
2. Execute `POST /api/v1/contest/:id/rejudge?problemId=X`.
3. System routes all `AC`, `WA`, `TLE` submissions for that problem to the `Rejudge Queue`.
4. Leaderboard is re-calculated asynchronously without locking DB.

## 3. Leaderboard Freeze
**Trigger**: Automated schedule via `FreezePolicy` (e.g. Last 1 Hour).
**Action**:
1. Scheduler emits `ContestFrozen.v1`.
2. Live Leaderboard UI caches final state.
3. Submissions still graded and CQRS projections continue internally, but are masked from `Observer` and `Participant` views.

## 4. Scheduler Recovery
**Trigger**: Worker node hosting the Contest Scheduler crashes exactly when a contest should start.
**Action**:
1. Kubernetes spins up new Scheduler worker.
2. Scheduler queries `SELECT * FROM contests WHERE state = 'SCHEDULED' AND start_time <= NOW()`.
3. Contests missed by `< 5 minutes` are immediately transitioned to `ACTIVE`.
4. Over `5 minutes` requires manual Admin override.

## 5. Plagiarism Incident
**Trigger**: High similarity report post-contest.
**Action**:
1. Report flagged for Moderator Console.
2. Moderator selects `Disqualify`.
3. Event `ContestRatingCalculated.v1` is invalidated and re-run for all participants below the disqualified user.
