export interface ParserPlugin {
  id: string;
  name: string;
  supportedFormats: string[];
  parse: (file: File) => Promise<any>;
}

export const ParserRegistry: Record<string, ParserPlugin> = {};
