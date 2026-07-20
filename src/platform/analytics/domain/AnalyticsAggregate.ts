import { CandidateScorecard, EventIngestionPayload } from '../../contracts/analytics';

export class AnalyticsAggregate {
  private _scorecard: CandidateScorecard;

  private constructor(scorecard: CandidateScorecard) {
    this._scorecard = scorecard;
  }

  public static initializeScorecard(userId: string, tenantId: string): AnalyticsAggregate {
    return new AnalyticsAggregate({
      userId,
      tenantId,
      learningEfficiencyScore: 0,
      retentionScore: 0,
      codingCompetencyScore: 0,
      voiceFluencyScore: 0,
      globalPlacementReadiness: 0,
      lastUpdated: new Date()
    });
  }

  public static hydrate(scorecard: CandidateScorecard): AnalyticsAggregate {
    return new AnalyticsAggregate(scorecard);
  }

  public get scorecard(): CandidateScorecard {
    return this._scorecard;
  }

  public applyEvent(event: EventIngestionPayload): void {
    if (event.userId !== this._scorecard.userId) {
      throw new Error(`Event userId mismatch. Expected ${this._scorecard.userId} but got ${event.userId}`);
    }

    switch (event.eventType) {
      case 'CodingSubmitted.v1':
        if (typeof event.metrics.score === 'number') {
          // EWMA for updating coding score
          this._scorecard.codingCompetencyScore = Math.round(
            this._scorecard.codingCompetencyScore === 0 
              ? event.metrics.score 
              : (this._scorecard.codingCompetencyScore * 0.7) + (event.metrics.score * 0.3)
          );
        }
        break;

      case 'VoiceCompleted.v1':
        if (typeof event.metrics.fluencyScore === 'number') {
          this._scorecard.voiceFluencyScore = Math.round(
            this._scorecard.voiceFluencyScore === 0 
              ? event.metrics.fluencyScore 
              : (this._scorecard.voiceFluencyScore * 0.7) + (event.metrics.fluencyScore * 0.3)
          );
        }
        break;

      case 'AssessmentCompleted.v1':
      case 'LearningTopicMastered.v1':
        if (typeof event.metrics.retention === 'number') {
           this._scorecard.retentionScore = event.metrics.retention;
        }
        if (typeof event.metrics.efficiency === 'number') {
           this._scorecard.learningEfficiencyScore = event.metrics.efficiency;
        }
        break;
      
      default:
        console.warn(`AnalyticsAggregate: Unrecognized event type ${event.eventType}`);
    }

    this.recalculateGlobalReadiness();
    this._scorecard.lastUpdated = new Date();
  }

  private recalculateGlobalReadiness(): void {
    const scores = [
      this._scorecard.learningEfficiencyScore,
      this._scorecard.retentionScore,
      this._scorecard.codingCompetencyScore,
      this._scorecard.voiceFluencyScore
    ].filter(s => s > 0);

    if (scores.length === 0) {
      this._scorecard.globalPlacementReadiness = 0;
      return;
    }

    const total = scores.reduce((acc, val) => acc + val, 0);
    this._scorecard.globalPlacementReadiness = Math.round(total / scores.length);
  }
}
