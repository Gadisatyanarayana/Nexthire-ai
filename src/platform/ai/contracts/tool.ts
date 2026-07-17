export interface ToolRegistryEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'LEARNING' | 'ASSESSMENT' | 'CODING' | 'CONTEST' | 'RESUME' | 'INTERVIEW' | 'PLACEMENT' | 'ANALYTICS';
  inputSchema: any;
  outputSchema: any;
  permissionsRequired: string[];
  timeoutMs: number;
  retryPolicy: string;
  costEstimateTokens: number;
  ownerId: string;
}
