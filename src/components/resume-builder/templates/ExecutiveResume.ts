import { ResumeTemplateConfig } from "./JakesResume";

export const executiveResumeConfig: ResumeTemplateConfig = {
  id: "executive-resume",
  name: "Executive Leadership",
  styles: {
    fontFamily: "Georgia, serif",
    fontSize: {
      name: "text-[26pt] font-semibold text-center text-gray-900 border-b-4 border-gray-900 pb-2 mb-2",
      heading: "text-[12pt] font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 mb-2",
      body: "text-[10.5pt] text-gray-800",
      small: "text-[9pt] text-gray-600"
    },
    layout: {
      margin: "0.8in",
      headerAlignment: "center",
      sectionDivider: "none", // Divider is handled by heading bg
      dateAlignment: "right",
      spacing: {
        section: "mt-5",
        item: "mt-3"
      }
    },
    colors: {
      text: "text-gray-800",
      primary: "text-gray-900"
    }
  }
};
