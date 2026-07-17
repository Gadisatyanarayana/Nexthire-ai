/**
 * Proctoring Risk Engine
 * Aggregates browser, camera, and microphone events into a unified Psychometric Risk Score (0-100).
 */

export interface ProctoringEvent {
  type: 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'MULTIPLE_FACES' | 'NO_FACE' | 'VOICE_DETECTED' | 'PASTE_ATTEMPT' | 'DEV_TOOLS_OPENED';
  timestamp: number;
  durationMs?: number; // e.g., how long they were on another tab
  severityWeight: number; // Configurable per tenant
}

export class RiskEngine {
  /**
   * Calculates the overall risk score for a submission based on the timeline of events.
   * Returns a score between 0 and 100.
   */
  static calculateRiskScore(events: ProctoringEvent[]): number {
    let rawScore = 0;
    
    for (const event of events) {
      // Base penalty
      rawScore += event.severityWeight;
      
      // Duration penalty for continuous violations (like being on another tab for 30 seconds)
      if (event.durationMs && event.durationMs > 5000) {
        rawScore += Math.floor(event.durationMs / 5000) * (event.severityWeight * 0.5);
      }
    }

    // Normalize to 0-100
    const normalizedScore = Math.min(100, rawScore);
    return normalizedScore;
  }

  /**
   * Translates the numeric score into an actionable category.
   */
  static categorizeRisk(score: number): 'NORMAL' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL' {
    if (score <= 20) return 'NORMAL';
    if (score <= 60) return 'WARNING';
    if (score <= 90) return 'HIGH_RISK';
    return 'CRITICAL';
  }
}
