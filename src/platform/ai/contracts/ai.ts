export interface PromptFragment {
  id: string;
  type: 'SYSTEM' | 'SAFETY' | 'DOMAIN' | 'MEMORY' | 'CONTEXT' | 'USER_INPUT';
  content: string;
  version: string;
}

export interface PromptTemplate {
  id: string;
  version: string;
  fragments: PromptFragment[];
  variables: string[];
}
