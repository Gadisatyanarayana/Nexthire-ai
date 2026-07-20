import { AnalyticsAggregate } from '../../src/platform/analytics/domain/AnalyticsAggregate';
import { TelemetryConsumer } from '../../src/platform/analytics/services/TelemetryConsumer';
import { EventIngestionPayload } from '../../src/platform/contracts/analytics';

describe('Analytics Pipeline & Aggregate Tests', () => {
  const userId = 'user-test-123';
  const tenantId = 'tenant-xyz';
  let consumer: TelemetryConsumer;

  beforeEach(() => {
    consumer = new TelemetryConsumer();
  });

  it('should initialize a scorecard correctly', () => {
    const aggregate = AnalyticsAggregate.initializeScorecard(userId, tenantId);
    expect(aggregate.scorecard.userId).toBe(userId);
    expect(aggregate.scorecard.globalPlacementReadiness).toBe(0);
  });

  it('should apply AssessmentCompleted.v1 and CodingSubmitted.v1 events correctly', async () => {
    const assessmentEvent: EventIngestionPayload = {
      eventId: 'evt-1',
      eventType: 'AssessmentCompleted.v1',
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
      metrics: {
        efficiency: 85,
        retention: 90
      }
    };

    await consumer.handleEvent(assessmentEvent);
    
    let aggregate = await consumer.getScorecard(userId);
    expect(aggregate).not.toBeNull();
    expect(aggregate!.scorecard.learningEfficiencyScore).toBe(85);
    expect(aggregate!.scorecard.retentionScore).toBe(90);
    // Global readiness = average of [85, 90] = 88
    expect(aggregate!.scorecard.globalPlacementReadiness).toBe(88);

    const codingEvent: EventIngestionPayload = {
      eventId: 'evt-2',
      eventType: 'CodingSubmitted.v1',
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
      metrics: {
        score: 75
      }
    };

    await consumer.handleEvent(codingEvent);
    aggregate = await consumer.getScorecard(userId);
    // Coding score from 0 should just be 75
    expect(aggregate!.scorecard.codingCompetencyScore).toBe(75);
    
    // Global readiness = average of [85, 90, 75] = (250 / 3) = 83.33 -> 83
    expect(aggregate!.scorecard.globalPlacementReadiness).toBe(83);
  });

  it('should apply EWMA for subsequent CodingSubmitted.v1 events', async () => {
    const event1: EventIngestionPayload = {
      eventId: 'evt-1',
      eventType: 'CodingSubmitted.v1',
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
      metrics: { score: 75 }
    };
    await consumer.handleEvent(event1);

    const event2: EventIngestionPayload = {
      eventId: 'evt-2',
      eventType: 'CodingSubmitted.v1',
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
      metrics: { score: 100 }
    };
    await consumer.handleEvent(event2);

    const aggregate = await consumer.getScorecard(userId);
    // EWMA: 75 * 0.7 + 100 * 0.3 = 52.5 + 30 = 82.5 -> 83
    expect(aggregate!.scorecard.codingCompetencyScore).toBe(83);
  });
});
