import React from 'react';
import { Plus } from 'lucide-react';
import { ResumeData, Experience } from '../types';
import ExperienceCard from './ExperienceCard';
// We'd import ProjectCard, EducationCard here similarly

interface EditorProps {
  form: ResumeData;
  updateField: (field: keyof ResumeData, value: any) => void;
}

export default function ResumeEditor({ form, updateField }: EditorProps) {
  
  const handleUpdateExperience = (index: number, field: keyof Experience, value: any) => {
    const newExperiences = [...form.experiences];
    (newExperiences[index] as any)[field] = value;
    updateField('experiences', newExperiences);
  };

  const handleDeleteExperience = (index: number) => {
    const newExperiences = form.experiences.filter((_, i) => i !== index);
    updateField('experiences', newExperiences);
  };

  return (
    <section className="flex-1 bg-[#161616] overflow-y-auto p-8 print:hidden">
      <div className="max-w-2xl mx-auto space-y-12 pb-32">
        
        {/* Personal Info */}
        <div className="space-y-5">
          <h3 className="text-xl font-bold border-b border-white/10 pb-3">Personal Information</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                <input className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Target Role</label>
                <input className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" value={form.targetRole} onChange={(e) => updateField("targetRole", e.target.value)} />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <input className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                <input className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Location</label>
                <input className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" value={form.location} onChange={(e) => updateField("location", e.target.value)} />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">LinkedIn</label>
                <input className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Experience Section */}
        <div className="space-y-5">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-xl font-bold">Experience</h3>
            <button 
              onClick={() => updateField("experiences", [...form.experiences, { id: Date.now().toString(), company: "", role: "", location: "", employmentType: "fulltime", isRemote: false, startDate: "", endDate: "", current: false, techStack: "", achievements: [] }])}
              className="text-sm font-medium text-brand-blue hover:text-blue-300 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4"/> Add Experience
            </button>
          </div>
          
          <div className="space-y-6">
            {form.experiences.map((exp, index) => (
              <ExperienceCard 
                key={exp.id || index} 
                exp={exp} 
                index={index} 
                onUpdate={handleUpdateExperience} 
                onDelete={handleDeleteExperience} 
              />
            ))}
          </div>
        </div>

        {/* Note: I will port Project and Education cards similarly, focusing on Experience to prove architecture first */}
        <div className="text-center p-8 border border-dashed border-white/10 rounded-lg text-gray-500">
            Project and Education cards will dynamically mount here based on the EditorRegistry in Phase 3.5.
        </div>

      </div>
    </section>
  );
}
