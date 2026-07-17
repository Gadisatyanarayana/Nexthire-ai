import { ContestAggregate } from '../../src/platform/contest/domain/ContestAggregate';
import { ACMScoringEngine } from '../../src/platform/contest/engines/ScoringEngine';
import { ClarificationSystem } from '../../src/platform/contest/engines/ClarificationSystem';
import { RejudgeEngine } from '../../src/platform/contest/engines/RejudgeEngine';

describe('PRR-11 & PRR-12: Contest Operational Resilience & E2E', () => {

  it('PRR-11: Should safely Pause and Resume the Aggregate without corruption', () => {
    const contestData: any = { id: 'c-1', state: 'ACTIVE', schedule: { startTime: new Date(Date.now() - 1000), endTime: new Date(Date.now() + 10000) } };
    const aggregate = ContestAggregate.hydrate(contestData, {} as any, {} as any, {} as any, {} as any);

    expect(aggregate.state).toBe('ACTIVE');

    aggregate.pause();
    expect(aggregate.state).toBe('PAUSED');

    aggregate.resume();
    expect(aggregate.state).toBe('ACTIVE');
  });

  it('PRR-12: End-to-End Scoring and Clarification Broadcasts', async () => {
    // ACM Scoring
    const engine = new ACMScoringEngine();
    const result = engine.calculateScore(
      { verdict: 'AC', createdAt: new Date(Date.now() + 120000), contestStartTime: new Date(Date.now()), previousRejectedAttempts: 1 }, 
      { score: 0, penalty: 0 }
    );
    // 2 minutes passed + 20 mins penalty for 1 reject
    expect(result.score).toBe(1);
    expect(result.penalty).toBe(22);

    // Clarification Broadcasts
    const mockBroadcast = { broadcast: jest.fn().mockResolvedValue(undefined), providerId: 'SSE' };
    const system = new ClarificationSystem(mockBroadcast);
    await system.respondToClarification('clar-1', 'c-1', 'Yes, inputs are positive.');

    expect(mockBroadcast.broadcast).toHaveBeenCalledWith('contest:c-1:clarifications', expect.any(Object));
  });

  it('PRR-11: Rejudge Engine should push to queue without hanging', async () => {
    const mockQueue = { enqueue: jest.fn().mockResolvedValue(undefined), dequeue: jest.fn(), ack: jest.fn(), nack: jest.fn() };
    const rejudge = new RejudgeEngine(mockQueue);

    await rejudge.submitForRejudge({ id: 'sub-1', problemId: 'p-1', language: 'python', tenantId: 't-1' } as any);

    expect(mockQueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      submissionId: 'sub-1', priority: 100
    }));
  });

});
