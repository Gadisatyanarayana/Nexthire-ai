export interface CodingSubmission {
  id: string;
  tenantId: string;
  userId: string;
  problemId: string;
  language: string;
  sourceCode: string;
  status: 'PENDING' | 'COMPILING' | 'EXECUTING' | 'JUDGING' | 'COMPLETED' | 'FAILED';
  verdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'INTERNAL_ERROR' | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  createdAt: Date;
}
