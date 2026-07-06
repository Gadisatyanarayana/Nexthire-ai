"use client";

import React, { useState, useCallback } from "react";
import { Camera, Mic, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle } from "lucide-react";
import { useToast } from "./hooks";
import { PermissionRecoveryDialog } from "./PermissionRecoveryDialog";

type PermissionFlowProps = {
  onAllPermissionsGranted: (streams: { video: MediaStream; audio: MediaStream }) => void;
  onCancel?: () => void;
};

export function PermissionFlow({ onAllPermissionsGranted, onCancel }: PermissionFlowProps) {
  const { addToast } = useToast();
  const [requesting, setRequesting] = useState(false);
  const [cameraState, setCameraState] = useState<"idle" | "granted" | "denied" | "blocked">("idle");
  const [micState, setMicState] = useState<"idle" | "granted" | "denied" | "blocked">("idle");
  const [showRecovery, setShowRecovery] = useState(false);

  const requestPermissions = useCallback(async () => {
    setRequesting(true);
    setShowRecovery(false);
    
    let cameraStream: MediaStream | null = null;
    let micStream: MediaStream | null = null;

    // Try joint request first (standard browser behavior for unified prompts)
    try {
      addToast("Requesting camera and microphone access...", "info", 2000);
      const combinedStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      setCameraState("granted");
      setMicState("granted");
      addToast("Camera access granted", "success");
      addToast("Microphone access granted", "success");
      addToast("All permissions granted", "success");
      
      // Split stream tracks
      const videoTracks = combinedStream.getVideoTracks();
      const audioTracks = combinedStream.getAudioTracks();
      
      cameraStream = new MediaStream(videoTracks);
      micStream = new MediaStream(audioTracks);

      setRequesting(false);
      onAllPermissionsGranted({ video: cameraStream, audio: micStream });
      return;
    } catch (combinedErr: any) {
      console.warn("Combined permission request failed, fallback to separate requests...", combinedErr);
      
      // Fallback to checking individually to isolate which hardware failed
      // 1. Camera check
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraState("granted");
        addToast("Camera access granted", "success");
      } catch (err: any) {
        console.warn("Camera permission failed:", err);
        const isBlocked = err.name === "NotAllowedError" || err.name === "PermissionDeniedError";
        setCameraState(isBlocked ? "blocked" : "denied");
        addToast(isBlocked ? "Camera blocked in browser settings" : "Camera permission denied", "error");
      }

      // 2. Microphone check
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicState("granted");
        addToast("Microphone access granted", "success");
      } catch (err: any) {
        console.warn("Microphone permission failed:", err);
        const isBlocked = err.name === "NotAllowedError" || err.name === "PermissionDeniedError";
        setMicState(isBlocked ? "blocked" : "denied");
        addToast(isBlocked ? "Microphone blocked in browser settings" : "Microphone permission denied", "error");
      }

      setRequesting(false);

      if (cameraStream && micStream) {
        addToast("All permissions granted", "success");
        onAllPermissionsGranted({ video: cameraStream, audio: micStream });
      } else {
        // Cleanup successful streams if the other failed
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
        }
        if (micStream) {
          micStream.getTracks().forEach((track) => track.stop());
        }
        setShowRecovery(true);
      }
    }
  }, [addToast, onAllPermissionsGranted]);

  return (
    <div className="w-full max-w-lg mx-auto p-6 md:p-8 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl animate-scale-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight mb-2">Hardware Configuration</h2>
        <p className="text-xs text-foreground/60 leading-relaxed max-w-sm mx-auto">
          AI placement evaluation requires active media permissions to analyze responses and verify authenticity.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {/* Camera Status Card */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${cameraState === "granted" ? "bg-emerald-500/10 text-emerald-400" : cameraState === "blocked" || cameraState === "denied" ? "bg-red-500/10 text-red-400" : "bg-white/5 text-foreground/60"}`}>
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold">Webcam Device</div>
              <div className="text-[10px] text-foreground/50">Required for presence and identity audits</div>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${cameraState === "granted" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : cameraState === "blocked" || cameraState === "denied" ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-white/5 bg-transparent text-foreground/40"}`}>
            {cameraState === "granted" ? "Active" : cameraState === "blocked" ? "Blocked" : cameraState === "denied" ? "Denied" : "Idle"}
          </span>
        </div>

        {/* Mic Status Card */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${micState === "granted" ? "bg-emerald-500/10 text-emerald-400" : micState === "blocked" || micState === "denied" ? "bg-red-500/10 text-red-400" : "bg-white/5 text-foreground/60"}`}>
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold">Microphone Input</div>
              <div className="text-[10px] text-foreground/50">Required for vocal responses and STT logic</div>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${micState === "granted" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : micState === "blocked" || micState === "denied" ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-white/5 bg-transparent text-foreground/40"}`}>
            {micState === "granted" ? "Active" : micState === "blocked" ? "Blocked" : micState === "denied" ? "Denied" : "Idle"}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={requesting}
            className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl py-3.5 text-xs font-extrabold transition-all"
          >
            Cancel
          </button>
        )}
        <button
          onClick={requestPermissions}
          disabled={requesting}
          className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black rounded-2xl py-3.5 text-xs font-extrabold transition-all flex items-center justify-center gap-2"
        >
          {requesting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Verifying Devices...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              <span>Grant Permissions</span>
            </>
          )}
        </button>
      </div>

      {showRecovery && (
        <PermissionRecoveryDialog
          cameraBlocked={cameraState === "blocked" || cameraState === "denied"}
          micBlocked={micState === "blocked" || micState === "denied"}
          onRetry={requestPermissions}
          onClose={() => setShowRecovery(false)}
        />
      )}
    </div>
  );
}
