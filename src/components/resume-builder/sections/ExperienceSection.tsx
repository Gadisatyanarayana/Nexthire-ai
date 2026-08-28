import React from 'react';
import { ResumeSection } from '../types';
import { SectionPlugin } from '../registries/SectionRegistry';
import { DesignTokens } from '../tokens';
import ExperienceCard from '../editor/ExperienceCard';

// --- EDITOR ---
function ExperienceEditor({ section, updateSection }: { section: ResumeSection, updateSection: (data: any) => void }) {
  const data = section.data;
  const items = data.items || [];

  return (
    <div className="space-y-4">
      <button 
        onClick={() => updateSection({ ...data, items: [...items, { id: Date.now().toString(), company: "", role: "", achievements: [] }] })}
        className="text-sm text-brand-blue"
      >
        + Add Experience
      </button>
      {items.map((exp: any, index: number) => (
        <ExperienceCard 
          key={exp.id || index}
          exp={exp}
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

// --- RENDERER ---
function ExperienceRenderer({ section, tokens }: { section: ResumeSection, tokens: DesignTokens }) {
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
        Experience
      </h2>
      <div className="space-y-4">
        {items.map((exp: any, i: number) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{exp.role}</span>
              <span>{exp.startDate} - {exp.endDate || 'Present'}</span>
            </div>
            <div style={{ fontStyle: 'italic', marginBottom: '4px' }}>
              {exp.company} {exp.location && `| ${exp.location}`}
            </div>
            <ul style={{ listStyleType: tokens.layout.bulletStyle, paddingLeft: '20px', fontSize: tokens.typography.bodySize, lineHeight: tokens.typography.lineHeight }}>
              {(exp.achievements || []).map((ach: string, j: number) => (
                <li key={j} style={{ marginBottom: tokens.typography.paragraphGap }}>{ach}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- PLUGIN EXPORT ---
export const ExperienceSectionPlugin: SectionPlugin = {
  id: "experience",
  name: "Experience",
  icon: "briefcase",
  description: "Work history and roles",
  defaultData: { items: [] },
  editorComponent: ExperienceEditor,
  renderComponent: ExperienceRenderer
};
