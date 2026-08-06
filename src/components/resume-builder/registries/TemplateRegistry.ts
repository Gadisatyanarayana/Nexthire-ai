import { ResumeTemplateConfig } from "../templates/JakesResume";
import { jakesResumeConfig } from "../templates/JakesResume";
import { harvardResumeConfig } from "../templates/HarvardResume";

export const TemplateRegistry: Record<string, ResumeTemplateConfig> = {
  "jakes-resume": jakesResumeConfig,
  "harvard-resume": harvardResumeConfig,
};

export function getTemplateConfig(templateId: string): ResumeTemplateConfig {
  return TemplateRegistry[templateId] || TemplateRegistry["jakes-resume"];
}
