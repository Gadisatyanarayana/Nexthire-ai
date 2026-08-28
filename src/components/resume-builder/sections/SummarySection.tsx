import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { ResumeSection } from '../types';
import { SectionPlugin } from '../registries/SectionRegistry';
import { DesignTokens } from '../tokens';

// --- EDITOR ---
function SummaryEditor({ section, updateSection }: { section: ResumeSection, updateSection: (data: any) => void }) {
  const data = section.data;
  const [loading, setLoading] = useState(false);

  const handleAIImprove = async () => {
    if (!data.text) return;
    setLoading(true);
    try {
      const res = await fetch('/api/resume/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.text, type: 'summary' })
      });
      const result = await res.json();
      if (result.success) {
        updateSection({ ...data, text: result.text });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs text-gray-400">Professional Summary</label>
        <button 
          onClick={handleAIImprove}
          disabled={loading || !data.text}
          className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Improve with AI
        </button>
      </div>
      <textarea 
        className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue min-h-[120px] resize-y text-gray-200" 
        value={data.text} 
        onChange={e => updateSection({ ...data, text: e.target.value })} 
        placeholder="Write a compelling professional summary..."
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
