export interface KnowledgeDocument {
  id: string;
  index: 'CURRICULUM' | 'COMPANIES' | 'CODING' | 'RESUMES' | 'ASSESSMENTS' | 'CONTESTS';
  content: string;
  metadata: {
    sourceId: string;
    url?: string;
    version: string;
    tags: string[];
    createdAt: string;
  };
}

export interface ChunkedDocument extends KnowledgeDocument {
  chunkId: string;
  chunkIndex: number;
  totalChunks: number;
  embeddingVersion: string;
}
