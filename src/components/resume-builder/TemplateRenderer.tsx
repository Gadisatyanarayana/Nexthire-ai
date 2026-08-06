import React from "react";
import { ResumeTemplateConfig } from "./templates/JakesResume";
import { ResumeData, Experience, Project, Education, SkillCategory } from "./types";

interface TemplateRendererProps {
  form: ResumeData;
  config: ResumeTemplateConfig;
  className?: string;
}

export default function TemplateRenderer({ form, config, className = "" }: TemplateRendererProps) {
  const { styles } = config;
  const { fontSize, layout, colors } = styles;

  // Helper to parse bullet points (newlines or bullet characters)
  const parseBullets = (text: string) => {
    if (!text) return [];
    return text
      .split(/\n|•|-/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <div className={layout.spacing.section}>
      <h2 className={`${fontSize.heading} ${colors.text} m-0 p-0`}>{title}</h2>
      {layout.sectionDivider === "thin" && <hr className="border-t border-black my-0.5" />}
      {layout.sectionDivider === "thick" && <hr className="border-t-2 border-black my-0.5" />}
    </div>
  );

  return (
    <div
      className={`bg-white text-black w-full h-full relative ${className}`}
      style={{
        fontFamily: styles.fontFamily,
        padding: layout.margin,
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div className={`mb-4 ${layout.headerAlignment === "center" ? "text-center" : "text-left"}`}>
        <h1 className={`${fontSize.name} ${colors.primary} m-0`}>{form.fullName || "Your Name"}</h1>
        
        <div className={`flex flex-wrap items-center ${layout.headerAlignment === "center" ? "justify-center" : "justify-start"} gap-x-2 gap-y-1 mt-1 ${fontSize.body}`}>
          {form.email && <span>{form.email}</span>}
          {form.email && (form.phone || form.location || form.linkedin || form.github || form.portfolio) && <span>|</span>}
          
          {form.phone && <span>{form.phone}</span>}
          {form.phone && (form.location || form.linkedin || form.github || form.portfolio) && <span>|</span>}
          
          {form.location && <span>{form.location}</span>}
          {form.location && (form.linkedin || form.github || form.portfolio) && <span>|</span>}

          {form.linkedin && <span>{form.linkedin}</span>}
          {form.linkedin && (form.github || form.portfolio) && <span>|</span>}

          {form.github && <span>{form.github}</span>}
          {form.github && form.portfolio && <span>|</span>}

          {form.portfolio && <span>{form.portfolio}</span>}
        </div>
      </div>

      {/* SUMMARY */}
      {form.summary && (
        <div className={layout.spacing.section}>
          {form.targetRole && <SectionTitle title={form.targetRole} />}
          {!form.targetRole && <SectionTitle title="Summary" />}
          <p className={`${fontSize.body} leading-snug m-0`}>{form.summary}</p>
        </div>
      )}

      {/* EDUCATION */}
      {form.education && form.education.length > 0 && (
        <div className={layout.spacing.section}>
          <SectionTitle title="Education" />
          {form.education.map((edu, idx) => (
            <div key={edu.id || idx} className={layout.spacing.item}>
              <div className={`flex justify-between items-start ${fontSize.body}`}>
                <div>
                  <span className="font-bold">{edu.institute || "University Name"}</span>
                </div>
                <div className="text-right whitespace-nowrap">
                  {(edu.startDate || edu.endDate) ? `${edu.startDate} ${edu.startDate && edu.endDate ? '-' : ''} ${edu.endDate}` : ""}
                </div>
              </div>
              <div className={`flex justify-between items-start ${fontSize.body}`}>
                <div>
                  <span className="italic">{edu.degree || "Degree Name"}</span>
                </div>
                <div className="text-right whitespace-nowrap">
                  {edu.cgpa && `CGPA: ${edu.cgpa}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EXPERIENCE */}
      {form.experiences && form.experiences.length > 0 && (
        <div className={layout.spacing.section}>
          <SectionTitle title="Experience" />
          {form.experiences.map((exp, idx) => (
            <div key={exp.id || idx} className={layout.spacing.item}>
              <div className={`flex justify-between items-start ${fontSize.body}`}>
                <div>
                  <span className="font-bold">{exp.role || "Job Title"}</span>
                  {exp.company && <span> | <span className="italic">{exp.company}</span></span>}
                </div>
                <div className="text-right whitespace-nowrap">
                  {(exp.startDate || exp.endDate) ? `${exp.startDate} ${exp.startDate && exp.endDate ? '-' : ''} ${exp.endDate || (exp.current ? 'Present' : '')}` : ""}
                </div>
              </div>
              {exp.achievements && exp.achievements.length > 0 && (
                <ul className={`list-disc list-outside ml-4 mt-1 ${fontSize.body} space-y-0.5`}>
                  {exp.achievements.map((bullet, i) => (
                    <li key={i} className="leading-snug">{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PROJECTS */}
      {form.projects && form.projects.length > 0 && (
        <div className={layout.spacing.section}>
          <SectionTitle title="Projects" />
          {form.projects.map((proj, idx) => (
            <div key={proj.id || idx} className={layout.spacing.item}>
              <div className={`flex justify-between items-start ${fontSize.body}`}>
                <div>
                  <span className="font-bold">{proj.name || "Project Name"}</span>
                  {proj.techStack && <span> | <span className="italic">{proj.techStack}</span></span>}
                </div>
                <div className="text-right whitespace-nowrap">
                  {proj.duration}
                </div>
              </div>
              {proj.achievements && proj.achievements.length > 0 && (
                <ul className={`list-disc list-outside ml-4 mt-1 ${fontSize.body} space-y-0.5`}>
                  {proj.achievements.map((bullet, i) => (
                    <li key={i} className="leading-snug">{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SKILLS */}
      {form.skills && form.skills.some((sc) => sc.skills.trim().length > 0) && (
        <div className={layout.spacing.section}>
          <SectionTitle title="Skills" />
          {form.skills.filter((sc) => sc.skills.trim().length > 0).map((sc, idx) => (
            <div key={sc.id || idx} className={`${fontSize.body} leading-snug mt-1`}>
              <span className="font-bold">{sc.name}: </span> {sc.skills}
            </div>
          ))}
        </div>
      )}

      {/* ADDITIONAL SECTIONS (Achievements, Leadership, Open Source) */}
      {(form.achievements || form.leadership || form.openSource) && (
        <div className={layout.spacing.section}>
          <SectionTitle title="Additional Information" />
          
          {form.achievements && (
            <div className={`${fontSize.body} leading-snug mb-1`}>
              <span className="font-bold">Achievements: </span> {form.achievements}
            </div>
          )}
          
          {form.leadership && (
            <div className={`${fontSize.body} leading-snug mb-1`}>
              <span className="font-bold">Leadership: </span> {form.leadership}
            </div>
          )}
          
          {form.openSource && (
            <div className={`${fontSize.body} leading-snug`}>
              <span className="font-bold">Open Source: </span> {form.openSource}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
