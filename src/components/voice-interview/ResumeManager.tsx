"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FileText, Eye, Trash2, Download, RefreshCw, Calendar, HardDrive, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "./hooks";
import { ResumeUploadDialog } from "./ResumeUploadDialog";

type StoredResume = {
  filename: string;
  size: number;
  uploadedAt: string;
  path: string;
};

export function ResumeManager() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<StoredResume | null>(null);
  const [showReplace, setShowReplace] = useState(false);

  const isMounted = React.useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchResumeMetadata = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const res = await fetch("/api/voice-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-resume" }),
      });
      const data = await res.json();
      if (!isMounted.current) return;
      if (res.ok && data.resume) {
        setResume(data.resume);
      } else {
        setResume(null);
      }
    } catch (e) {
      if (!isMounted.current) return;
      console.error(e);
      addToast("Failed to fetch resume status", "error");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [addToast]);

  useEffect(() => {
    void fetchResumeMetadata();
  }, [fetchResumeMetadata]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your stored resume? Future mock interviews will require uploading a resume again.")) {
      return;
    }

    try {
      const res = await fetch("/api/voice-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-resume" }),
      });
      if (res.ok) {
        setResume(null);
        addToast("Resume deleted successfully", "success");
      } else {
        addToast("Failed to delete resume", "error");
      }
    } catch (e) {
      console.error(e);
      addToast("Failed to delete resume due to a connection issue", "error");
    }
  };

  const handleDownload = async () => {
    if (!resume) return;
    try {
      // Direct file fetch using signed URL helper or general route redirect
      const url = `https://mniuklnrgfcpusuijuyz.supabase.co/storage/v1/object/sign/resumes/${resume.path}?token=download`;
      window.open(url, "_blank");
    } catch (e) {
      addToast("Download failed", "error");
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-3xl border border-white/5 bg-zinc-950/20 flex justify-center items-center">
        <RefreshCw className="h-5 w-5 animate-spin text-cyan-400 mr-2" />
        <span className="text-xs font-bold">Checking resume status...</span>
      </div>
    );
  }

  if (showReplace) {
    return (
      <div className="p-6 rounded-3xl border border-white/10 bg-zinc-950/20">
        <ResumeUploadDialog
          onUploadSuccess={() => {
            void fetchResumeMetadata();
            setShowReplace(false);
          }}
          onCancel={() => setShowReplace(false)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/20 p-6 md:p-8 space-y-6">
      <div>
        <h3 className="text-lg font-bold">Resume Management</h3>
        <p className="text-xs text-foreground/50">Manage your synced resume file used to customize mock interview rounds.</p>
      </div>

      {resume ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold truncate max-w-[200px] sm:max-w-xs">{resume.filename}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-foreground/40 font-semibold">
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" /> {formatSize(resume.size)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Sync date: {formatDate(resume.uploadedAt)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Ready
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white py-2.5 text-xs font-bold transition-all"
            >
              <Download className="h-4 w-4" /> Download
            </button>
            
            <button
              onClick={() => setShowReplace(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white py-2.5 text-xs font-bold transition-all"
            >
              <RefreshCw className="h-4 w-4" /> Replace
            </button>
            
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 py-2.5 text-xs font-bold transition-all col-span-2 sm:col-span-2"
            >
              <Trash2 className="h-4 w-4" /> Delete Sync
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-white/15 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <FileText className="h-10 w-10 text-foreground/20" />
          <p className="text-xs text-foreground/50">No resume has been uploaded to your profile workspace yet.</p>
          <button
            onClick={() => setShowReplace(true)}
            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 text-xs font-extrabold transition-all"
          >
            Upload Resume
          </button>
        </div>
      )}
    </div>
  );
}
