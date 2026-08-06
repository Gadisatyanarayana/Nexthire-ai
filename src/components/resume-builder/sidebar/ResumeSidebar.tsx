import React from 'react';
import { ResumeDocument } from '../types';
import { ThemeRegistry } from '../registries/ThemeRegistry';
import { TypographyRegistry } from '../registries/TypographyRegistry';
import { LayoutRegistry } from '../registries/LayoutRegistry';
import { SectionRegistry } from '../registries/SectionRegistry';

interface SidebarProps {
  form: ResumeDocument;
  updateField: (field: keyof ResumeDocument, value: any) => void;
}

export default function ResumeSidebar({ form, updateField }: SidebarProps) {
  return (
    <aside className="w-72 border-r border-white/10 bg-[#111] flex flex-col overflow-y-auto print:hidden">
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
    </aside>
  );
}
