export interface CodingTestCase {
  id: string;
  problemId: string;
  type: 'SAMPLE' | 'HIDDEN' | 'STRESS';
  inputData: string;
  expectedOutput: string;
  points: number;
  isActive: boolean;
}
