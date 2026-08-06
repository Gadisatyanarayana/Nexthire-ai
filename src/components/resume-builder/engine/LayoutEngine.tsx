import React from 'react';
import { ResumeDocument } from '../types';
import { generateTokens } from '../tokens';
import { getLayoutTemplate } from '../registries/LayoutRegistry';
import { getSectionPlugin } from '../registries/SectionRegistry';

export default function LayoutEngine({ form }: { form: ResumeDocument }) {
  const tokens = generateTokens(form.theme, form.typography);
  const layoutMeta = getLayoutTemplate(form.metadata.templateId);
  
  return (
    <div 
      className="resume-document bg-white"
      style={{
        fontFamily: tokens.typography.bodyFont,
        fontSize: tokens.typography.bodySize,
        lineHeight: tokens.typography.lineHeight,
        color: tokens.colors.primary,
        padding: tokens.layout.pageMargins,
        backgroundColor: tokens.colors.background
      }}
    >
      <div className={`grid grid-cols-${layoutMeta.layout.columns} gap-8`}>
        {/* Iterate over document sections based on the layout's defined sections or just the document's sorted sections */}
        {form.sections.map((section) => {
          if (!section.visible) return null;
          
          try {
            const plugin = getSectionPlugin(section.type);
            const RenderComponent = plugin.renderComponent;
            return <RenderComponent key={section.id} section={section} tokens={tokens} />;
          } catch (e) {
            console.error(`Error rendering section ${section.id}:`, e);
            return <div key={section.id} className="text-red-500">Failed to render {section.type}</div>;
          }
        })}
      </div>
    </div>
  );
}
