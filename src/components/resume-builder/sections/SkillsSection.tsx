import React from 'react';
import { ResumeSection } from '../types';
import { SectionPlugin } from '../registries/SectionRegistry';
import { DesignTokens } from '../tokens';
import SkillsCard from '../editor/SkillsCard';

function SkillsEditor({ section, updateSection }: { section: ResumeSection, updateSection: (data: any) => void }) {
  const data = section.data;
  const items = data.items || [];

  return (
    <div className="space-y-4">
      <button 
        onClick={() => updateSection({ ...data, items: [...items, { id: Date.now().toString(), name: "", skills: "" }] })}
        className="text-sm text-brand-blue"
      >
        + Add Skill Category
      </button>
      {items.map((skill: any, index: number) => (
        <SkillsCard 
          key={skill.id || index}
          skill={skill}
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

function SkillsRenderer({ section, tokens }: { section: ResumeSection, tokens: DesignTokens }) {
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
        Skills
      </h2>
      <div className="space-y-2">
        {items.map((skill: any, i: number) => (
          <div key={i} style={{ fontSize: tokens.typography.bodySize }}>
            <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{skill.name}:</span>
            <span>{skill.skills}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const SkillsSectionPlugin: SectionPlugin = {
  id: "skills",
  name: "Skills",
  icon: "code",
  description: "Technical and soft skills",
  defaultData: { items: [] },
  editorComponent: SkillsEditor,
  renderComponent: SkillsRenderer
};
