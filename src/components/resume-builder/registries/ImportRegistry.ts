export interface ImportPlugin {
  id: string;
  name: string;
  supportedFormats: string[];
  importData: (file: File) => Promise<any>;
}

export const ImportRegistry: Record<string, ImportPlugin> = {};
