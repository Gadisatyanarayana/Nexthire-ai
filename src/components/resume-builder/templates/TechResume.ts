import { ResumeTemplateConfig } from "./JakesResume";

export const techResumeConfig: ResumeTemplateConfig = {
  id: "tech-resume",
  name: "Tech Resume",
  styles: {
    fontFamily: "Roboto, sans-serif",
    fontSize: {
      name: "text-2xl font-black tracking-tight",
      heading: "text-[14px] font-bold uppercase tracking-wider text-blue-900",
      body: "text-[12px]",
      small: "text-[11px]",
    },
    layout: {
      margin: "0.4in",
      headerAlignment: "left",
      sectionDivider: "thick",
      dateAlignment: "right",
      spacing: {
        section: "mb-3",
        item: "mb-2",
      },
    },
    colors: {
      text: "text-gray-900",
      primary: "text-blue-900",
    },
  },
};
