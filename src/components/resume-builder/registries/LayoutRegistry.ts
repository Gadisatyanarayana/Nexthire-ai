import { ProductionTemplates, getFullTemplateConfig, FullTemplateConfig } from "../templates/config/TemplateDefinitions";

export const LayoutRegistry = ProductionTemplates;

export function getLayoutTemplate(id: string): FullTemplateConfig {
  return getFullTemplateConfig(id);
}
