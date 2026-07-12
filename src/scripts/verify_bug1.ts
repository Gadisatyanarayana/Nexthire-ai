import { QuestionEngine } from '../lib/aptitude/QuestionEngine';
import { AptitudeQuestion } from '../models/aptitude';

const questions: AptitudeQuestion[] = [
  { id: '1', lesson_id: 'l1', question: 'q1', options: [], correct_index: 0, explanation: '', difficulty: 'WeirdDifficulty', status: 'draft' },
  { id: '2', lesson_id: 'l1', question: 'q2', options: [], correct_index: 0, explanation: '', difficulty: 'Unknown', status: 'draft' },
];

const result = QuestionEngine.selectAdaptiveQuestions(questions, [], 0, 10);
console.log(`Original questions with weird difficulty: ${questions.length}`);
console.log(`Adaptive Engine selected: ${result.length}`);
if (result.length > 0) {
  console.log('SUCCESS: Empty pool bug fixed!');
} else {
  console.log('FAILED: Still returning empty pool!');
}
