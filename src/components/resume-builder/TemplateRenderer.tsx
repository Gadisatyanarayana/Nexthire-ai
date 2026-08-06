import React from "react";
import { ResumeTemplateConfig } from "./templates/JakesResume";
import { MapPin, Phone, Mail, Linkedin, Github, Globe } from "lucide-react";

// The FormState type must match the one from the page.
// We'll define a simplified interface here that matches the usage.
export interface TemplateFormState {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  targetRole: string;
  technicalSkills: string;
  softSkills: string;
  internshipCompany: string;
  internshipRole: string;
  internshipDuration: string;
  internshipAchievements: string;
  projectTitle: string;
  projectTech: string;
  projectDescription: string;
  degree: string;
  college: string;
  graduationYear: string;
  cgpa: string;
  leadership: string;
  achievements: string;
  openSource: string;
}

interface TemplateRendererProps {
  form: TemplateFormState;
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
      {(form.degree || form.college) && (
        <div className={layout.spacing.section}>
          <SectionTitle title="Education" />
          <div className={layout.spacing.item}>
            <div className={`flex justify-between items-start ${fontSize.body}`}>
              <div>
                <span className="font-bold">{form.college || "University Name"}</span>
              </div>
              <div className="text-right whitespace-nowrap">
                {form.graduationYear || "Graduation Year"}
              </div>
            </div>
            <div className={`flex justify-between items-start ${fontSize.body}`}>
              <div>
                <span className="italic">{form.degree || "Degree Name"}</span>
              </div>
              <div className="text-right whitespace-nowrap">
                {form.cgpa && `CGPA: ${form.cgpa}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPERIENCE */}
      {(form.internshipRole || form.internshipCompany) && (
        <div className={layout.spacing.section}>
          <SectionTitle title="Experience" />
          <div className={layout.spacing.item}>
            <div className={`flex justify-between items-start ${fontSize.body}`}>
              <div>
                <span className="font-bold">{form.internshipRole || "Job Title"}</span>
                {form.internshipCompany && <span> | <span className="italic">{form.internshipCompany}</span></span>}
              </div>
              <div className="text-right whitespace-nowrap">
                {form.internshipDuration || "Date Range"}
              </div>
            </div>
            {form.internshipAchievements && (
              <ul className={`list-disc list-outside ml-4 mt-1 ${fontSize.body} space-y-0.5`}>
                {parseBullets(form.internshipAchievements).map((bullet, i) => (
                  <li key={i} className="leading-snug">{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* PROJECTS */}
      {(form.projectTitle) && (
        <div className={layout.spacing.section}>
          <SectionTitle title="Projects" />
          <div className={layout.spacing.item}>
            <div className={`flex justify-between items-start ${fontSize.body}`}>
              <div>
                <span className="font-bold">{form.projectTitle || "Project Name"}</span>
                {form.projectTech && <span> | <span className="italic">{form.projectTech}</span></span>}
              </div>
            </div>
            {form.projectDescription && (
              <ul className={`list-disc list-outside ml-4 mt-1 ${fontSize.body} space-y-0.5`}>
                {parseBullets(form.projectDescription).map((bullet, i) => (
                  <li key={i} className="leading-snug">{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* SKILLS */}
      {(form.technicalSkills || form.softSkills) && (
        <div className={layout.spacing.section}>
          <SectionTitle title="Skills" />
          {form.technicalSkills && (
            <div className={`${fontSize.body} leading-snug`}>
              <span className="font-bold">Technical: </span> {form.technicalSkills}
            </div>
          )}
          {form.softSkills && (
            <div className={`${fontSize.body} leading-snug mt-1`}>
              <span className="font-bold">Soft Skills: </span> {form.softSkills}
            </div>
          )}
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
