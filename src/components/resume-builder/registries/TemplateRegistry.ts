import { ProductionTemplates, getFullTemplateConfig, FullTemplateConfig } from "../templates/config/TemplateDefinitions";

export const TemplateRegistry = ProductionTemplates;
export function getTemplateConfig(templateId: string): FullTemplateConfig {
  return getFullTemplateConfig(templateId);
}
