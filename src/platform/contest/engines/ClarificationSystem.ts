import { BroadcastProvider } from '../../contracts/contest/contest-notification';

export class ClarificationSystem {
  constructor(private broadcastProvider: BroadcastProvider) {}

  /**
   * Responds to a clarification and broadcasts the answer to all participants in the contest.
   */
  public async respondToClarification(
    clarificationId: string, 
    contestId: string, 
    response: string
  ): Promise<void> {
    
    // 1. Mark in DB as ANSWERED
    // ...

    // 2. Broadcast immediately using SSE/WebSocket via Provider
    await this.broadcastProvider.broadcast(`contest:${contestId}:clarifications`, {
      clarificationId,
      response,
      timestamp: new Date().toISOString()
    });
  }
}
