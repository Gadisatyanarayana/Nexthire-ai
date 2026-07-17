export class AIPlanner {
  /**
   * Generates a deterministic execution plan before calling agents or tools.
   */
  public generatePlan(intent: string): string[] {
    // Basic stub logic: based on intent, we return a list of capabilities
    if (intent.includes('Amazon OA')) {
      return ['Retrieve Syllabus', 'Retrieve Weak Topics', 'Generate Roadmap'];
    }
    return ['Respond to User'];
  }
}
