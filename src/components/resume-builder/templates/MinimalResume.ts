import { ResumeTemplateConfig } from "./JakesResume";

export const minimalResumeConfig: ResumeTemplateConfig = {
  id: "minimal-resume",
  name: "Minimalist",
  styles: {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: {
      name: "text-[20pt] font-light tracking-widest uppercase",
      heading: "text-[11pt] font-medium uppercase tracking-widest border-b border-gray-200 pb-1",
      body: "text-[10pt] font-light leading-relaxed",
      small: "text-[8.5pt]"
    },
    layout: {
      margin: "1in",
      headerAlignment: "center",
      sectionDivider: "thin",
      dateAlignment: "left", // Minimal sometimes aligns dates left for a unique look
      spacing: {
        section: "mt-8",
        item: "mt-5"
      }
    },
    colors: {
      text: "text-gray-600",
      primary: "text-gray-900"
    }
  }
};
