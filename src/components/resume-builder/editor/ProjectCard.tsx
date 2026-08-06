import React from 'react';
import { Plus, Trash2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  proj: Project;
  index: number;
  onUpdate: (index: number, field: any, value: any) => void;
  onDelete: (index: number) => void;
}

export default function ProjectCard({ proj, index, onUpdate, onDelete }: ProjectCardProps) {
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
          <label className="text-xs text-gray-400 mb-1 block">Project Name</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="E-Commerce Platform" 
            value={proj.name} 
            onChange={(e) => onUpdate(index, "name", e.target.value)} 
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Category</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="Web App, Machine Learning, etc." 
            value={proj.category || ""} 
            onChange={(e) => onUpdate(index, "category", e.target.value)} 
          />
        </div>
        
        <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">Tech Stack (comma separated)</label>
            <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
              placeholder="React, Node.js, MongoDB..." 
              value={proj.techStack} 
              onChange={(e) => onUpdate(index, "techStack", e.target.value)} 
            />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Duration / Date</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="Jan 2023 - May 2023" 
            value={proj.duration} 
            onChange={(e) => onUpdate(index, "duration", e.target.value)} 
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Role</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="Lead Developer" 
            value={proj.role || ""} 
            onChange={(e) => onUpdate(index, "role", e.target.value)} 
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">GitHub URL</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="github.com/username/repo" 
            value={proj.github} 
            onChange={(e) => onUpdate(index, "github", e.target.value)} 
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Live Demo URL</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="my-project.vercel.app" 
            value={proj.liveUrl} 
            onChange={(e) => onUpdate(index, "liveUrl", e.target.value)} 
          />
        </div>
      </div>

      <div className="pt-2 border-t border-white/5">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Description & Achievements</label>
          <div className="flex gap-3">
            <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded transition-colors">
              <Sparkles className="h-3 w-3"/> AI Improve
            </button>
            <button 
              onClick={() => {
                const newAchievements = [...proj.achievements, ""];
                onUpdate(index, "achievements", newAchievements);
              }}
              className="text-xs text-brand-blue hover:text-blue-300 flex items-center gap-1 bg-brand-blue/10 px-2 py-1 rounded transition-colors"
            >
              <Plus className="h-3 w-3"/> Add Bullet
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {proj.achievements.map((bullet: string, bIndex: number) => (
            <div key={bIndex} className="flex gap-3 items-start group/bullet">
              <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />
              <div className="flex-1 relative">
                <textarea 
                  className="w-full bg-black/50 border border-white/5 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors resize-none overflow-hidden" 
                  placeholder="What did you build or achieve?" 
                  value={bullet}
                  rows={2}
                  onChange={(e) => {
                    const newAchievements = [...proj.achievements];
                    newAchievements[bIndex] = e.target.value;
                    onUpdate(index, "achievements", newAchievements);
                  }} 
                />
                <button 
                  onClick={() => {
                    const newAchievements = proj.achievements.filter((_: string, i: number) => i !== bIndex);
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
