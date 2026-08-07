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
    <aside className="w-80 border-r border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md flex flex-col overflow-y-auto print:hidden shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-40 relative">
      
      {/* Upload Parser */}
      <div className="p-5 border-b border-white/5 bg-gradient-to-b from-brand-blue/10 to-transparent">
        <label className="flex flex-col items-center justify-center gap-3 w-full py-6 rounded-xl bg-brand-blue/5 border border-dashed border-brand-blue/30 text-brand-blue text-sm font-medium hover:bg-brand-blue/10 hover:border-brand-blue/50 transition-all duration-300 cursor-pointer shadow-inner">
          <div className="p-3 rounded-full bg-brand-blue/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            {parsing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </div>
          <span className="tracking-wide">{parsing ? "Extracting Data..." : "Import PDF Resume"}</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={parsing} />
        </label>
        <p className="text-[11px] text-gray-500/80 text-center mt-3 font-medium tracking-wide">AI WILL AUTOMATICALLY EXTRACT YOUR DATA</p>
      </div>

      <div className="p-5 border-b border-white/5">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <div className="h-px w-4 bg-gray-600"></div> Global Design
        </h2>
        
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] text-gray-500 font-semibold tracking-wide uppercase">Layout Template</label>
            <select 
              className="w-full bg-[#151515] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50 transition-all appearance-none cursor-pointer"
              value={form.metadata.templateId}
              onChange={(e) => updateField('metadata', { ...form.metadata, templateId: e.target.value })}
            >
              {Object.keys(LayoutRegistry).map(key => (
                <option key={key} value={key}>{LayoutRegistry[key].name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-gray-500 font-semibold tracking-wide uppercase">Theme Palette</label>
            <select 
              className="w-full bg-[#151515] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50 transition-all appearance-none cursor-pointer"
              value={form.theme.id}
              onChange={(e) => {
                const config = ThemeRegistry[e.target.value];
                if (config) {
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
          <div className="space-y-2">
            <label className="text-[11px] text-gray-500 font-semibold tracking-wide uppercase">Typography</label>
            <select 
              className="w-full bg-[#151515] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50 transition-all appearance-none cursor-pointer"
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
      
      <div className="p-5 flex-1 border-b border-white/5 bg-[#0a0a0a]">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <div className="h-px w-4 bg-gray-600"></div> Add Sections
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
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
                className={`text-xs px-3 py-2.5 rounded-lg border font-medium text-left flex items-center gap-2 transition-all duration-200 shadow-sm ${
                  alreadyAdded 
                    ? 'border-white/5 bg-white/5 text-gray-600 cursor-not-allowed' 
                    : 'border-white/10 bg-[#151515] hover:bg-[#202020] hover:border-brand-blue/50 hover:shadow-[0_0_10px_rgba(59,130,246,0.1)] text-gray-300'
                }`}
              >
                <span className="text-brand-blue/70">+</span> {plugin.name}
              </button>
            )
          })}
        </div>
      </div>
      <div className="p-5 bg-gradient-to-t from-brand-blue/5 to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 blur-[50px] pointer-events-none rounded-full" />
        <h2 className="text-[10px] font-bold text-brand-blue/80 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 relative z-10">
          <Target className="h-3.5 w-3.5" /> Job Matcher
        </h2>
        <textarea
          className="w-full bg-[#0a0a0a]/80 backdrop-blur-sm border border-brand-blue/20 rounded-xl px-3 py-3 text-xs text-gray-300 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50 min-h-[90px] resize-y mb-3 shadow-inner relative z-10 transition-all placeholder:text-gray-600"
          placeholder="Paste Job Description to optimize resume..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />
        <button
          onClick={handleMatch}
          disabled={matching || !jdText}
          className="w-full py-2.5 rounded-lg bg-brand-blue text-white text-xs font-bold tracking-wide hover:bg-blue-600 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-300 disabled:opacity-50 disabled:hover:shadow-none flex justify-center items-center gap-2 relative z-10"
        >
          {matching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {matching ? "ANALYZING JD..." : "OPTIMIZE FOR ROLE"}
        </button>

        {matchResult && (
          <div className="mt-5 p-4 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl text-xs shadow-xl relative z-10">
            <div className="flex justify-between items-center font-bold text-sm mb-4">
              <span className="text-gray-300">Overall Match</span>
              <div className={`px-2.5 py-1 rounded-full ${matchResult.overallMatch > 75 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                {matchResult.overallMatch}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/5 text-gray-400 mb-3">
              <div className="bg-white/5 p-2 rounded-lg">
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Role Fit</span>
                <span className="font-medium text-white">{matchResult.roleFit}%</span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg">
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Tech Fit</span>
                <span className="font-medium text-white">{matchResult.technicalFit}%</span>
              </div>
            </div>
            
            {matchResult.missingKeywords?.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-2">Missing Required Keywords</span>
                <div className="flex flex-wrap gap-1.5">
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
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md border border-red-500/20 transition-colors shadow-sm group relative"
                    >
                      <span className="opacity-50 group-hover:opacity-100 mr-1 transition-opacity">+</span>{kw}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {matchResult.recommendedKeywords?.length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-2">Recommended Additions</span>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.recommendedKeywords.map((kw: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-yellow-500/10 text-yellow-400/90 rounded-md border border-yellow-500/20">{kw}</span>
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
