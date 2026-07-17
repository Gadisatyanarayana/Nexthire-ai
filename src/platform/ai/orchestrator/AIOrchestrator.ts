import { AIPlanner } from '../planner/AIPlanner';
import { CapabilityRegistry } from '../capabilities/CapabilityRegistry';

export class AIOrchestrator {
  constructor(
    private planner: AIPlanner,
    private capabilityRegistry: CapabilityRegistry
  ) {}

  /**
   * The core pipeline: Intent -> Planner -> Memory -> RAG -> Tool -> LLM -> Validator -> Streaming
   */
  public async orchestrate(userInput: string, sessionId: string): Promise<void> {
    // 1. Intent Detection & Planning
    const plan = this.planner.generatePlan(userInput);

    // 2. Iterate through plan
    for (const step of plan) {
      if (step === 'Respond to User') {
        // Trigger LLM response via Gateway
      } else {
        // Trigger specific capability
        const agents = this.capabilityRegistry.resolveAgents(step);
        // Dispatch to appropriate agent
      }
    }
  }
}
