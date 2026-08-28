export interface ExportPlugin {
  id: string;
  name: string;
  exportFormat: "pdf" | "docx" | "txt";
  execute: (data: any) => Promise<Blob>;
}

export const ExportRegistry: Record<string, ExportPlugin> = {};
