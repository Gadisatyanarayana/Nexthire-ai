export class CostTracker {
  private static readonly RATES = {
    'gpt-4': { prompt: 0.03, completion: 0.06 },
    'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
    'claude-3-opus': { prompt: 0.015, completion: 0.075 },
  };

  /**
   * Calculates the cost of an LLM invocation and attributes it to a specific feature/cost center.
   */
  public calculateAndLogCost(
    model: string, 
    promptTokens: number, 
    completionTokens: number, 
    costCenter: string
  ): number {
    const rate = CostTracker.RATES[model as keyof typeof CostTracker.RATES];
    if (!rate) return 0;

    const cost = (promptTokens / 1000) * rate.prompt + (completionTokens / 1000) * rate.completion;
    
    // In a real system, this would emit a metric to Prometheus / Datadog or a DB table
    console.log(`[COST] Model: ${model} | Center: ${costCenter} | Cost: $${cost.toFixed(4)}`);
    return cost;
  }
}
