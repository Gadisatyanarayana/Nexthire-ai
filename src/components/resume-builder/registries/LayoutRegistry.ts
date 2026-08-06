export interface LayoutTemplate {
  id: string;
  name: string;
  layout: {
    columns: number;
    headerType: string;
  };
  defaultSections: string[];
}

export const LayoutRegistry: Record<string, LayoutTemplate> = {
  "jakes-resume": {
    id: "jakes-resume",
    name: "Jake's Resume (ATS)",
    layout: { columns: 1, headerType: "standard" },
    defaultSections: ["personal", "summary", "experience", "education", "projects", "skills"],
  },
  "harvard-resume": {
    id: "harvard-resume",
    name: "Harvard Resume",
    layout: { columns: 1, headerType: "centered" },
    defaultSections: ["personal", "education", "experience", "leadership", "skills"],
  },
  "modern-resume": {
    id: "modern-resume",
    name: "Modern Professional",
    layout: { columns: 2, headerType: "split" },
    defaultSections: ["personal", "summary", "experience", "projects", "education", "skills"],
  },
  "minimal-resume": {
    id: "minimal-resume",
    name: "Minimalist",
    layout: { columns: 1, headerType: "minimal" },
    defaultSections: ["personal", "experience", "projects", "education", "skills"],
  },
  "executive-resume": {
    id: "executive-resume",
    name: "Executive Leadership",
    layout: { columns: 1, headerType: "block" },
    defaultSections: ["personal", "summary", "experience", "education", "skills"],
  }
};

export function getLayoutTemplate(id: string): LayoutTemplate {
  const layout = LayoutRegistry[id];
  if (!layout) throw new Error(`Layout ${id} not found`);
  return layout;
}
