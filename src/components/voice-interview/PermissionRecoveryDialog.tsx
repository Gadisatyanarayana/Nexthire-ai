"use client";

import React from "react";
import { Camera, Mic, RefreshCw, X, ShieldAlert, CheckSquare } from "lucide-react";

type PermissionRecoveryProps = {
  cameraBlocked: boolean;
  micBlocked: boolean;
  onRetry: () => void;
  onClose: () => void;
};

export function PermissionRecoveryDialog({ cameraBlocked, micBlocked, onRetry, onClose }: PermissionRecoveryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-zinc-950 p-6 md:p-8 shadow-2xl relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground/40 hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-red-400">
          <ShieldAlert className="h-6 w-6" />
          <h3 className="text-lg font-bold text-red-200">Device Settings Interrupted</h3>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-foreground/80 mb-6">
          <p>
            The placement mock session cannot start because browser access to your hardware devices was blocked or denied.
          </p>

          {cameraBlocked && (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
                <Camera className="h-3.5 w-3.5" /> Why Camera is Required:
              </h4>
              <p className="text-[11px] text-foreground/60 leading-normal">
                Webcam capture enables video authentication and visual cheat-detection patterns matching corporate requirements.
              </p>
            </div>
          )}

          {micBlocked && (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
                <Mic className="h-3.5 w-3.5" /> Why Microphone is Required:
              </h4>
              <p className="text-[11px] text-foreground/60 leading-normal">
                Mock recruitment is voice-driven. Your vocal feed is processed using AI speech engines for real-time dialogue structure analysis.
              </p>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
              <CheckSquare className="h-3.5 w-3.5" /> How to Enable Access:
            </h4>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-foreground/60">
              <li>Click the site lock/settings icon in the browser address bar (left of the URL).</li>
              <li>Toggle <strong>Camera</strong> and <strong>Microphone</strong> permissions to "Allow".</li>
              <li>Refresh the page to reset hardware devices.</li>
            </ol>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRetry}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black py-3.5 text-xs font-extrabold transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Permission Request</span>
          </button>
          
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                // chrome://settings/content fallback alert
                alert("Please type 'chrome://settings/content' in a new tab to manage your browser permissions.");
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white py-3.5 text-xs font-extrabold transition-all"
          >
            <span>Open Browser Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
