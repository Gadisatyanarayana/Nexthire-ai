import { RetrievalResult } from '../retrieval/RetrievalEngine';
import { TokenCounter } from '../../kernel/tokens/TokenCounter';

export class ContextBuilder {
  constructor(private tokenCounter: TokenCounter) {}

  /**
   * Merges retrieval results, removes duplicates, and ensures the total context fits within the token budget.
   */
  public buildContext(results: RetrievalResult[], maxTokens: number): string {
    const uniqueSourceIds = new Set<string>();
    let context = '';
    let currentTokens = 0;

    for (const result of results) {
      if (uniqueSourceIds.has(result.chunk.id)) continue;

      const chunkTokens = this.tokenCounter.estimateTokens(result.chunk.content);
      if (currentTokens + chunkTokens > maxTokens) {
        break; // Stop adding if we exceed the budget
      }

      context += `[Source: ${result.chunk.metadata.sourceId}]\n${result.chunk.content}\n\n`;
      currentTokens += chunkTokens;
      uniqueSourceIds.add(result.chunk.id);
    }

    return context.trim();
  }
}
