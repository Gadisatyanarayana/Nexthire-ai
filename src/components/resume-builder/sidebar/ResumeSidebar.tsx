import React from 'react';
import { ResumeData } from '../types';
import { ThemeRegistry } from '../registries/ThemeRegistry';
import { TypographyRegistry } from '../registries/TypographyRegistry';
import { TemplateRegistry } from '../registries/TemplateRegistry';

interface SidebarProps {
  form: ResumeData;
  updateField: (field: keyof ResumeData, value: any) => void;
}

export default function ResumeSidebar({ form, updateField }: SidebarProps) {
  return (
    <aside className="w-72 border-r border-white/10 bg-[#111] flex flex-col overflow-y-auto print:hidden">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Global Design</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Template</label>
            <select 
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-brand-blue"
              value={form.templateId}
              onChange={(e) => updateField('templateId', e.target.value)}
            >
              {Object.keys(TemplateRegistry).map(key => (
                <option key={key} value={key}>{TemplateRegistry[key].name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Theme</label>
            <select 
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-brand-blue"
              value={form.themeId}
              onChange={(e) => updateField('themeId', e.target.value)}
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
              value={form.typography?.fontFamily || "times"}
              onChange={(e) => {
                const fontKey = e.target.value;
                const config = TypographyRegistry[fontKey];
                if (config) {
                  updateField('typography', { ...form.typography, fontFamily: config.fontFamily });
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
      
      <div className="p-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sections</h2>
        <ul className="space-y-1">
          {['Personal Info', 'Summary', 'Experience', 'Projects', 'Education', 'Skills'].map((sec) => (
            <li key={sec} className="px-3 py-2 text-sm rounded bg-white/5 border border-white/5 hover:bg-white/10 cursor-grab active:cursor-grabbing text-gray-300 flex items-center justify-between">
              <span>{sec}</span>
              <span className="text-gray-600">≡</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
