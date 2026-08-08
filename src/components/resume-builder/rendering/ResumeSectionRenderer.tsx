import React from "react";
import { ResumeDocument, ResumeSection } from "../types";
import { FullTemplateConfig } from "../templates/config/TemplateDefinitions";
import { ResumeColorPalette } from "../theme/ColorRegistry";
import { ResumeFontConfig } from "../theme/TypographyRegistry";
import { Globe, Mail, Phone, MapPin, ExternalLink, Award, BookOpen, Code, GraduationCap, Briefcase } from "lucide-react";

interface SectionRendererProps {
  section: ResumeSection;
  document: ResumeDocument;
  template: FullTemplateConfig;
  palette: ResumeColorPalette;
  font: ResumeFontConfig;
  isSidebar?: boolean;
}

export default function ResumeSectionRenderer({
  section,
  document,
  template,
  palette,
  font,
  isSidebar = false,
}: SectionRendererProps) {
  if (!section.visible || !section.data) return null;

  const { colors } = palette;
  const dividerStyle = template.layout.sectionDivider;

  // Render Heading Component
  const renderSectionHeader = (title: string) => {
    let borderBottom = "none";
    if (dividerStyle === "thin") borderBottom = `1px solid ${colors.divider}`;
    if (dividerStyle === "thick") borderBottom = `2px solid ${colors.primary}`;
    if (dividerStyle === "double") borderBottom = `3px double ${colors.primary}`;

    return (
      <div className="mb-2 mt-4 first:mt-0">
        <h2
          className="text-xs font-bold uppercase tracking-wider flex items-center justify-between pb-1"
          style={{
            color: colors.primary,
            fontFamily: font.headingFontFamily || font.fontFamily,
            borderBottom,
          }}
        >
          <span>{title}</span>
          {dividerStyle === "accent-bar" && (
            <span className="h-0.5 w-12 rounded" style={{ backgroundColor: colors.accent }}></span>
          )}
        </h2>
      </div>
    );
  };

  switch (section.type) {
    // ----------------------------------------------------
    // 1. PERSONAL SECTION
    // ----------------------------------------------------
    case "personal": {
      const p = section.data;
      const align = template.layout.headerAlignment;
      const flexJustify = align === "center" ? "justify-center" : align === "block" ? "justify-start" : "justify-start";

      return (
        <div
          className={`w-full mb-5 ${
            align === "center" ? "text-center" : "text-left"
          } ${align === "block" ? "p-4 rounded-lg text-white mb-6" : ""}`}
          style={align === "block" ? { backgroundColor: colors.primary } : {}}
        >
          <div className={`flex items-center gap-4 ${align === "center" ? "flex-col" : "flex-row justify-between"}`}>
            {/* Main Title & Role */}
            <div>
              <h1
                className="text-2xl font-extrabold tracking-tight"
                style={{
                  color: align === "block" ? "#ffffff" : colors.name,
                  fontFamily: font.fontFamily,
                }}
              >
                {p.fullName || "Your Full Name"}
              </h1>
              {p.targetRole && (
                <div
                  className="text-xs font-semibold uppercase tracking-wider mt-0.5"
                  style={{ color: align === "block" ? "rgba(255,255,255,0.85)" : colors.accent }}
                >
                  {p.targetRole}
                </div>
              )}
            </div>

            {/* Optional Photo */}
            {p.showPhoto && p.photoUrl && (
              <div className="flex-shrink-0">
                <img
                  src={p.photoUrl}
                  alt={p.fullName}
                  className={`w-16 h-16 object-cover border-2 shadow-sm ${
                    p.photoStyle === "circle" ? "rounded-full" : p.photoStyle === "rounded" ? "rounded-lg" : "rounded-none"
                  }`}
                  style={{ borderColor: colors.primary }}
                />
              </div>
            )}
          </div>

          {/* Contact & Coding Profiles Bar */}
          <div
            className={`flex flex-wrap gap-x-3 gap-y-1.5 text-[10.5px] mt-2.5 ${flexJustify}`}
            style={{ color: align === "block" ? "rgba(255,255,255,0.9)" : colors.body }}
          >
            {p.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 opacity-75" />
                {p.email}
              </span>
            )}
            {p.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 opacity-75" />
                {p.phone}
              </span>
            )}
            {p.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 opacity-75" />
                {p.location}
              </span>
            )}
            {p.linkedin && (
              <a
                href={p.linkedin.startsWith("http") ? p.linkedin : `https://${p.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:underline"
                style={{ color: align === "block" ? "#ffffff" : colors.accent }}
              >
                <Globe className="w-3 h-3" />
                {p.linkedin.replace(/^https?:\/\//, "")}
              </a>
            )}
            {p.github && (
              <a
                href={p.github.startsWith("http") ? p.github : `https://${p.github}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:underline"
                style={{ color: align === "block" ? "#ffffff" : colors.accent }}
              >
                <Globe className="w-3 h-3" />
                {p.github.replace(/^https?:\/\//, "")}
              </a>
            )}
            {p.leetcode && (
              <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: colors.accent }}>
                <Code className="w-3 h-3" />
                LeetCode: {p.leetcode.replace(/^https?:\/\//, "")}
              </span>
            )}
            {p.codechef && (
              <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: colors.accent }}>
                CodeChef: {p.codechef.replace(/^https?:\/\//, "")}
              </span>
            )}
            {p.portfolio && (
              <a
                href={p.portfolio.startsWith("http") ? p.portfolio : `https://${p.portfolio}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:underline"
                style={{ color: align === "block" ? "#ffffff" : colors.accent }}
              >
                <Globe className="w-3 h-3" />
                Portfolio
              </a>
            )}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 2. SUMMARY SECTION
    // ----------------------------------------------------
    case "summary": {
      const text = section.data?.text;
      if (!text) return null;
      return (
        <div className="mb-4">
          {renderSectionHeader("Professional Summary")}
          <p
            className="text-[11px] leading-relaxed text-justify"
            style={{ color: colors.body, fontFamily: font.fontFamily }}
          >
            {text}
          </p>
        </div>
      );
    }

    // ----------------------------------------------------
    // 3. EXPERIENCE SECTION
    // ----------------------------------------------------
    case "experience": {
      const items = section.data?.items || [];
      if (items.length === 0) return null;

      return (
        <div className="mb-4">
          {renderSectionHeader("Professional Experience")}
          <div className="space-y-3.5">
            {items.map((exp: any, idx: number) => (
              <div key={exp.id || idx} className="text-[11px]">
                {/* Header line: Role & Company | Dates */}
                <div className="flex justify-between items-baseline font-bold" style={{ color: colors.name }}>
                  <span>
                    {exp.role} <span style={{ color: colors.accent }}>@ {exp.company}</span>
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: colors.accent }}>
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>

                {/* Subheader line: Location & Tech Stack */}
                <div className="flex justify-between items-center text-[10px] italic mb-1" style={{ color: colors.accent }}>
                  <span>
                    {exp.location} {exp.employmentType ? `• ${exp.employmentType}` : ""} {exp.isRemote ? "(Remote)" : ""}
                  </span>
                  {exp.techStack && (
                    <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-gray-100 font-normal" style={{ color: colors.body }}>
                      {exp.techStack}
                    </span>
                  )}
                </div>

                {/* Bullets */}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px]" style={{ color: colors.body }}>
                    {exp.achievements.map((ach: string, bIdx: number) => (
                      <li key={bIdx} className="leading-snug">
                        {ach}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 4. PROJECTS SECTION
    // ----------------------------------------------------
    case "projects": {
      const items = section.data?.items || [];
      if (items.length === 0) return null;

      return (
        <div className="mb-4">
          {renderSectionHeader("Projects & Technical Accomplishments")}
          <div className="space-y-3">
            {items.map((proj: any, idx: number) => (
              <div key={proj.id || idx} className="text-[11px]">
                <div className="flex justify-between items-baseline font-bold" style={{ color: colors.name }}>
                  <div className="flex items-center gap-2">
                    <span>{proj.name}</span>
                    {proj.github && (
                      <a href={`https://${proj.github.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-black">
                        <Globe className="w-3 h-3 inline" />
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a href={`https://${proj.liveUrl.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-black">
                        <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    )}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: colors.accent }}>
                    {proj.duration}
                  </span>
                </div>

                {/* Tech Stack */}
                {proj.techStack && (
                  <div className="text-[10px] font-semibold my-0.5" style={{ color: colors.accent }}>
                    Tech Stack: <span className="font-normal">{proj.techStack}</span>
                  </div>
                )}

                {/* Description / Achievements */}
                {proj.description && <p className="text-[11px] leading-snug mb-1" style={{ color: colors.body }}>{proj.description}</p>}
                {proj.achievements && proj.achievements.length > 0 && (
                  <ul className="list-disc pl-4 space-y-1 text-[11px]" style={{ color: colors.body }}>
                    {proj.achievements.map((ach: string, bIdx: number) => (
                      <li key={bIdx} className="leading-snug">
                        {ach}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 5. EDUCATION SECTION (College, Inter 12th, Diploma, 10th School)
    // ----------------------------------------------------
    case "education": {
      const items = section.data?.items || [];
      if (items.length === 0) return null;

      return (
        <div className="mb-5">
          {renderSectionHeader("Education & Qualifications")}
          <div className="space-y-3">
            {items.map((edu: any, idx: number) => {
              const hasDegree = !!edu.degree;
              const hasInstitute = !!edu.institute;

              return (
                <div key={edu.id || idx} className="text-[11px] leading-snug">
                  {/* Top Line: School/Institute Name + Board + Dates */}
                  <div className="flex justify-between items-baseline font-bold" style={{ color: colors.name }}>
                    <span>
                      {edu.institute || "School / College Name"}
                      {edu.boardOrUniversity ? ` (${edu.boardOrUniversity})` : ""}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: colors.accent }}>
                      {edu.startDate ? `${edu.startDate} – ${edu.endDate}` : edu.endDate}
                    </span>
                  </div>

                  {/* Subline: Degree / Branch + Marks */}
                  <div className="flex justify-between items-center text-[10.5px] mt-0.5" style={{ color: colors.body }}>
                    <span>
                      <strong style={{ color: colors.accent }}>{edu.degree || "Qualification"}</strong>
                      {edu.branch ? ` • ${edu.branch}` : ""}
                    </span>
                    {(edu.cgpa || edu.percentage) && (
                      <span className="font-semibold px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-[10px]" style={{ color: colors.primary }}>
                        {edu.cgpa ? `CGPA: ${edu.cgpa}` : `Marks: ${edu.percentage}`}
                      </span>
                    )}
                  </div>

                  {/* Relevant Coursework */}
                  {edu.coursework && edu.coursework.length > 0 && (
                    <div className="text-[10px] mt-1" style={{ color: colors.accent }}>
                      <span className="font-semibold">Relevant Subjects / Coursework: </span>
                      <span className="font-normal">{Array.isArray(edu.coursework) ? edu.coursework.join(" • ") : edu.coursework}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 6. SKILLS SECTION
    // ----------------------------------------------------
    case "skills": {
      const items = section.data?.items || [];
      if (items.length === 0) return null;

      return (
        <div className="mb-4">
          {renderSectionHeader("Technical Skills")}
          <div className="space-y-1.5 text-[11px]" style={{ color: colors.body }}>
            {items.map((cat: any, idx: number) => (
              <div key={cat.id || idx} className="flex gap-2">
                <span className="font-bold min-w-[120px]" style={{ color: colors.name }}>
                  {cat.name}:
                </span>
                <span className="flex-1">{cat.skills}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 7. CERTIFICATIONS SECTION
    // ----------------------------------------------------
    case "certifications": {
      const items = section.data?.items || [];
      if (items.length === 0) return null;

      return (
        <div className="mb-4">
          {renderSectionHeader("Certifications & Licenses")}
          <div className="space-y-1 text-[11px]">
            {items.map((c: any, idx: number) => (
              <div key={c.id || idx} className="flex justify-between items-center" style={{ color: colors.body }}>
                <span>
                  <span className="font-semibold" style={{ color: colors.name }}>
                    {c.name}
                  </span>{" "}
                  – {c.issuer}
                </span>
                <span className="text-[10px]" style={{ color: colors.accent }}>
                  {c.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // DEFAULT FALLBACK
    // ----------------------------------------------------
    default:
      return null;
  }
}
