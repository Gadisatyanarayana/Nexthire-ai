import { CodingJudgedEvent } from '../events/CodingEvents';

export class CodingAnalyticsWorker {
  /**
   * Consumes `CodingJudged.v1` events to maintain Operational and Analytics Read Models
   */
  public async onCodingJudged(event: CodingJudgedEvent) {
    const { problemId, verdict, runtimeMs, memoryKb } = event.payload;

    if (verdict === 'AC') {
      // 1. Update Acceptance Read Model
      await this.incrementAcceptance(problemId);

      // 2. Update Runtime/Memory Percentiles Read Model
      await this.recordRuntimeMetrics(problemId, runtimeMs, memoryKb);
    } else {
      await this.incrementFailure(problemId);
    }
  }

  private async incrementAcceptance(problemId: string) {
    // Upsert logic for DB or Redis Read Model 'analytics_acceptance_rates'
  }

  private async incrementFailure(problemId: string) {
    // Upsert logic for DB or Redis Read Model 'analytics_acceptance_rates'
  }

  private async recordRuntimeMetrics(problemId: string, runtimeMs: number, memoryKb: number) {
    // Add to 'analytics_runtime_distributions' to calculate O(N) percentiles
  }
}
