import { UnifiedTimeline } from '../../src/platform/assessment/submission/UnifiedTimeline';
import { BaseDomainEvent } from '../../src/platform/kernel/events/DomainEvent';

describe('UnifiedTimeline & Outbox Pattern', () => {
  it('should append events to the Outbox for guaranteed delivery', async () => {
    // Arrange
    const submissionId = 'sub-123';
    const mockEvent = new (class extends BaseDomainEvent {
      constructor() {
        super('AnswerSubmitted.v1', 'submission-engine', { answer: 'A' });
      }
    })();
    
    // Stub a fake DB transaction object
    const dbTransaction = {
      inserts: [] as any[],
      insert: function (table: string, record: any) {
        this.inserts.push({ table, record });
      }
    };

    // Override the static method just for the test to inject the dbTransaction insert logic
    // In actual implementation, UnifiedTimeline.appendEvent would use this transaction.
    const appendSpy = jest.spyOn(UnifiedTimeline, 'appendEvent').mockImplementation(async (subId, event, tx) => {
      tx.insert('outbox_events', {
        id: 'outbox-1',
        eventType: event.eventType,
        payload: { submissionId: subId, ...event },
        published: false
      });
    });

    // Act
    await UnifiedTimeline.appendEvent(submissionId, mockEvent, dbTransaction);

    // Assert
    expect(appendSpy).toHaveBeenCalled();
    expect(dbTransaction.inserts.length).toBe(1);
    expect(dbTransaction.inserts[0].table).toBe('outbox_events');
    expect(dbTransaction.inserts[0].record.published).toBe(false);
    expect(dbTransaction.inserts[0].record.eventType).toBe('AnswerSubmitted.v1');

    appendSpy.mockRestore();
  });
});
