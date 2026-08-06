import React from 'react';
import { ResumeSection } from '../types';
import { SectionPlugin } from '../registries/SectionRegistry';
import { DesignTokens } from '../tokens';

// --- EDITOR ---
function SummaryEditor({ section, updateSection }: { section: ResumeSection, updateSection: (data: any) => void }) {
  const data = section.data;
  return (
    <div className="space-y-4">
      <textarea 
        className="w-full bg-black border border-white/10 rounded px-2 py-1 text-sm focus:border-brand-blue min-h-[100px]" 
        value={data.text} 
        onChange={e => updateSection({ ...data, text: e.target.value })} 
        placeholder="Professional summary..."
      />
    </div>
  );
}

// --- RENDERER ---
function SummaryRenderer({ section, tokens }: { section: ResumeSection, tokens: DesignTokens }) {
  const data = section.data;
  if (!data.text) return null;
  return (
    <div className="w-full" style={{ marginBottom: tokens.typography.sectionGap }}>
      <p style={{ fontSize: tokens.typography.bodySize, lineHeight: tokens.typography.lineHeight }}>
        {data.text}
      </p>
    </div>
  );
}

// --- PLUGIN EXPORT ---
export const SummarySectionPlugin: SectionPlugin = {
  id: "summary",
  name: "Summary",
  icon: "align-left",
  description: "Brief professional overview",
  defaultData: { text: "" },
  editorComponent: SummaryEditor,
  renderComponent: SummaryRenderer
};
