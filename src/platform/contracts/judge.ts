export interface JudgeVerdict {
  status: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'INTERNAL_ERROR';
  runtimeMs?: number;
  memoryKb?: number;
  passedEdgeCases: boolean;
  testCaseResults: TestCaseResult[];
}

export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  actualOutputUri?: string;
  runtimeMs: number;
  memoryKb: number;
  error?: string;
}

export interface OutputComparator {
  compare(expectedOutputUri: string, actualOutputUri: string): Promise<boolean>;
}
