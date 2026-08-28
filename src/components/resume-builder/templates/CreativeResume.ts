import { ResumeTemplateConfig } from "./JakesResume";

export const creativeResumeConfig: ResumeTemplateConfig = {
  id: "creative-resume",
  name: "Creative Resume",
  styles: {
    fontFamily: "Playfair Display, serif",
    fontSize: {
      name: "text-3xl font-black italic",
      heading: "text-[16px] font-bold border-b-2 border-black inline-block mb-1",
      body: "text-[12px]",
      small: "text-[11px]",
    },
    layout: {
      margin: "0.6in",
      headerAlignment: "left",
      sectionDivider: "none",
      dateAlignment: "right",
      spacing: {
        section: "mb-5",
        item: "mb-3",
      },
    },
    colors: {
      text: "text-gray-800",
      primary: "text-black",
    },
  },
};
