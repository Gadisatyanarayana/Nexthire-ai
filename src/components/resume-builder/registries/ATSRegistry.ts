export interface ATSPlugin {
  id: string;
  name: string;
  analyze: (resumeData: any, jobDescription?: string) => Promise<{ score: number; recommendations: string[] }>;
}

export const ATSRegistry: Record<string, ATSPlugin> = {};
