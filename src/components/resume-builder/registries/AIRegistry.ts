export interface AIPlugin {
  id: string;
  name: string;
  capabilities: string[];
  generate: (prompt: string, context: any) => Promise<string>;
}

export const AIRegistry: Record<string, AIPlugin> = {};
