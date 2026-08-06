import { ResumeSection } from "../types";

export interface SectionPlugin {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultData: any;
  editorComponent: React.ComponentType<{ section: ResumeSection; updateSection: (data: any) => void }>;
  renderComponent: React.ComponentType<{ section: ResumeSection; tokens: any }>;
}

import { PersonalSectionPlugin } from '../sections/PersonalSection';
import { SummarySectionPlugin } from '../sections/SummarySection';
import { ExperienceSectionPlugin } from '../sections/ExperienceSection';
import { EducationSectionPlugin } from '../sections/EducationSection';
import { ProjectsSectionPlugin } from '../sections/ProjectsSection';
import { SkillsSectionPlugin } from '../sections/SkillsSection';

export const SectionRegistry: Record<string, SectionPlugin> = {
  [PersonalSectionPlugin.id]: PersonalSectionPlugin,
  [SummarySectionPlugin.id]: SummarySectionPlugin,
  [ExperienceSectionPlugin.id]: ExperienceSectionPlugin,
  [EducationSectionPlugin.id]: EducationSectionPlugin,
  [ProjectsSectionPlugin.id]: ProjectsSectionPlugin,
  [SkillsSectionPlugin.id]: SkillsSectionPlugin,
};

export function getSectionPlugin(type: string): SectionPlugin {
  const plugin = SectionRegistry[type];
  if (!plugin) throw new Error(`Section Plugin ${type} not found in registry`);
  return plugin;
}
