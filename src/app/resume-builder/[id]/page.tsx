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
import Toolbar from "@/components/resume-builder/shared/Toolbar";

export default function ResumeOSStudio({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [form, setForm] = useState<ResumeData>(defaultResumeData);
  const [loading, setLoading] = useState(true);
  
  // Autosave State
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState("");
  
  // View State
  const [zoom, setZoom] = useState(0.85);

  useEffect(() => {
    if (params.id !== "new") {
      readStoredForm();
    } else {
      setLoading(false);
    }
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
        const rootData = data.resume_data as any;
        
        // Backward compatibility: If it's a flat resume, upgrade it
        let targetResume = null;
        if (rootData.experiences && !rootData.resumes) {
          targetResume = rootData; 
        } else if (rootData.resumes && rootData.resumes[params.id]) {
          targetResume = rootData.resumes[params.id];
        }

        if (targetResume) {
          setForm({
            ...defaultResumeData,
            ...targetResume,
            id: params.id // enforce id
          });
        }
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
      // Fetch existing first to not overwrite other resumes
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
          [params.id]: { ...dataToSave, id: params.id }
        }
      };

      // If they had legacy data, clear it from root so it's clean
      if (newRootData.experiences && !newRootData.resumes?.["legacy"]) {
        delete newRootData.experiences; // cleaning up legacy root keys if needed, but safer to leave alone
      }

      const { error } = await supabase
        .from("user_progress")
        .upsert({ 
          email: session.user.email, 
          resume_data: newRootData 
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
    <div className="h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden relative selection:bg-brand-blue/30 selection:text-brand-blue">
      {/* Premium Ambient Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-blue/10 blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none opacity-50" />
      
      {/* Universal Enterprise Toolbar */}
      <Toolbar 
        form={form}
        saving={saving} 
        lastSaved={lastSaved} 
        error={error} 
        onSave={() => saveDraft()} 
        onPrint={handlePrint}
        onZoomIn={() => setZoom(z => Math.min(z + 0.1, 2.0))}
        onZoomOut={() => setZoom(z => Math.max(z - 0.1, 0.5))}
      />

      {/* Three Column Modular Workspace */}
      <main className="flex-1 flex overflow-hidden">
        <ResumeSidebar form={form} updateField={updateField} />
        <ResumeEditor form={form} updateField={updateField} />
        <ResumePreview form={form} zoom={zoom} />
      </main>
    </div>
  );
}
