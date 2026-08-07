import React, { useState } from 'react';
import { ResumeDocument } from '../types';
import { ThemeRegistry } from '../registries/ThemeRegistry';
import { TypographyRegistry } from '../registries/TypographyRegistry';
import { LayoutRegistry } from '../registries/LayoutRegistry';
import { SectionRegistry } from '../registries/SectionRegistry';
import { Target, Loader2, Sparkles, Upload } from 'lucide-react';

interface SidebarProps {
  form: ResumeDocument;
  updateField: (field: keyof ResumeDocument, value: any) => void;
}

export default function ResumeSidebar({ form, updateField }: SidebarProps) {
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
        // Merge parsed data back into form.sections
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
    <aside className="w-72 border-r border-white/10 bg-[#111] flex flex-col overflow-y-auto print:hidden">
      
      {/* Upload Parser */}
      <div className="p-4 border-b border-white/10 bg-brand-blue/5">
        <label className="flex items-center justify-center gap-2 w-full py-2 rounded bg-brand-blue/20 text-brand-blue text-sm font-medium hover:bg-brand-blue/30 transition-colors cursor-pointer border border-brand-blue/20">
          {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {parsing ? "Parsing PDF..." : "Import PDF Resume"}
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={parsing} />
        </label>
        <p className="text-[10px] text-gray-500 text-center mt-2">AI will automatically extract your data</p>
      </div>

      <div className="p-4 border-b border-white/10">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Global Design</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Layout Template</label>
            <select 
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-brand-blue"
              value={form.metadata.templateId}
              onChange={(e) => updateField('metadata', { ...form.metadata, templateId: e.target.value })}
            >
              {Object.keys(LayoutRegistry).map(key => (
                <option key={key} value={key}>{LayoutRegistry[key].name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Theme</label>
            <select 
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-brand-blue"
              value={form.theme.id}
              onChange={(e) => {
                const config = ThemeRegistry[e.target.value];
                if (config) {
                  // Merge the base ThemeSettings with the selected config's colors & styles
                  updateField('theme', { 
                    ...form.theme, 
                    id: e.target.value,
                    primaryColor: config.colors.primary,
                    accentColor: config.colors.accent,
                    backgroundColor: config.colors.background,
                    headerStyle: config.style?.headerStyle || form.theme.headerStyle,
                    sectionDivider: config.style?.dividerStyle || form.theme.sectionDivider,
                  });
                }
              }}
            >
              {Object.keys(ThemeRegistry).map(key => (
                <option key={key} value={key}>{ThemeRegistry[key].name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Typography</label>
            <select 
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-brand-blue"
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
          </div>
        </div>
      </div>
      
      <div className="p-4 flex-1">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add Sections</h2>
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
                className={`text-xs px-2 py-2 rounded border ${alreadyAdded ? 'border-white/5 bg-white/5 text-gray-500' : 'border-white/10 bg-[#1a1a1a] hover:border-brand-blue text-gray-300'} transition-colors`}
              >
                + {plugin.name}
              </button>
            )
          })}
        </div>
      </div>
      <div className="p-4 border-t border-white/10">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
          <Target className="h-3 w-3" /> Job Matcher
        </h2>
        <textarea
          className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-brand-blue min-h-[80px] resize-y mb-2"
          placeholder="Paste Job Description here to analyze keyword match..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />
        <button
          onClick={handleMatch}
          disabled={matching || !jdText}
          className="w-full py-1.5 rounded bg-brand-blue/10 text-brand-blue text-xs font-medium hover:bg-brand-blue/20 transition-colors disabled:opacity-50 flex justify-center items-center gap-1"
        >
          {matching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {matching ? "Analyzing..." : "Match JD"}
        </button>

        {matchResult && (
          <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded text-xs space-y-3">
            <div className="flex justify-between items-center font-bold">
              <span className="text-gray-300">Overall Match:</span>
              <span className={matchResult.overallMatch > 75 ? "text-green-400" : "text-yellow-400"}>{matchResult.overallMatch}%</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/5 text-gray-400">
              <div className="flex justify-between"><span>Role:</span> <span>{matchResult.roleFit}%</span></div>
              <div className="flex justify-between"><span>Tech:</span> <span>{matchResult.technicalFit}%</span></div>
            </div>
            
            {matchResult.missingKeywords?.length > 0 && (
              <div>
                <span className="text-gray-400 block mb-1">Missing Keywords (Click to add):</span>
                <div className="flex flex-wrap gap-1">
                  {matchResult.missingKeywords.map((kw: string, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => {
                        const skillsSection = form.sections.find(s => s.type === 'skills');
                        if (skillsSection) {
                          const items = skillsSection.data.items || [];
                          const updated = [...items];
                          if (updated.length > 0) {
                            updated[0].skills = updated[0].skills ? updated[0].skills + `, ${kw}` : kw;
                          } else {
                            updated.push({ name: "Required", skills: kw });
                          }
                          const newSections = form.sections.map(s => s.type === 'skills' ? { ...s, data: { items: updated } } : s);
                          updateField('sections', newSections);
                        }
                      }}
                      className="px-1.5 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 transition-colors"
                    >
                      + {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {matchResult.recommendedKeywords?.length > 0 && (
              <div>
                <span className="text-gray-400 block mb-1">Recommended Keywords:</span>
                <div className="flex flex-wrap gap-1">
                  {matchResult.recommendedKeywords.map((kw: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20">{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </aside>
  );
}
