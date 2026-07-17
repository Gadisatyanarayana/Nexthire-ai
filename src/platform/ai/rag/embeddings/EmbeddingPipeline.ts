import { ChunkedDocument } from '../../knowledge/KnowledgeSchema';

export interface EmbeddingProvider {
  createEmbedding(text: string): Promise<number[]>;
  readonly version: string;
  readonly dimensions: number;
}

export class EmbeddingPipeline {
  constructor(private provider: EmbeddingProvider) {}

  /**
   * Generates embeddings for a chunked document.
   * In a real implementation, this would interact with the cache layer and pgvector.
   */
  public async generateEmbedding(chunk: ChunkedDocument): Promise<{ chunk: ChunkedDocument; vector: number[] }> {
    const vector = await this.provider.createEmbedding(chunk.content);
    return { chunk, vector };
  }
}
