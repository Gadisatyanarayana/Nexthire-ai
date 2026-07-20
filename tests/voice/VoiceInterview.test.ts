import { VoiceInterviewAggregate } from '../../src/platform/voice/domain/VoiceInterviewAggregate';
import { SpeechEvaluationService } from '../../src/platform/voice/services/SpeechEvaluationService';
import { VoiceInterviewSession } from '../../src/platform/contracts/voice';

describe('Milestone 7: Voice Interview Simulator Verification', () => {

  const createMockSession = (): VoiceInterviewSession => ({
    id: 'session-123',
    userId: 'user-456',
    tenantId: 'tenant-abc',
    companyName: 'Stripe',
    jobRole: 'Backend Engineer',
    questions: ['Explain idempotency in APIs', 'Describe the write-ahead log'],
    currentQuestionIndex: 0,
    audioUrls: [],
    state: 'INITIALIZED',
    createdAt: new Date()
  });

  describe('VoiceInterviewAggregate Invariants', () => {
    it('should throw error if initialized without microphone permissions', () => {
      const session = createMockSession();
      expect(() => {
        VoiceInterviewAggregate.create(session, false);
      }).toThrow('Cannot initialize Voice Interview without microphone permissions.');
    });

    it('should proceed through start and nextQuestion transitions', () => {
      const session = createMockSession();
      const aggregate = VoiceInterviewAggregate.create(session, true);

      expect(aggregate.state).toBe('INITIALIZED');
      aggregate.start();
      expect(aggregate.state).toBe('IN_PROGRESS');

      aggregate.addAudioUrl('s3://audio/stripe-1.mp3');
      expect(aggregate.session.audioUrls).toContain('s3://audio/stripe-1.mp3');

      aggregate.nextQuestion();
      expect(aggregate.session.currentQuestionIndex).toBe(1);
      
      aggregate.nextQuestion();
      expect(aggregate.state).toBe('COMPLETED');
    });

    it('should reject audio submissions if session is completed', () => {
      const session = createMockSession();
      const aggregate = VoiceInterviewAggregate.create(session, true);
      aggregate.start();
      aggregate.nextQuestion();
      aggregate.nextQuestion(); // completed state

      expect(() => {
        aggregate.addAudioUrl('s3://audio/stripe-2.mp3');
      }).toThrow('Cannot submit audio when interview is not active.');
    });
  });

  describe('SpeechEvaluationService Calculations', () => {
    const evaluator = new SpeechEvaluationService();

    it('should penalize stutter words and score fluency correctly', async () => {
      const stutterTranscript = 'Um, I think, like, idempotency guarantees that, uh, duplicate requests return identical results. This means that if you make the same request multiple times, the server will process it once and then return the cached output for the remaining calls without any side effects. This is a critical pattern in distributed systems to prevent double charging or duplicate actions when network timeouts occur during API interactions. We must implement this to guarantee safety across all client applications.';
      const result = await evaluator.evaluateTranscript(stutterTranscript, ['idempotency', 'duplicate']);

      // expect fluency score penalty (3 stutters: um, like, uh)
      expect(result.fluencyScore).toBeLessThan(100);
      expect(result.keywordMatchRate).toBe(100);
      expect(result.tone).toBe('confident'); // stutters <= 4 and WPM >= 100
    });

    it('should detect hesitant tone if stutters are high', async () => {
      const hesitantTranscript = 'Um, uh, ah, like, yes, the write ahead log, um, writes changes to disk.';
      const result = await evaluator.evaluateTranscript(hesitantTranscript, ['disk']);

      expect(result.tone).toBe('hesitant');
    });

    it('should compute words per minute accurately based on a 45 second response duration', async () => {
      // 90 words transcript / 0.75 minutes = 120 WPM
      const words = Array(90).fill('word').join(' ');
      const result = await evaluator.evaluateTranscript(words, []);

      expect(result.wordsPerMinute).toBe(120);
    });
  });

});
