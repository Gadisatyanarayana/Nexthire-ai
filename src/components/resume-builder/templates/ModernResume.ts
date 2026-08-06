import { ResumeTemplateConfig } from "./JakesResume";

export const modernResumeConfig: ResumeTemplateConfig = {
  id: "modern-resume",
  name: "Modern Professional",
  styles: {
    fontFamily: "'Inter', sans-serif",
    fontSize: {
      name: "text-[24pt] font-extrabold tracking-tight",
      heading: "text-[13pt] font-bold text-gray-800 uppercase tracking-widest",
      body: "text-[10pt] text-gray-700",
      small: "text-[9pt] text-gray-500"
    },
    layout: {
      margin: "0.85in",
      headerAlignment: "left",
      sectionDivider: "none",
      dateAlignment: "right",
      spacing: {
        section: "mt-6",
        item: "mt-4"
      }
    },
    colors: {
      text: "text-gray-800",
      primary: "text-blue-600" // Can be overridden by ThemeEngine
    }
  }
};
