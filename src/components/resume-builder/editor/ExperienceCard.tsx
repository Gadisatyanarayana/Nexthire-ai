import React from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { Experience } from '../types';

interface ExperienceCardProps {
  exp: Experience;
  index: number;
  onUpdate: (index: number, field: any, value: any) => void;
  onDelete: (index: number) => void;
}

export default function ExperienceCard({ exp, index, onUpdate, onDelete }: ExperienceCardProps) {
  return (
    <div className="bg-[#1a1a1a] p-5 rounded-xl border border-white/5 space-y-5 relative group transition-all hover:border-white/10 shadow-lg">
      <button 
        onClick={() => onDelete(index)}
        className="absolute top-5 right-5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="grid grid-cols-2 gap-4 pr-8">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Company</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="Google, Amazon, etc." 
            value={exp.company} 
            onChange={(e) => onUpdate(index, "company", e.target.value)} 
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Role / Title</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="Software Engineer" 
            value={exp.role} 
            onChange={(e) => onUpdate(index, "role", e.target.value)} 
          />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
            <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
              placeholder="MMM YYYY" 
              value={exp.startDate} 
              onChange={(e) => onUpdate(index, "startDate", e.target.value)} 
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">End Date</label>
            <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
              placeholder="Present or MMM YYYY" 
              value={exp.endDate} 
              onChange={(e) => onUpdate(index, "endDate", e.target.value)} 
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">Location</label>
            <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
              placeholder="San Francisco, CA" 
              value={exp.location || ""} 
              onChange={(e) => onUpdate(index, "location", e.target.value)} 
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">Employment Type</label>
            <select 
              className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors"
              value={exp.employmentType || "fulltime"}
              onChange={(e) => onUpdate(index, "employmentType", e.target.value)}
            >
              <option value="fulltime">Full-time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>
        </div>
        <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">Tech Stack (comma separated)</label>
            <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
              placeholder="React, Node.js, AWS..." 
              value={exp.techStack || ""} 
              onChange={(e) => onUpdate(index, "techStack", e.target.value)} 
            />
        </div>
      </div>

      <div className="pt-2 border-t border-white/5">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Achievements & Impact</label>
          <div className="flex gap-3">
            <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded transition-colors">
              <Sparkles className="h-3 w-3"/> AI STAR Generator
            </button>
            <button 
              onClick={() => {
                const newAchievements = [...exp.achievements, ""];
                onUpdate(index, "achievements", newAchievements);
              }}
              className="text-xs text-brand-blue hover:text-blue-300 flex items-center gap-1 bg-brand-blue/10 px-2 py-1 rounded transition-colors"
            >
              <Plus className="h-3 w-3"/> Add Bullet
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {exp.achievements.map((bullet: string, bIndex: number) => (
            <div key={bIndex} className="flex gap-3 items-start group/bullet">
              <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />
              <div className="flex-1 relative">
                <textarea 
                  className="w-full bg-black/50 border border-white/5 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors resize-none overflow-hidden" 
                  placeholder="Describe your impact..." 
                  value={bullet}
                  rows={2}
                  onChange={(e) => {
                    const newAchievements = [...exp.achievements];
                    newAchievements[bIndex] = e.target.value;
                    onUpdate(index, "achievements", newAchievements);
                  }} 
                />
                <button 
                  onClick={() => {
                    const newAchievements = exp.achievements.filter((_: string, i: number) => i !== bIndex);
                    onUpdate(index, "achievements", newAchievements);
                  }}
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover/bullet:opacity-100 transition-opacity bg-black rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
