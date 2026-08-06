import React from 'react';
import { ResumeSection } from '../types';
import { SectionPlugin } from '../registries/SectionRegistry';
import { DesignTokens } from '../tokens';
import ProjectCard from '../editor/ProjectCard';

function ProjectsEditor({ section, updateSection }: { section: ResumeSection, updateSection: (data: any) => void }) {
  const data = section.data;
  const items = data.items || [];

  return (
    <div className="space-y-4">
      <button 
        onClick={() => updateSection({ ...data, items: [...items, { id: Date.now().toString(), name: "", achievements: [] }] })}
        className="text-sm text-brand-blue"
      >
        + Add Project
      </button>
      {items.map((proj: any, index: number) => (
        <ProjectCard 
          key={proj.id || index}
          proj={proj}
          index={index}
          onUpdate={(i, f, v) => {
            const newItems = [...items];
            newItems[i][f] = v;
            updateSection({ ...data, items: newItems });
          }}
          onDelete={(i) => {
            const newItems = items.filter((_: any, idx: number) => idx !== i);
            updateSection({ ...data, items: newItems });
          }}
        />
      ))}
    </div>
  );
}

function ProjectsRenderer({ section, tokens }: { section: ResumeSection, tokens: DesignTokens }) {
  const items = section.data.items || [];
  if (items.length === 0) return null;

  return (
    <div className="w-full" style={{ marginBottom: tokens.typography.sectionGap }}>
      <h2 style={{ 
        fontFamily: tokens.typography.headingFont, 
        fontSize: tokens.typography.headingSize, 
        color: tokens.colors.primary,
        borderBottom: tokens.layout.sectionDivider === 'thin' ? `1px solid ${tokens.colors.accent}` : 'none',
        paddingBottom: '4px',
        marginBottom: '10px'
      }}>
        Projects
      </h2>
      <div className="space-y-4">
        {items.map((proj: any, i: number) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{proj.name} {proj.techStack && `| ${proj.techStack}`}</span>
              <span>{proj.duration}</span>
            </div>
            <ul style={{ listStyleType: tokens.layout.bulletStyle, paddingLeft: '20px', fontSize: tokens.typography.bodySize, lineHeight: tokens.typography.lineHeight }}>
              {(proj.achievements || []).map((ach: string, j: number) => (
                <li key={j} style={{ marginBottom: tokens.typography.paragraphGap }}>{ach}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export const ProjectsSectionPlugin: SectionPlugin = {
  id: "projects",
  name: "Projects",
  icon: "folder",
  description: "Personal and academic projects",
  defaultData: { items: [] },
  editorComponent: ProjectsEditor,
  renderComponent: ProjectsRenderer
};
