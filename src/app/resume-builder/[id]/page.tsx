"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Download, Loader2, Save } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ResumeData, defaultResumeData } from "@/components/resume-builder/types";

import ResumeSidebar from "@/components/resume-builder/sidebar/ResumeSidebar";
import ResumeEditor from "@/components/resume-builder/editor/ResumeEditor";
import ResumePreview from "@/components/resume-builder/preview/ResumePreview";

export default function ResumeOSStudio({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [form, setForm] = useState<ResumeData>(defaultResumeData);
  const [loading, setLoading] = useState(true);
  
  // Autosave State
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState("");

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
        setForm({
          ...defaultResumeData,
          ...(data.resume_data as any),
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load resume");
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async (dataToSave: ResumeData = form) => {
    if (!session?.user?.email) return;
    setSaving(true);
    setError("");
    try {
      const { error } = await supabase
        .from("user_progress")
        .upsert({ 
          email: session.user.email, 
          resume_data: dataToSave 
        }, { onConflict: "email" });

      if (error) throw error;
      setLastSaved(new Date());
      setTimeout(() => setSaving(false), 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save draft");
      setSaving(false);
    }
  };

  // Debounced Autosave (saves 2 seconds after user stops typing)
  useEffect(() => {
    if (loading) return; // Don't autosave while initial load is happening
    const handler = setTimeout(() => {
      saveDraft(form);
    }, 2000);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const updateField = useCallback((field: keyof ResumeData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

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
          <h1 className="font-semibold tracking-wide text-sm">NextHire Resume OS</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            {error ? (
              <span className="text-red-400">{error}</span>
            ) : saving ? (
              <span className="flex items-center gap-1 text-gray-400"><Loader2 className="h-3 w-3 animate-spin"/> Saving...</span>
            ) : lastSaved ? (
              <span className="text-gray-500">Saved at {lastSaved.toLocaleTimeString()}</span>
            ) : null}
          </div>
          
          <button onClick={() => saveDraft()} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-all">
            <Save className="h-4 w-4" /> Save Now
          </button>
          
          <button onClick={handlePrint} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-md bg-white text-black hover:bg-gray-200 transition-all">
            <Download className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </header>

      {/* Three Column Modular Workspace */}
      <main className="flex-1 flex overflow-hidden">
        <ResumeSidebar form={form} updateField={updateField} />
        <ResumeEditor form={form} updateField={updateField} />
        <ResumePreview form={form} />
      </main>
    </div>
  );
}
