"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Download, Loader2, Save, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import TemplateRenderer from "@/components/resume-builder/TemplateRenderer";
import { jakesResumeConfig } from "@/components/resume-builder/templates/JakesResume";
import { ResumeData, defaultResumeData, Experience, Project, Education } from "@/components/resume-builder/types";

export default function ResumeOSStudio({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<ResumeData>(defaultResumeData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isDark = true; // Hardcode dark mode for studio theme for now

  useEffect(() => {
    if (params.id !== "new") {
      readStoredForm();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, session]);

  const readStoredForm = async () => {
    if (!session?.user?.email) return;
    try {
      const { data, error } = await supabase
        .from("user_progress")
        .select("resume_data")
        .eq("email", session.user.email)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      
      if (data?.resume_data) {
        // Here we map the legacy flat data to our new structured format if needed,
        // or just load the new structured format if it exists.
        // For now, let's just cast it. In a real migration we'd parse legacy fields.
        const loadedData = data.resume_data as any;
        setForm({
          ...defaultResumeData,
          ...loadedData,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load resume");
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!session?.user?.email) return;
    setSaving(true);
    setError("");
    try {
      const { error } = await supabase
        .from("user_progress")
        .upsert({ 
          email: session.user.email, 
          resume_data: form 
        }, { onConflict: "email" });

      if (error) throw error;
      setTimeout(() => setSaving(false), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save draft");
      setSaving(false);
    }
  };

  const updateField = (field: keyof ResumeData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      {/* Studio Topbar */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black z-50 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/resume-builder" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold tracking-wide text-sm">Resume OS Studio</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveDraft} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-all">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-md bg-white text-black hover:bg-gray-200 transition-all">
            <Download className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </header>

      {/* Three Column Workspace */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Navigation & Settings */}
        <aside className="w-64 border-r border-white/10 bg-[#111] flex flex-col overflow-y-auto print:hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resume Settings</h2>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex justify-between">
                <span>Template</span>
                <span className="text-gray-400">Jake's</span>
              </button>
              <button className="w-full text-left px-3 py-2 rounded text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex justify-between">
                <span>Theme</span>
                <span className="text-gray-400">Classic</span>
              </button>
              <button className="w-full text-left px-3 py-2 rounded text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex justify-between">
                <span>Typography</span>
                <span className="text-gray-400">Garamond</span>
              </button>
            </div>
          </div>
          <div className="p-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sections (Drag to Reorder)</h2>
            <ul className="space-y-1">
              {['Personal Info', 'Summary', 'Education', 'Experience', 'Projects', 'Skills'].map((sec) => (
                <li key={sec} className="px-3 py-2 text-sm rounded hover:bg-white/5 cursor-grab active:cursor-grabbing text-gray-300">
                  ≡ {sec}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Center Column: Structured Editor */}
        <section className="flex-1 bg-[#161616] overflow-y-auto p-8 print:hidden">
          <div className="max-w-2xl mx-auto space-y-8 pb-32">
            
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" placeholder="Full Name" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} />
                <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" placeholder="Target Role" value={form.targetRole} onChange={(e) => updateField("targetRole", e.target.value)} />
                <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" placeholder="Email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" placeholder="Phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" placeholder="Location" value={form.location} onChange={(e) => updateField("location", e.target.value)} />
                <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" placeholder="LinkedIn URL" value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
                <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" placeholder="GitHub URL" value={form.github} onChange={(e) => updateField("github", e.target.value)} />
                <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm focus:border-brand-blue outline-none" placeholder="Portfolio URL" value={form.portfolio} onChange={(e) => updateField("portfolio", e.target.value)} />
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="text-lg font-semibold">Experience</h3>
                <button 
                  onClick={() => updateField("experiences", [...form.experiences, { id: Date.now().toString(), company: "", role: "", location: "", employmentType: "", isRemote: false, startDate: "", endDate: "", current: false, achievements: [] }])}
                  className="text-xs text-brand-blue hover:text-white flex items-center gap-1"
                >
                  <Plus className="h-3 w-3"/> Add Experience
                </button>
              </div>
              
              {form.experiences.map((exp, index) => (
                <div key={exp.id} className="bg-[#1a1a1a] p-4 rounded-lg border border-white/5 space-y-4 relative group">
                  <button 
                    onClick={() => updateField("experiences", form.experiences.filter(e => e.id !== exp.id))}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-4 pr-6">
                    <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm" placeholder="Company Name" value={exp.company} onChange={(e) => {
                      const newExp = [...form.experiences];
                      newExp[index].company = e.target.value;
                      updateField("experiences", newExp);
                    }} />
                    <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm" placeholder="Role / Title" value={exp.role} onChange={(e) => {
                      const newExp = [...form.experiences];
                      newExp[index].role = e.target.value;
                      updateField("experiences", newExp);
                    }} />
                    <div className="flex gap-2">
                      <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm w-full" placeholder="Start Date" value={exp.startDate} onChange={(e) => {
                        const newExp = [...form.experiences];
                        newExp[index].startDate = e.target.value;
                        updateField("experiences", newExp);
                      }} />
                      <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm w-full" placeholder="End Date" value={exp.endDate} onChange={(e) => {
                        const newExp = [...form.experiences];
                        newExp[index].endDate = e.target.value;
                        updateField("experiences", newExp);
                      }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-gray-400">Achievements (Bullets)</label>
                      <button 
                        onClick={() => {
                          const newExp = [...form.experiences];
                          newExp[index].achievements.push("");
                          updateField("experiences", newExp);
                        }}
                        className="text-xs text-brand-blue"
                      >
                        + Add Bullet
                      </button>
                    </div>
                    <div className="space-y-2">
                      {exp.achievements.map((bullet, bIndex) => (
                        <div key={bIndex} className="flex gap-2">
                          <input 
                            className="bg-black border border-white/10 rounded px-3 py-2 text-sm w-full" 
                            placeholder="Describe your impact..." 
                            value={bullet} 
                            onChange={(e) => {
                              const newExp = [...form.experiences];
                              newExp[index].achievements[bIndex] = e.target.value;
                              updateField("experiences", newExp);
                            }} 
                          />
                          <button 
                            onClick={() => {
                              const newExp = [...form.experiences];
                              newExp[index].achievements = newExp[index].achievements.filter((_, i) => i !== bIndex);
                              updateField("experiences", newExp);
                            }}
                            className="text-gray-500 hover:text-red-400 px-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Projects */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="text-lg font-semibold">Projects</h3>
                <button 
                  onClick={() => updateField("projects", [...form.projects, { id: Date.now().toString(), name: "", category: "", techStack: "", github: "", liveUrl: "", duration: "", role: "", description: "", achievements: [] }])}
                  className="text-xs text-brand-blue hover:text-white flex items-center gap-1"
                >
                  <Plus className="h-3 w-3"/> Add Project
                </button>
              </div>
              
              {form.projects.map((proj, index) => (
                <div key={proj.id} className="bg-[#1a1a1a] p-4 rounded-lg border border-white/5 space-y-4 relative group">
                  <button 
                    onClick={() => updateField("projects", form.projects.filter(p => p.id !== proj.id))}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-4 pr-6">
                    <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm" placeholder="Project Name" value={proj.name} onChange={(e) => {
                      const newP = [...form.projects];
                      newP[index].name = e.target.value;
                      updateField("projects", newP);
                    }} />
                    <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm" placeholder="Tech Stack" value={proj.techStack} onChange={(e) => {
                      const newP = [...form.projects];
                      newP[index].techStack = e.target.value;
                      updateField("projects", newP);
                    }} />
                    <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm" placeholder="Duration" value={proj.duration} onChange={(e) => {
                      const newP = [...form.projects];
                      newP[index].duration = e.target.value;
                      updateField("projects", newP);
                    }} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-gray-400">Achievements (Bullets)</label>
                      <button 
                        onClick={() => {
                          const newP = [...form.projects];
                          newP[index].achievements.push("");
                          updateField("projects", newP);
                        }}
                        className="text-xs text-brand-blue"
                      >
                        + Add Bullet
                      </button>
                    </div>
                    <div className="space-y-2">
                      {proj.achievements.map((bullet, bIndex) => (
                        <div key={bIndex} className="flex gap-2">
                          <input 
                            className="bg-black border border-white/10 rounded px-3 py-2 text-sm w-full" 
                            placeholder="What did you build?" 
                            value={bullet} 
                            onChange={(e) => {
                              const newP = [...form.projects];
                              newP[index].achievements[bIndex] = e.target.value;
                              updateField("projects", newP);
                            }} 
                          />
                          <button 
                            onClick={() => {
                              const newP = [...form.projects];
                              newP[index].achievements = newP[index].achievements.filter((_, i) => i !== bIndex);
                              updateField("projects", newP);
                            }}
                            className="text-gray-500 hover:text-red-400 px-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="text-lg font-semibold">Education</h3>
                <button 
                  onClick={() => updateField("education", [...form.education, { id: Date.now().toString(), institute: "", degree: "", cgpa: "", startDate: "", endDate: "", coursework: [], activities: "", achievements: "" }])}
                  className="text-xs text-brand-blue hover:text-white flex items-center gap-1"
                >
                  <Plus className="h-3 w-3"/> Add Education
                </button>
              </div>
              
              {form.education.map((edu, index) => (
                <div key={edu.id} className="bg-[#1a1a1a] p-4 rounded-lg border border-white/5 space-y-4 relative group">
                  <button 
                    onClick={() => updateField("education", form.education.filter(e => e.id !== edu.id))}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-4 pr-6">
                    <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm" placeholder="Institute Name" value={edu.institute} onChange={(e) => {
                      const newE = [...form.education];
                      newE[index].institute = e.target.value;
                      updateField("education", newE);
                    }} />
                    <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm" placeholder="Degree" value={edu.degree} onChange={(e) => {
                      const newE = [...form.education];
                      newE[index].degree = e.target.value;
                      updateField("education", newE);
                    }} />
                    <div className="flex gap-2">
                      <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm w-full" placeholder="Start Date" value={edu.startDate} onChange={(e) => {
                        const newE = [...form.education];
                        newE[index].startDate = e.target.value;
                        updateField("education", newE);
                      }} />
                      <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm w-full" placeholder="End Date" value={edu.endDate} onChange={(e) => {
                        const newE = [...form.education];
                        newE[index].endDate = e.target.value;
                        updateField("education", newE);
                      }} />
                    </div>
                    <input className="bg-black border border-white/10 rounded px-3 py-2 text-sm" placeholder="CGPA / Score" value={edu.cgpa} onChange={(e) => {
                      const newE = [...form.education];
                      newE[index].cgpa = e.target.value;
                      updateField("education", newE);
                    }} />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Right Column: Live A4 Preview */}
        <aside className="w-1/2 bg-[#0c0c0c] border-l border-white/10 p-8 overflow-y-auto print:block print:w-full print:p-0 print:border-none print:bg-white flex justify-center">
          <div 
            className="bg-white shadow-2xl print:shadow-none origin-top mx-auto"
            style={{
              width: '8.5in',
              minHeight: '11in',
              transform: 'scale(0.7)',
              transformOrigin: 'top center',
              marginBottom: '-3in' // Offset scale
            }}
          >
            <TemplateRenderer form={form} config={jakesResumeConfig} />
          </div>
        </aside>

      </main>
    </div>
  );
}
