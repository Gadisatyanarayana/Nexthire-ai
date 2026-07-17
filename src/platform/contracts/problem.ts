export interface CodingProblem {
  id: string;
  tenantId: string;
  version: number;
  title: string;
  statementMd: string;
  constraints: any;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}
