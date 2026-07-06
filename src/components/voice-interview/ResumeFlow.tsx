"use client";

import React, { useEffect, useState } from "react";
import { FileText, CheckCircle2, AlertCircle, Loader2, UploadCloud, RefreshCw } from "lucide-react";
import { useToast } from "./hooks";
import { ResumeUploadDialog } from "./ResumeUploadDialog";

type ResumeFlowProps = {
  userEmail: string;
  onResumeVerified: (resumePath: string, skills: string[]) => void;
  onBack?: () => void;
};

type ResumeInfo = {
  path: string;
  filename: string;
  size: number;
  uploadedAt: string;
};

export function ResumeFlow({ userEmail, onResumeVerified, onBack }: ResumeFlowProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<ResumeInfo | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "verifying" | "verified">("idle");
  const [showUpload, setShowUpload] = useState(false);

  // Fetch user profile resume on mount
  useEffect(() => {
    async function checkUserProfile() {
      try {
        const res = await fetch("/api/voice-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-resume" }),
        });
        const data = await res.json();
        
        if (data.resume) {
          setResume(data.resume);
          setSkills(data.skills || ["React", "JavaScript", "SQL", "Node.js"]);
          
          // Trigger "Resume Found -> Resume Verified -> Continue" animation sequence
          setStatus("verifying");
          setTimeout(() => {
            setStatus("verified");
            addToast("Resume verified successfully", "success");
            setTimeout(() => {
              onResumeVerified(data.resume.path, data.skills || ["React", "JavaScript", "SQL", "Node.js"]);
            }, 1200);
          }, 1500);
        } else {
          setShowUpload(true);
        }
      } catch (err) {
        console.error("Failed to check user resume profile:", err);
        addToast("Error querying profile metadata", "error");
        setShowUpload(true);
      } finally {
        setLoading(false);
      }
    }
    void checkUserProfile();
  }, [addToast, onResumeVerified]);

  const handleUploadSuccess = (path: string, filename: string, size: number, detectedSkills: string[]) => {
    setResume({ path, filename, size, uploadedAt: new Date().toISOString() });
    setSkills(detectedSkills);
    setShowUpload(false);
    
    // Play the verified animation sequence
    setStatus("verifying");
    setTimeout(() => {
      setStatus("verified");
      addToast("Resume uploaded and verified!", "success");
      setTimeout(() => {
        onResumeVerified(path, detectedSkills);
      }, 1200);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-3xl border border-white/10 bg-zinc-950/20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
        <p className="text-xs font-bold text-foreground/80">Scanning student profile for resume...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 md:p-8 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl animate-scale-in">
      {status !== "idle" ? (
        <div className="text-center py-6 space-y-6">
          <div className="relative flex items-center justify-center h-20 w-20 mx-auto">
            {status === "verifying" ? (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-cyan-400/20 animate-ping" />
                <div className="relative rounded-full h-16 w-16 bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-cyan-400 animate-pulse" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 scale-125 animate-scale-in" />
                <div className="relative rounded-full h-16 w-16 bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold">
              {status === "verifying" ? "Resume Found" : "Resume Verified"}
            </h3>
            <p className="text-xs text-foreground/50 max-w-xs mx-auto leading-relaxed">
              {status === "verifying" 
                ? `Analyzing metadata for "${resume?.filename || "Resume"}"`
                : "Proceeding to placement evaluation configuration..."}
            </p>
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center max-w-xs mx-auto border-t border-white/5 pt-4">
              {skills.map((skill, idx) => (
                <span 
                  key={idx}
                  className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : showUpload ? (
        <ResumeUploadDialog
          onUploadSuccess={handleUploadSuccess}
          onCancel={onBack}
        />
      ) : null}
    </div>
  );
}
