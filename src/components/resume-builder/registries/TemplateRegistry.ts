import { ResumeTemplateConfig } from "../templates/JakesResume";
import { jakesResumeConfig } from "../templates/JakesResume";
import { harvardResumeConfig } from "../templates/HarvardResume";
import { modernResumeConfig } from "../templates/ModernResume";
import { minimalResumeConfig } from "../templates/MinimalResume";
import { executiveResumeConfig } from "../templates/ExecutiveResume";

export const TemplateRegistry: Record<string, ResumeTemplateConfig> = {
  "jakes-resume": jakesResumeConfig,
  "harvard-resume": harvardResumeConfig,
  "modern-resume": modernResumeConfig,
  "minimal-resume": minimalResumeConfig,
  "executive-resume": executiveResumeConfig,
};

export function getTemplateConfig(templateId: string): ResumeTemplateConfig {
  return TemplateRegistry[templateId] || TemplateRegistry["jakes-resume"];
}
