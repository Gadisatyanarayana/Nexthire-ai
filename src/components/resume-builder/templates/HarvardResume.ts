import { ResumeTemplateConfig } from "./JakesResume";

export const harvardResumeConfig: ResumeTemplateConfig = {
  id: "harvard-resume",
  name: "Harvard (Classic Academic)",
  styles: {
    fontFamily: "Garamond, serif",
    fontSize: {
      name: "text-[22pt] font-bold uppercase",
      heading: "text-[12pt] font-bold uppercase",
      body: "text-[11pt]",
      small: "text-[10pt]"
    },
    layout: {
      margin: "0.75in",
      headerAlignment: "center",
      sectionDivider: "thick",
      dateAlignment: "right",
      spacing: {
        section: "mt-4",
        item: "mt-2"
      }
    },
    colors: {
      text: "text-black",
      primary: "text-black"
    }
  }
};
