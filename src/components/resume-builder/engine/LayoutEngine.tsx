import React from "react";
import { ResumeDocument } from "../types";
import { getFullTemplateConfig } from "../templates/config/TemplateDefinitions";
import { getColorPalette } from "../theme/ColorRegistry";
import { getFontConfig } from "../theme/TypographyRegistry";
import ResumeSectionRenderer from "../rendering/ResumeSectionRenderer";

interface LayoutEngineProps {
  form: ResumeDocument;
}

export default function LayoutEngine({ form }: LayoutEngineProps) {
  const templateId = form.metadata?.templateId || "software-engineer";
  const paletteId = form.metadata?.colorPaletteId || form.theme?.id || "navy";
  const fontId = form.typography?.bodyFont ? "inter" : "inter";

  const template = getFullTemplateConfig(templateId);
  const palette = getColorPalette(paletteId);
  const font = getFontConfig(fontId);

  const { colors } = palette;
  const isTwoColumn = template.columns === 2;

  // Split sections for 2-column templates if needed
  const sidebarSectionTypes = ["personal", "skills", "education", "certifications", "languages"];
  const sidebarSections = form.sections.filter((s) => sidebarSectionTypes.includes(s.type));
  const mainSections = form.sections.filter((s) => !sidebarSectionTypes.includes(s.type) || s.type === "personal");

  if (isTwoColumn) {
    return (
      <div
        className="resume-document bg-white w-full h-full min-h-[11in] flex"
        style={{
          fontFamily: font.fontFamily,
          backgroundColor: colors.background,
          color: colors.body,
        }}
      >
        {/* Sidebar Column */}
        <div
          className="p-6 flex-shrink-0 border-r"
          style={{
            width: template.layout.sidebarWidth || "32%",
            backgroundColor: colors.sidebarBg || "#f8fafc",
            borderColor: colors.divider,
          }}
        >
          {sidebarSections.map((section) => (
            <ResumeSectionRenderer
              key={section.id}
              section={section}
              document={form}
              template={template}
              palette={palette}
              font={font}
              isSidebar={true}
            />
          ))}
        </div>

        {/* Main Body Column */}
        <div className="p-10 flex-1 space-y-2">
          {mainSections.map((section) => (
            <ResumeSectionRenderer
              key={section.id}
              section={section}
              document={form}
              template={template}
              palette={palette}
              font={font}
              isSidebar={false}
            />
          ))}
        </div>
      </div>
    );
  }

  // 1-Column Single Document Flow (ATS Safe Standard)
  return (
    <div
      className="resume-document bg-white w-full h-full min-h-[11in] p-12 space-y-1"
      style={{
        fontFamily: font.fontFamily,
        backgroundColor: colors.background,
        color: colors.body,
        lineHeight: 1.5,
      }}
    >
      {form.sections.map((section) => (
        <ResumeSectionRenderer
          key={section.id}
          section={section}
          document={form}
          template={template}
          palette={palette}
          font={font}
          isSidebar={false}
        />
      ))}
    </div>
  );
}
