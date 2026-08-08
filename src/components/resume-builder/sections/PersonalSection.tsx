import React from 'react';
import { ResumeSection } from '../types';
import { SectionPlugin } from '../registries/SectionRegistry';
import { DesignTokens } from '../tokens';

// --- EDITOR ---
function PersonalEditor({ section, updateSection }: { section: ResumeSection, updateSection: (data: any) => void }) {
  const data = section.data;
  const updateField = (field: string, value: string) => updateSection({ ...data, [field]: value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-xs text-gray-500 dark:text-gray-400">Full Name</label><input className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none" value={data.fullName || ""} onChange={e => updateField('fullName', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500 dark:text-gray-400">Target Role</label><input className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none" value={data.targetRole || ""} onChange={e => updateField('targetRole', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500 dark:text-gray-400">Email</label><input className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none" value={data.email || ""} onChange={e => updateField('email', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500 dark:text-gray-400">Phone</label><input className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none" value={data.phone || ""} onChange={e => updateField('phone', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500 dark:text-gray-400">Location</label><input className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none" value={data.location || ""} onChange={e => updateField('location', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500 dark:text-gray-400">LinkedIn</label><input className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none" value={data.linkedin || ""} onChange={e => updateField('linkedin', e.target.value)} /></div>
      </div>
    </div>
  );
}

// --- RENDERER ---
function PersonalRenderer({ section, tokens }: { section: ResumeSection, tokens: DesignTokens }) {
  const data = section.data;
  return (
    <div className="text-center w-full" style={{ marginBottom: tokens.typography.sectionGap }}>
      <h1 style={{ fontFamily: tokens.typography.headingFont, fontSize: tokens.typography.headingSize, color: tokens.colors.primary, textTransform: tokens.layout.headerStyle === 'minimal' ? 'uppercase' : 'none' }}>
        {data.fullName || "Your Name"}
      </h1>
      {data.targetRole && (
        <div style={{ color: tokens.colors.accent, fontSize: tokens.typography.bodySize, marginTop: '2px' }}>{data.targetRole}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '9pt', marginTop: '6px' }}>
        {data.email && <span>{data.email}</span>}
        {data.phone && <span>• {data.phone}</span>}
        {data.location && <span>• {data.location}</span>}
        {data.linkedin && <span>• {data.linkedin}</span>}
      </div>
    </div>
  );
}

// --- PLUGIN EXPORT ---
export const PersonalSectionPlugin: SectionPlugin = {
  id: "personal",
  name: "Personal Info",
  icon: "user",
  description: "Basic contact information",
  defaultData: { fullName: "", email: "", phone: "", location: "", linkedin: "", github: "", portfolio: "" },
  editorComponent: PersonalEditor,
  renderComponent: PersonalRenderer
};
