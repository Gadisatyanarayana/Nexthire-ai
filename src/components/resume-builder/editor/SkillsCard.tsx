import React from 'react';
import { Trash2 } from 'lucide-react';
import { SkillCategory } from '../types';

interface SkillsCardProps {
  skill: SkillCategory;
  index: number;
  onUpdate: (index: number, field: any, value: any) => void;
  onDelete: (index: number) => void;
}

export default function SkillsCard({ skill, index, onUpdate, onDelete }: SkillsCardProps) {
  return (
    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 relative group transition-all hover:border-white/10 shadow-lg flex items-start gap-4">
      <div className="w-1/3">
        <input 
          className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
          placeholder="Category (e.g. Languages)" 
          value={skill.name} 
          onChange={(e) => onUpdate(index, "name", e.target.value)} 
        />
      </div>
      <div className="flex-1 relative">
        <input 
          className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors pr-10" 
          placeholder="Java, Python, C++..." 
          value={skill.skills} 
          onChange={(e) => onUpdate(index, "skills", e.target.value)} 
        />
        <button 
          onClick={() => onDelete(index)}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
