import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Education } from '../types';

interface EducationCardProps {
  edu: Education;
  index: number;
  onUpdate: (index: number, field: any, value: any) => void;
  onDelete: (index: number) => void;
}

export default function EducationCard({ edu, index, onUpdate, onDelete }: EducationCardProps) {
  return (
    <div className="bg-[#1a1a1a] p-5 rounded-xl border border-white/5 space-y-5 relative group transition-all hover:border-white/10 shadow-lg">
      <button 
        onClick={() => onDelete(index)}
        className="absolute top-5 right-5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Qualification Level Selection Tabs */}
      <div className="space-y-1.5 col-span-2">
        <label className="text-xs font-semibold text-gray-300">Qualification Level</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: "college", label: "College / Degree" },
            { id: "intermediate", label: "Class 12 / Inter" },
            { id: "diploma", label: "Diploma / Poly" },
            { id: "school", label: "Class 10 / High School" },
          ].map((level) => {
            const isSelected = (edu.qualificationLevel || "college") === level.id;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => {
                  onUpdate(index, "qualificationLevel", level.id);
                  if (level.id === "intermediate") {
                    if (!edu.degree) onUpdate(index, "degree", "Class XII / Senior Secondary");
                  } else if (level.id === "school") {
                    if (!edu.degree) onUpdate(index, "degree", "Class X / Secondary School");
                  } else if (level.id === "diploma") {
                    if (!edu.degree) onUpdate(index, "degree", "Diploma in Engineering");
                  }
                }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                  isSelected
                    ? "bg-brand-blue/20 border-brand-blue text-brand-blue shadow-sm"
                    : "bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                }`}
              >
                {level.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pr-8">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {edu.qualificationLevel === "school" || edu.qualificationLevel === "intermediate"
              ? "School / Junior College Name"
              : "University / Institute Name"}
          </label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder={
              edu.qualificationLevel === "school"
                ? "Narayana / Sri Chaitanya High School"
                : edu.qualificationLevel === "intermediate"
                ? "Sri Chaitanya Junior College"
                : "Stanford University / JNTU"
            } 
            value={edu.institute} 
            onChange={(e) => onUpdate(index, "institute", e.target.value)} 
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Board / University</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="CBSE / State Board / JNTUH" 
            value={edu.boardOrUniversity || ""} 
            onChange={(e) => onUpdate(index, "boardOrUniversity", e.target.value)} 
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Degree / Course Name</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="B.Tech / Class XII / Diploma" 
            value={edu.degree} 
            onChange={(e) => onUpdate(index, "degree", e.target.value)} 
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Branch / Group / Stream</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="CSE / MPC / BiPC / ECE" 
            value={edu.branch || ""} 
            onChange={(e) => onUpdate(index, "branch", e.target.value)} 
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">CGPA or Percentage Marks</label>
          <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
            placeholder="8.9 CGPA or 94.5%" 
            value={edu.cgpa || edu.percentage || ""} 
            onChange={(e) => {
              onUpdate(index, "cgpa", e.target.value);
              onUpdate(index, "percentage", e.target.value);
            }} 
          />
        </div>
        
        <div className="flex gap-4 col-span-2">
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
            <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
              placeholder="Aug 2019" 
              value={edu.startDate} 
              onChange={(e) => onUpdate(index, "startDate", e.target.value)} 
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">End Date (or Expected)</label>
            <input className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm focus:border-brand-blue outline-none transition-colors" 
              placeholder="May 2023" 
              value={edu.endDate} 
              onChange={(e) => onUpdate(index, "endDate", e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-white/5">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Relevant Coursework</label>
          <button 
            onClick={() => {
              const newCoursework = [...(edu.coursework || []), ""];
              onUpdate(index, "coursework", newCoursework);
            }}
            className="text-xs text-brand-blue hover:text-blue-300 flex items-center gap-1 bg-brand-blue/10 px-2 py-1 rounded transition-colors"
          >
            <Plus className="h-3 w-3"/> Add Course
          </button>
        </div>
        
        <div className="space-y-3">
          {(edu.coursework || []).map((course: string, cIndex: number) => (
            <div key={cIndex} className="flex gap-3 items-center group/bullet">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />
              <div className="flex-1 relative">
                <input 
                  className="w-full bg-black/50 border border-white/5 rounded-md px-3 py-1.5 text-sm focus:border-brand-blue outline-none transition-colors" 
                  placeholder="Data Structures, Algorithms..." 
                  value={course}
                  onChange={(e) => {
                    const newCoursework = [...(edu.coursework || [])];
                    newCoursework[cIndex] = e.target.value;
                    onUpdate(index, "coursework", newCoursework);
                  }} 
                />
                <button 
                  onClick={() => {
                    const newCoursework = (edu.coursework || []).filter((_: string, i: number) => i !== cIndex);
                    onUpdate(index, "coursework", newCoursework);
                  }}
                  className="absolute top-1.5 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover/bullet:opacity-100 transition-opacity bg-black rounded"
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
