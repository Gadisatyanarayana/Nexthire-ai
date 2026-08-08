import React, { useState } from 'react';
import { ResumeDocument } from '../types';
import { SectionRegistry } from '../registries/SectionRegistry';
import { ColorPaletteRegistry } from '../theme/ColorRegistry';
import { TypographyRegistry } from '../theme/TypographyRegistry';
import { ProductionTemplates } from '../templates/config/TemplateDefinitions';
import TemplateGalleryModal from '../templates/TemplateGalleryModal';
import { Target, Loader2, Sparkles, Upload, LayoutTemplate, Palette, Type, GripVertical, Plus } from 'lucide-react';

interface SidebarProps {
  form: ResumeDocument;
  updateField: (field: keyof ResumeDocument, value: any) => void;
}

export default function ResumeSidebar({ form, updateField }: SidebarProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [jdText, setJdText] = useState("");
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [parsing, setParsing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      
      if (result.success && result.data) {
        const parsed = result.data;
        const newSections = form.sections.map(sec => {
          if (sec.type === 'personal') return { ...sec, data: { ...sec.data, ...parsed } };
          if (sec.type === 'summary') return { ...sec, data: { text: parsed.summary || "" } };
          if (sec.type === 'experience') return { ...sec, data: { items: parsed.experience || [] } };
          if (sec.type === 'education') return { ...sec, data: { items: parsed.education || [] } };
          if (sec.type === 'projects') return { ...sec, data: { items: parsed.projects || [] } };
          if (sec.type === 'skills') return { ...sec, data: { items: parsed.skills || [] } };
          return sec;
        });
        updateField('sections', newSections);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParsing(false);
    }
  };

  const handleMatch = async () => {
    if (!jdText) return;
    setMatching(true);
    try {
      const res = await fetch('/api/resume/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: form, jobDescription: jdText })
      });
      const result = await res.json();
      if (result.success) {
        setMatchResult(result.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMatching(false);
    }
  };

  return (
    <aside className="w-[320px] min-w-[320px] border-r border-[var(--studio-border)] bg-[var(--studio-surface)] flex flex-col overflow-y-auto print:hidden shadow-sm z-40 relative transition-colors duration-300">
      
      {/* Upload Parser */}
      <div className="p-5 border-b border-gray-100 dark:border-white/5">
        <label className="flex flex-col items-center justify-center gap-2 w-full py-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
          {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="text-xs">{parsing ? "Extracting..." : "Import PDF"}</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={parsing} />
        </label>
      </div>

      {/* Design Panel */}
      <div className="p-5 border-b border-gray-100 dark:border-white/5">
        <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 tracking-wider mb-5 flex items-center justify-between">
          <span>DESIGN STUDIO</span>
          <span className="text-[10px] bg-brand-blue/20 text-brand-blue px-2 py-0.5 rounded font-mono">LIVE A4</span>
        </h2>
        
        <div className="space-y-5">
          {/* Template Gallery Button */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><LayoutTemplate className="h-3.5 w-3.5 text-brand-blue"/> Template</label>
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="w-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 hover:border-brand-blue/60 rounded-lg px-3 py-2.5 text-xs text-gray-900 dark:text-gray-200 flex items-center justify-between transition-all group shadow-sm"
            >
              <div className="flex flex-col text-left">
                <span className="font-bold text-white group-hover:text-brand-blue transition-colors">
                  {ProductionTemplates[form.metadata?.templateId || "software-engineer"]?.name || "Software Engineer"}
                </span>
                <span className="text-[10px] text-gray-400">
                  {ProductionTemplates[form.metadata?.templateId || "software-engineer"]?.category || "TECHNICAL"} • ATS Safe
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-brand-blue/10 text-brand-blue rounded group-hover:bg-brand-blue group-hover:text-white transition-all">
                Browse (10)
              </span>
            </button>
          </div>

          {/* Color Palette System */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Palette className="h-3.5 w-3.5 text-emerald-400"/> Color Palette</label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.keys(ColorPaletteRegistry).map((key) => {
                const palette = ColorPaletteRegistry[key];
                const isSelected = (form.metadata?.colorPaletteId || "navy") === key;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      updateField("metadata", { ...form.metadata, colorPaletteId: key });
                    }}
                    title={palette.name}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      isSelected
                        ? "border-brand-blue bg-brand-blue/10 ring-1 ring-brand-blue"
                        : "border-gray-200 dark:border-white/10 hover:border-white/30 bg-white dark:bg-[#151515]"
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                      style={{ backgroundColor: palette.colors.primary }}
                    />
                    <span className="text-[9.5px] mt-1 text-gray-400 truncate w-full text-center font-medium">
                      {palette.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography System */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Type className="h-3.5 w-3.5 text-amber-400"/> Font Family</label>
            <div className="relative">
              <select 
                className="w-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-gray-200 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50 transition-all appearance-none cursor-pointer"
                value={form.typography?.bodyFont ? "inter" : "inter"}
                onChange={(e) => {
                  const fontConfig = TypographyRegistry[e.target.value];
                  if (fontConfig) {
                    updateField("typography", { 
                      ...form.typography, 
                      headingFont: fontConfig.fontFamily,
                      bodyFont: fontConfig.fontFamily,
                    });
                  }
                }}
              >
                {Object.keys(TypographyRegistry).map((key) => (
                  <option key={key} value={key}>
                    {TypographyRegistry[key].name} ({TypographyRegistry[key].category})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">›</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Panel */}
      <div className="p-5 flex-1 border-b border-gray-100 dark:border-white/5">
        <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 tracking-wider mb-4 flex items-center gap-2">
          CONTENT
        </h2>
        
        <div className="space-y-1.5">
          {form.sections.map((section) => {
            const plugin = SectionRegistry[section.type];
            return (
              <div key={section.id} className="flex items-center gap-2 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <span>{plugin?.name || section.type}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(SectionRegistry).map(key => {
              const plugin = SectionRegistry[key];
              const alreadyAdded = form.sections.some(s => s.type === key);
              
              return (
                <button 
                  key={key}
                  disabled={alreadyAdded && key === 'personal'} // allow multiples except personal
                  onClick={() => {
                    const newSection = {
                      id: `${key}-${Date.now()}`,
                      type: key,
                      visible: true,
                      data: { ...plugin.defaultData }
                    };
                    updateField('sections', [...form.sections, newSection]);
                  }}
                  className={`text-xs px-2.5 py-1.5 rounded-md font-medium text-left flex items-center gap-1.5 transition-colors ${
                    alreadyAdded 
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-transparent' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <Plus className="h-3 w-3" /> {plugin.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Job Matcher Area (Simplified) */}
      <div className="p-5 bg-gray-50 dark:bg-white/5 mt-auto">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" /> Job Matcher
        </h2>
        <textarea
          className="w-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-xs text-gray-900 dark:text-gray-200 outline-none focus:border-brand-blue mb-2 resize-y min-h-[60px]"
          placeholder="Paste Job Description..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />
        <button
          onClick={handleMatch}
          disabled={matching || !jdText}
          className="w-full py-2 rounded-md bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex justify-center items-center gap-1.5"
        >
          {matching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {matching ? "Analyzing..." : "Optimize"}
        </button>

        {matchResult && (
          <div className="mt-3 p-3 bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-md text-xs">
            <div className="flex justify-between items-center font-bold mb-2">
              <span className="text-gray-700 dark:text-gray-300">Match</span>
              <span className={matchResult.overallMatch > 75 ? 'text-green-500' : 'text-yellow-500'}>{matchResult.overallMatch}%</span>
            </div>
            {matchResult.missingKeywords?.length > 0 && (
              <div className="mt-2 text-gray-500 text-[10px] uppercase">
                Missing: {matchResult.missingKeywords.join(", ")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Gallery Modal */}
      <TemplateGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        document={form}
        onSelectTemplate={(id) => {
          updateField("metadata", { ...form.metadata, templateId: id });
        }}
      />
    </aside>
  );
}
