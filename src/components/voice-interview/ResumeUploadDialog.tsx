"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, X, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "./hooks";

type ResumeUploadDialogProps = {
  onUploadSuccess: (path: string, filename: string, size: number, skills: string[]) => void;
  onCancel?: () => void;
};

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc"];

export function ResumeUploadDialog({ onUploadSuccess, onCancel }: ResumeUploadDialogProps) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File): boolean => {
    // 1. Extension check
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      addToast("Unsupported format. Use PDF, DOC, or DOCX", "error");
      return false;
    }

    // 2. Size check
    if (file.size > MAX_SIZE_BYTES) {
      addToast(`File too large. Maximum size is ${MAX_SIZE_MB}MB`, "error");
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(15);
    
    try {
      // Simulate progress increments for UI/UX smoothness
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(interval);
            return 85;
          }
          return prev + 10;
        });
      }, 100);

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
      });

      // API request to upload
      const res = await fetch("/api/voice-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload-resume",
          file: base64,
          filename: file.name,
          size: file.size,
        }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (res.ok && data.success) {
        setProgress(100);
        setTimeout(() => {
          onUploadSuccess(data.resumePath, file.name, file.size, data.skills || []);
        }, 300);
      } else {
        if (data.duplicate) {
          addToast("Duplicate resume file detected in your account", "warning");
        } else {
          addToast(data.error || "Failed to upload resume", "error");
        }
        setUploading(false);
        setProgress(0);
      }
    } catch (err) {
      console.error("Resume upload error:", err);
      addToast("Failed to upload resume. Connection error.", "error");
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        void uploadFile(file);
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        void uploadFile(file);
      }
    }
  };

  return (
    <div className="w-full text-center space-y-4">
      <div>
        <h3 className="text-lg font-bold">Personalize Interview</h3>
        <p className="text-xs text-foreground/50 max-w-xs mx-auto leading-relaxed">
          Upload your resume to align the evaluation workspace with your specific tech stack.
        </p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-3 relative overflow-hidden ${
          dragActive
            ? "border-cyan-500 bg-cyan-500/5"
            : "border-white/10 hover:border-cyan-500/50 bg-white/5"
        } ${uploading ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="w-full flex flex-col items-center space-y-3 py-4">
            <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-[10px] font-bold text-foreground/60 mb-1.5">
                <span>Analyzing document...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 rounded-full transition-all duration-150" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground/80 block mb-0.5">
                Drag & drop file here
              </span>
              <span className="text-[10px] text-foreground/40 block">
                or click to browse your local device
              </span>
            </div>
            <div className="text-[10px] text-foreground/35 border-t border-white/5 pt-2.5 w-full">
              Supports PDF, DOC, DOCX up to {MAX_SIZE_MB}MB
            </div>
          </>
        )}
      </div>

      {!uploading && onCancel && (
        <button
          onClick={onCancel}
          className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl py-3 text-xs font-extrabold transition-all"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
