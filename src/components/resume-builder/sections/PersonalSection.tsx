import React from 'react';
import { ResumeSection } from '../types';
import { SectionPlugin } from '../registries/SectionRegistry';
import { User, Image as ImageIcon } from 'lucide-react';

// --- EDITOR ---
function PersonalEditor({ section, updateSection }: { section: ResumeSection, updateSection: (data: any) => void }) {
  const data = section.data || {};
  const updateField = (field: string, value: any) => updateSection({ ...data, [field]: value });

  return (
    <div className="space-y-4">
      {/* Basic Contact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Full Name</label>
          <input
            className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2.5 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none mt-1"
            value={data.fullName || ""}
            placeholder="SATYANARAYANA GADI"
            onChange={(e) => updateField("fullName", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Target Role</label>
          <input
            className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2.5 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none mt-1"
            value={data.targetRole || ""}
            placeholder="Software Engineer"
            onChange={(e) => updateField("targetRole", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Email Address</label>
          <input
            className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2.5 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none mt-1"
            value={data.email || ""}
            placeholder="satya@example.com"
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Phone Number</label>
          <input
            className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2.5 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none mt-1"
            value={data.phone || ""}
            placeholder="+91 98765 43210"
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Location</label>
          <input
            className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2.5 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none mt-1"
            value={data.location || ""}
            placeholder="Hyderabad, India"
            onChange={(e) => updateField("location", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">LinkedIn Profile</label>
          <input
            className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2.5 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none mt-1"
            value={data.linkedin || ""}
            placeholder="linkedin.com/in/satyanarayana"
            onChange={(e) => updateField("linkedin", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">GitHub Handle</label>
          <input
            className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2.5 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none mt-1"
            value={data.github || ""}
            placeholder="github.com/satyanarayana"
            onChange={(e) => updateField("github", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">LeetCode Profile</label>
          <input
            className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2.5 py-1.5 text-sm focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none mt-1"
            value={data.leetcode || ""}
            placeholder="leetcode.com/u/satya"
            onChange={(e) => updateField("leetcode", e.target.value)}
          />
        </div>
      </div>

      {/* Profile Photo Controls */}
      <div className="pt-3 border-t border-gray-100 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-brand-blue" /> Profile Photograph
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!!data.showPhoto}
              onChange={(e) => updateField("showPhoto", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-gray-600 peer-checked:bg-brand-blue"></div>
          </label>
        </div>

        {data.showPhoto && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10">
            <div>
              <label className="text-[11px] text-gray-500 dark:text-gray-400">Photo URL</label>
              <input
                className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2.5 py-1 text-xs focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none mt-0.5"
                value={data.photoUrl || ""}
                placeholder="https://example.com/photo.jpg"
                onChange={(e) => updateField("photoUrl", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 dark:text-gray-400">Crop / Shape</label>
              <select
                className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded px-2.5 py-1 text-xs focus:border-brand-blue text-gray-900 dark:text-gray-100 outline-none mt-0.5"
                value={data.photoStyle || "circle"}
                onChange={(e) => updateField("photoStyle", e.target.value)}
              >
                <option value="circle">Circular</option>
                <option value="rounded">Rounded Square</option>
                <option value="square">Sharp Square</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- RENDERER DUMMY (LayoutEngine delegates to ResumeSectionRenderer) ---
function PersonalRenderer() {
  return null;
}

// --- PLUGIN EXPORT ---
export const PersonalSectionPlugin: SectionPlugin = {
  id: "personal",
  name: "Personal Info",
  icon: "user",
  description: "Contact details, coding profiles, and photo",
  defaultData: {
    fullName: "",
    targetRole: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    leetcode: "",
    showPhoto: false,
  },
  editorComponent: PersonalEditor,
  renderComponent: PersonalRenderer,
};
