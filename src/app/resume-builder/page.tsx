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

    const fetchResumes = async () => {
      setLoading(true);
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();

      if (userRow?.id) {
        // Fetch saved resumes. For now, we still query 'submissions' with 'resume-builder'
        const { data } = await supabase
          .from("submissions")
          .select("id, created_at, code, language")
          .eq("user_id", userRow.id)
          .eq("language", "resume-builder")
          .order("created_at", { ascending: false });
        
        if (data) {
          setResumes(data);
        }
      }
      setLoading(false);
    };

    fetchResumes();
  }, [session, status, router]);

  const createNewResume = () => {
    const id = Date.now().toString();
    router.push(`/resume-builder/${id}`);
  };

  const getResumeName = (resume: any) => {
    try {
      const parsed = JSON.parse(String(resume.code));
      return parsed.targetRole ? `${parsed.targetRole} Resume` : "Untitled Resume";
    } catch {
      return "Untitled Resume";
    }
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
            <Glass key={resume.id} isDark={isDark} className="group p-6 flex flex-col h-full" onClick={() => router.push(`/resume-builder/${resume.id}`)}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${isDark ? "bg-white/10 text-white" : "bg-brand-blue/10 text-brand-blue"}`}>
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 ${isDark ? "text-gray-400" : "text-gray-600"}`} onClick={(e) => { e.stopPropagation(); /* TODO: duplicate */ }}>
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className={`p-1.5 rounded hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 ${isDark ? "text-gray-400" : "text-gray-600"}`} onClick={(e) => { e.stopPropagation(); /* TODO: delete */ }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
                {getResumeName(resume)}
              </h3>
              
              <div className="mt-auto space-y-3 pt-4 border-t border-gray-200/10">
                <div className={`flex items-center text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Updated {new Date(resume.created_at).toLocaleDateString()}
                </div>
                <div className={`flex items-center text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  <LayoutTemplate className="h-3.5 w-3.5 mr-1.5" />
                  Jake's Resume (ATS)
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
