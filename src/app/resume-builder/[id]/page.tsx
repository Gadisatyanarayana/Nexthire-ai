"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Download, Loader2, Save } from "lucide-react";
import { useEffect, useState, useCallback, use } from "react";
import { supabase } from "@/lib/supabase";
import { ResumeData, defaultResumeData } from "@/components/resume-builder/types";

import ResumeSidebar from "@/components/resume-builder/sidebar/ResumeSidebar";
import ResumeEditor from "@/components/resume-builder/editor/ResumeEditor";
import ResumePreview from "@/components/resume-builder/preview/ResumePreview";
import Toolbar from "@/components/resume-builder/shared/Toolbar";

export default function ResumeOSStudio({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
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
    if (id !== "new") {
      readStoredForm();
    } else {
      setLoading(false);
    }
  }, [id, session]);

  const readStoredForm = async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch("/api/resume-builder/progress");
      if (!res.ok) throw new Error("Failed to fetch progress");
      
      const { resume_data, error } = await res.json();
      
      if (error) throw new Error(error);
      
      if (resume_data) {
        const rootData = resume_data as any;
        
        let targetResume = null;
        if (rootData.experiences && !rootData.resumes) {
          targetResume = rootData; 
        } else if (rootData.resumes && rootData.resumes[id]) {
          targetResume = rootData.resumes[id];
        }

        if (targetResume) {
          setForm({
            ...defaultResumeData,
            ...targetResume,
            id: id // enforce id
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
      const res = await fetch("/api/resume-builder/progress");
      const { resume_data: existing } = await res.json();

      const existingData = existing || {};
      const newRootData = {
        ...existingData,
        resumes: {
          ...(existingData.resumes || {}),
          [id]: { ...dataToSave, id: id }
        }
      };

      // If they had legacy data, clear it from root so it's clean
      if (newRootData.experiences && !newRootData.resumes?.["legacy"]) {
        delete newRootData.experiences; // cleaning up legacy root keys if needed, but safer to leave alone
      }

      const saveRes = await fetch("/api/resume-builder/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_data: newRootData }),
      });
      
      const saveResult = await saveRes.json();
      if (saveResult.error) throw new Error(saveResult.error);

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
    <div className="dark h-screen flex flex-col font-sans overflow-hidden selection:bg-brand-blue/30 selection:text-brand-blue bg-[var(--studio-background)] text-[var(--studio-text)] transition-colors duration-300">
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
