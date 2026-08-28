import React from 'react';
import { ResumeSection } from '../types';
import { SectionPlugin } from '../registries/SectionRegistry';
import { DesignTokens } from '../tokens';
import EducationCard from '../editor/EducationCard';

function EducationEditor({ section, updateSection }: { section: ResumeSection, updateSection: (data: any) => void }) {
  const data = section.data;
  const items = data.items || [];

  return (
    <div className="space-y-4">
      <button 
        onClick={() => updateSection({ ...data, items: [...items, { id: Date.now().toString(), institute: "", degree: "" }] })}
        className="text-sm text-brand-blue"
      >
        + Add Education
      </button>
      {items.map((edu: any, index: number) => (
        <EducationCard 
          key={edu.id || index}
          edu={edu}
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

function EducationRenderer({ section, tokens }: { section: ResumeSection, tokens: DesignTokens }) {
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
        Education
      </h2>
      <div className="space-y-4">
        {items.map((edu: any, i: number) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{edu.institute}</span>
              <span>{edu.startDate} - {edu.endDate}</span>
            </div>
            <div style={{ fontStyle: 'italic', marginBottom: '4px' }}>
              {edu.degree} {edu.branch && `in ${edu.branch}`} {edu.cgpa && `(GPA: ${edu.cgpa})`}
            </div>
            {edu.coursework && edu.coursework.length > 0 && (
              <div style={{ fontSize: tokens.typography.bodySize }}>
                <strong>Relevant Coursework: </strong> {edu.coursework.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const EducationSectionPlugin: SectionPlugin = {
  id: "education",
  name: "Education",
  icon: "graduation-cap",
  description: "Academic history and degrees",
  defaultData: { items: [] },
  editorComponent: EducationEditor,
  renderComponent: EducationRenderer
};
