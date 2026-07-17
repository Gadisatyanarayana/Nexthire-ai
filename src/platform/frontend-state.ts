/**
 * Frontend State Architecture Specifications
 * 
 * Target: Milestone 2.5 Hardening
 */

// 1. Strict Server/Client Component Boundaries
export const COMPONENT_BOUNDARIES = {
  SERVER_COMPONENTS: ['Layouts', 'Data Fetching Root Nodes', 'SEO Boundaries'],
  CLIENT_COMPONENTS: ['Interactive Forms', 'Stateful Lists', 'Real-time Editors'],
};

// 2. TanStack Query Global Cache Keys
export const QUERY_KEYS = {
  // Curriculum
  DOMAINS: ['curriculum', 'domains'] as const,
  MODULES: (domainId: string) => ['curriculum', 'domains', domainId, 'modules'] as const,
  LESSONS: (moduleId: string) => ['curriculum', 'modules', moduleId, 'lessons'] as const,
  
  // Questions
  QUESTIONS: (filters: any) => ['questions', 'list', filters] as const,
  QUESTION_VERSIONS: (questionId: string) => ['questions', 'versions', questionId] as const,
  
  // Imports
  IMPORT_BATCHES: ['import', 'batches'] as const,
  IMPORT_DLQ: (batchId: string) => ['import', 'batches', batchId, 'dlq'] as const,
};

// 3. Optimistic Update Standard
// Every mutation must implement `onMutate` to snapshot previous state, 
// update cache optimistically, and `onError` to rollback cache.
export interface MutationStandard {
  onMutate: () => Promise<void>;
  onError: (err: any, variables: any, context: any) => void;
  onSettled: () => void;
}
