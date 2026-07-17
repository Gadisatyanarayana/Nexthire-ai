export interface ContestProblem {
  problemVersionId: string;
  contestId: string;
  label: string; // e.g. "A", "B", "C"
  baseScore: number;
  isActive: boolean;
}
