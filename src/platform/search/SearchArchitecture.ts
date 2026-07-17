/**
 * Global Search Architecture
 * Integrates pg_trgm and Full Text Search (FTS)
 */

export interface GlobalSearchQuery {
  term: string;
  facets: {
    type?: ('Question' | 'Lesson' | 'Concept' | 'Company' | 'Formula' | 'Video')[];
    difficulty?: string[];
    domainId?: string[];
  };
  pagination: { limit: number; offset: number };
}

export interface SearchResult {
  id: string;
  type: 'Question' | 'Lesson' | 'Concept' | 'Company' | 'Formula' | 'Video';
  title: string;
  snippet: string;
  score: number; // For hybrid ranking
}

export interface ISearchService {
  /**
   * Performs hybrid search using pg_trgm for partial matches and FTS for semantic density
   */
  searchGlobal(query: GlobalSearchQuery): Promise<SearchResult[]>;
  
  /**
   * Autocomplete leveraging Redis cache + pg_trgm
   */
  getSuggestions(prefix: string): Promise<string[]>;
}

// SQL Implementation Note for Hardening:
/*
  CREATE INDEX idx_questions_fts ON platform_questions USING GIN (to_tsvector('english', title || ' ' || content));
  CREATE INDEX idx_questions_trgm ON platform_questions USING GIN (title gin_trgm_ops);
*/
