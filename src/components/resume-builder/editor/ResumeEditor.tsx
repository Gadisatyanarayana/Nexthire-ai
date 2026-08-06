import React from 'react';
import { Plus } from 'lucide-react';
import { ResumeData } from '../types';
import ExperienceCard from './ExperienceCard';
import ProjectCard from './ProjectCard';
import EducationCard from './EducationCard';
import SkillsCard from './SkillsCard';

interface EditorProps {
  form: ResumeData;
  updateField: (field: keyof ResumeData, value: any) => void;
}

export default function ResumeEditor({ form, updateField }: EditorProps) {
  
  const handleUpdateArray = (arrayField: keyof ResumeData, index: number, field: any, value: any) => {
    const newArray = [...(form[arrayField] as any[])];
    newArray[index][field] = value;
    updateField(arrayField, newArray);
  };

  const handleDeleteArrayItem = (arrayField: keyof ResumeData, index: number) => {
    const newArray = (form[arrayField] as any[]).filter((_, i) => i !== index);
    updateField(arrayField, newArray);
  };

  const handleAddArrayItem = (arrayField: keyof ResumeData, defaultItem: any) => {
    updateField(arrayField, [...(form[arrayField] as any[]), defaultItem]);
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
            <div>
                <label className="text-xs text-gray-400 mb-1 block">GitHub</label>
                <input className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" value={form.github} onChange={(e) => updateField("github", e.target.value)} />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Portfolio</label>
                <input className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" value={form.portfolio} onChange={(e) => updateField("portfolio", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-5">
          <h3 className="text-xl font-bold border-b border-white/10 pb-3">Professional Summary</h3>
          <textarea 
            className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none h-32 resize-none" 
            placeholder="A brief summary of your background..."
            value={form.summary} 
            onChange={(e) => updateField("summary", e.target.value)} 
          />
        </div>

        {/* Experience Section */}
        <div className="space-y-5">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-xl font-bold">Experience</h3>
            <button 
              onClick={() => handleAddArrayItem("experiences", { id: Date.now().toString(), company: "", role: "", location: "", employmentType: "fulltime", isRemote: false, startDate: "", endDate: "", current: false, techStack: "", achievements: [] })}
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
                onUpdate={(i, f, v) => handleUpdateArray("experiences", i, f, v)} 
                onDelete={(i) => handleDeleteArrayItem("experiences", i)} 
              />
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-5">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-xl font-bold">Projects</h3>
            <button 
              onClick={() => handleAddArrayItem("projects", { id: Date.now().toString(), name: "", category: "", techStack: "", github: "", liveUrl: "", duration: "", role: "", description: "", achievements: [] })}
              className="text-sm font-medium text-brand-blue hover:text-blue-300 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4"/> Add Project
            </button>
          </div>
          
          <div className="space-y-6">
            {form.projects.map((proj, index) => (
              <ProjectCard 
                key={proj.id || index} 
                proj={proj} 
                index={index} 
                onUpdate={(i, f, v) => handleUpdateArray("projects", i, f, v)} 
                onDelete={(i) => handleDeleteArrayItem("projects", i)} 
              />
            ))}
          </div>
        </div>

        {/* Education Section */}
        <div className="space-y-5">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-xl font-bold">Education</h3>
            <button 
              onClick={() => handleAddArrayItem("education", { id: Date.now().toString(), institute: "", degree: "", branch: "", cgpa: "", startDate: "", endDate: "", coursework: [], activities: "", achievements: "" })}
              className="text-sm font-medium text-brand-blue hover:text-blue-300 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4"/> Add Education
            </button>
          </div>
          
          <div className="space-y-6">
            {form.education.map((edu, index) => (
              <EducationCard 
                key={edu.id || index} 
                edu={edu} 
                index={index} 
                onUpdate={(i, f, v) => handleUpdateArray("education", i, f, v)} 
                onDelete={(i) => handleDeleteArrayItem("education", i)} 
              />
            ))}
          </div>
        </div>

        {/* Skills Section */}
        <div className="space-y-5">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-xl font-bold">Skills</h3>
            <button 
              onClick={() => handleAddArrayItem("skills", { id: Date.now().toString(), name: "", skills: "" })}
              className="text-sm font-medium text-brand-blue hover:text-blue-300 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4"/> Add Category
            </button>
          </div>
          
          <div className="space-y-4">
            {form.skills.map((skill, index) => (
              <SkillsCard 
                key={skill.id || index} 
                skill={skill} 
                index={index} 
                onUpdate={(i, f, v) => handleUpdateArray("skills", i, f, v)} 
                onDelete={(i) => handleDeleteArrayItem("skills", i)} 
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
