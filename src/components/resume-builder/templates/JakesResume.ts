export interface ResumeTemplateConfig {
  id: string;
  name: string;
  styles: {
    fontFamily: string;
    fontSize: {
      name: string;
      heading: string;
      body: string;
      small: string;
    };
    layout: {
      margin: string;
      headerAlignment: "left" | "center" | "right";
      sectionDivider: "none" | "thin" | "thick";
      dateAlignment: "left" | "right";
      spacing: {
        section: string;
        item: string;
      };
    };
    colors: {
      text: string;
      primary: string;
    };
  };
}

export const jakesResumeConfig: ResumeTemplateConfig = {
  id: "jakes-resume",
  name: "Jake's Resume (ATS Standard)",
  styles: {
    fontFamily: "Times New Roman, serif",
    fontSize: {
      name: "text-2xl font-bold",
      heading: "text-[14px] font-bold uppercase",
      body: "text-[12px]",
      small: "text-[11px]",
    },
    layout: {
      margin: "0.5in",
      headerAlignment: "center",
      sectionDivider: "thin", // 1px solid black
      dateAlignment: "right",
      spacing: {
        section: "mb-3",
        item: "mb-2",
      },
    },
    colors: {
      text: "text-black",
      primary: "text-black",
    },
  },
};
