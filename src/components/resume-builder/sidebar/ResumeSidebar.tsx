import React, { useState } from 'react';
import { ResumeDocument } from '../types';
import { ThemeRegistry } from '../registries/ThemeRegistry';
import { TypographyRegistry } from '../registries/TypographyRegistry';
import { LayoutRegistry } from '../registries/LayoutRegistry';
import { SectionRegistry } from '../registries/SectionRegistry';
import { Target, Loader2, Sparkles, Upload, LayoutTemplate, Palette, Type, GripVertical, Plus } from 'lucide-react';

interface SidebarProps {
  form: ResumeDocument;
  updateField: (field: keyof ResumeDocument, value: any) => void;
  isDark: boolean;
}

export default function ResumeSidebar({ form, updateField, isDark }: SidebarProps) {
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

  const themeKeys = Object.keys(ThemeRegistry);

  return (
    <aside className="w-[320px] min-w-[320px] border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#0A0A0A] flex flex-col overflow-y-auto print:hidden shadow-sm z-40 relative transition-colors duration-300">
      
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
        <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 tracking-wider mb-5 flex items-center gap-2">
          DESIGN
        </h2>
        
        <div className="space-y-6">
          {/* Template */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><LayoutTemplate className="h-3 w-3"/> Template</label>
            <div className="relative">
              <select 
                className="w-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50 transition-all appearance-none cursor-pointer"
                value={form.metadata.templateId}
                onChange={(e) => updateField('metadata', { ...form.metadata, templateId: e.target.value })}
              >
                {Object.keys(LayoutRegistry).map(key => (
                  <option key={key} value={key}>{LayoutRegistry[key].name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">›</div>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Palette className="h-3 w-3"/> Color</label>
            <div className="flex items-center gap-3">
              {themeKeys.map(key => {
                const config = ThemeRegistry[key];
                const isSelected = form.theme.id === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      updateField('theme', { 
                        ...form.theme, 
                        id: key,
                        primaryColor: config.colors.primary,
                        accentColor: config.colors.accent,
                        backgroundColor: config.colors.background,
                        headerStyle: config.style?.headerStyle || form.theme.headerStyle,
                        sectionDivider: config.style?.dividerStyle || form.theme.sectionDivider,
                      });
                    }}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-all ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <span 
                      className={`w-4 h-4 rounded-full border-2 ${isSelected ? 'border-gray-900 dark:border-white' : 'border-transparent'} shadow-sm`}
                      style={{ backgroundColor: config.colors.primary }}
                    />
                    {config.name.split(' ')[0]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Type className="h-3 w-3"/> Typography</label>
            <div className="relative">
              <select 
                className="w-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50 transition-all appearance-none cursor-pointer"
                value={form.typography?.headingFont || "times"}
                onChange={(e) => {
                  const config = TypographyRegistry[e.target.value];
                  if (config) {
                    updateField('typography', { 
                      ...form.typography, 
                      headingFont: config.fontFamily,
                      bodyFont: config.fontFamily,
                      headingSize: config.overrides?.headingSize || form.typography.headingSize,
                    });
                  }
                }}
              >
                {Object.keys(TypographyRegistry).map(key => (
                  <option key={key} value={key}>{TypographyRegistry[key].name}</option>
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

    </aside>
  );
}
