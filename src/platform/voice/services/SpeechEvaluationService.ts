import { SpeechAnalysisResult, SpeechEvaluator } from '../../contracts/voice';

export class SpeechEvaluationService implements SpeechEvaluator {
  /**
   * Evaluates text transcripts to compute mock fluency, keywords hits, and tone parameters.
   */
  public async evaluateTranscript(transcript: string, expectedKeywords: string[]): Promise<SpeechAnalysisResult> {
    const cleanedText = transcript.trim().toLowerCase();
    const words = cleanedText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Simulate WPM calculation: assume average response takes 45 seconds for WPM normalization
    const durationMinutes = 0.75; 
    const wordsPerMinute = Math.round(wordCount / durationMinutes);

    // Calculate keyword matching
    let matchedKeywords = 0;
    for (const kw of expectedKeywords) {
      if (cleanedText.includes(kw.toLowerCase())) {
        matchedKeywords++;
      }
    }

    const keywordMatchRate = expectedKeywords.length > 0 
      ? Math.round((matchedKeywords / expectedKeywords.length) * 100) 
      : 100;

    // Fluent responses generally avoid excessive stutter markers
    const stutters = (cleanedText.match(/\b(um|uh|ah|like)\b/g) || []).length;
    const fluencyScore = Math.max(0, Math.min(100, 100 - (stutters * 10)));

    // Tone heuristic
    let tone: 'confident' | 'hesitant' | 'neutral' | 'anxious' = 'confident';
    if (stutters > 4) {
      tone = 'hesitant';
    } else if (wordsPerMinute > 160) {
      tone = 'anxious';
    } else if (wordsPerMinute < 100 && wordsPerMinute > 0) {
      tone = 'hesitant';
    } else if (wordCount === 0) {
      tone = 'neutral';
    }

    return {
      fluencyScore,
      wordsPerMinute,
      keywordMatchRate,
      tone,
      grammarErrors: []
    };
  }
}
