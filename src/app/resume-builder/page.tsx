"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FileText, Plus, Clock, Copy, Trash2, LayoutTemplate } from "lucide-react";
import { supabase } from "@/lib/supabase";

function Glass({ children, isDark, className, onClick }: { children: React.ReactNode; isDark: boolean; className?: string, onClick?: () => void }) {
  return (
    <section
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 ${onClick ? "cursor-pointer" : ""} ${
        isDark 
          ? "bg-white/[0.03] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/[0.05]" 
          : "bg-white/70 border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90"
      } ${className ?? ""}`}
    >
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${isDark ? 'from-transparent via-white/20 to-transparent' : 'from-transparent via-white/80 to-transparent'}`} />
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}

export default function ResumeDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    
    if (status !== "authenticated" || !session?.user?.email) return;

    fetchResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router]);

  const fetchResumes = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    
    const { data: userProgress } = await supabase
      .from("user_progress")
      .select("resume_data")
      .eq("email", session.user.email)
      .maybeSingle();
      
    if (userProgress?.resume_data) {
      const rootData = userProgress.resume_data as any;
      const resumesList = [];
      
      if (rootData.resumes) {
        // Map the resumes dictionary into an array
        for (const [id, resume] of Object.entries(rootData.resumes)) {
          resumesList.push(resume);
        }
      } else if (rootData.experiences) {
        // Legacy flat resume
        resumesList.push({ ...rootData, id: "legacy-1" });
      }
      
      // Sort by newest first (descending id)
      resumesList.sort((a, b) => Number(b.id) - Number(a.id));
      setResumes(resumesList);
    }
    
    setLoading(false);
  };

  const createNewResume = () => {
    const id = Date.now().toString();
    router.push(`/resume-builder/${id}`);
  };
  
  const duplicateResume = async (resume: any) => {
    if (!session?.user?.email) return;
    const newId = Date.now().toString();
    const newResume = { ...resume, id: newId, targetRole: (resume.targetRole ? `${resume.targetRole} (Copy)` : 'Copy') };
    
    const { data: existing } = await supabase
      .from("user_progress")
      .select("resume_data")
      .eq("email", session.user.email)
      .single();

    const existingData = existing?.resume_data || {};
    const newRootData = {
      ...existingData,
      resumes: {
        ...(existingData.resumes || {}),
        [newId]: newResume
      }
    };
    
    await supabase.from("user_progress").upsert({ email: session.user.email, resume_data: newRootData }, { onConflict: "email" });
    fetchResumes();
  };

  const deleteResume = async (resumeId: string) => {
    if (!session?.user?.email) return;
    
    const { data: existing } = await supabase
      .from("user_progress")
      .select("resume_data")
      .eq("email", session.user.email)
      .single();

    const existingData = existing?.resume_data || {};
    if (existingData.resumes && existingData.resumes[resumeId]) {
      delete existingData.resumes[resumeId];
      await supabase.from("user_progress").upsert({ email: session.user.email, resume_data: existingData }, { onConflict: "email" });
      fetchResumes();
    }
  };

  const getResumeName = (resume: any) => {
    return resume.targetRole ? `${resume.targetRole} Resume` : "Untitled Resume";
  };

  if (loading) {
    return (
      <main className={`min-h-screen px-4 py-12 ${isDark ? "bg-black" : "bg-slate-50"} flex items-center justify-center`}>
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-brand-blue rounded-full"></div>
          <div className="h-3 w-3 bg-brand-blue rounded-full animation-delay-200"></div>
          <div className="h-3 w-3 bg-brand-blue rounded-full animation-delay-400"></div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen px-4 pb-12 pt-6 md:px-8 md:pt-10 ${isDark ? "bg-black" : "bg-slate-50"}`}>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-black"}`}>My Resumes</h1>
            <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Manage your ATS-friendly resumes for different job applications.</p>
          </div>
          <button
            onClick={createNewResume}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-lg transition-transform hover:scale-105 ${
              isDark ? "bg-white text-black" : "bg-black text-white"
            }`}
          >
            <Plus className="h-5 w-5" />
            Create New Resume
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <Glass key={resume.id} isDark={isDark} className="group p-0 flex flex-col h-full" onClick={() => router.push(`/resume-builder/${resume.id}`)}>
              <div className="relative">
                <div className="absolute right-4 top-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); duplicateResume(resume); }} 
                    className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                      isDark ? "bg-black/50 text-white hover:bg-black/70" : "bg-white/80 text-black hover:bg-white"
                    }`}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteResume(resume.id); }} 
                    className="p-2 rounded-full backdrop-blur-md bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex h-32 w-full items-center justify-center border-b border-dashed border-gray-500/30">
                  <LayoutTemplate className={`h-12 w-12 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                </div>
                
                <div className="p-4">
                  <h3 className={`font-semibold line-clamp-1 ${isDark ? "text-white" : "text-black"}`}>
                    {getResumeName(resume)}
                  </h3>
                  <p className={`mt-1 text-xs flex items-center gap-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <Clock className="h-3 w-3" />
                    Updated {new Date(resume.created_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Glass>
          ))}
          
          {resumes.length === 0 && (
            <Glass isDark={isDark} className="p-8 flex flex-col items-center justify-center text-center col-span-full border-dashed border-2">
              <FileText className={`h-12 w-12 mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
              <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>No Resumes Yet</h3>
              <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Create your first ATS-friendly resume to get started.</p>
              <button
                onClick={createNewResume}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition-transform hover:scale-105 ${
                  isDark ? "bg-white text-black" : "bg-brand-blue text-white"
                }`}
              >
                <Plus className="h-4 w-4" />
                Build My Resume
              </button>
            </Glass>
          )}
        </div>
      </div>
    </main>
  );
}
