"use client";

import React, { useState, useCallback } from "react";
import { Camera, Mic, RefreshCw, ShieldCheck } from "lucide-react";
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
    console.log("----------------------------------------");
    console.log("getUserMedia started");

    // 1. Log Permissions API status
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const cam = await navigator.permissions.query({ name: "camera" as any });
        console.log(`Permission API status: camera = ${cam.state}`);
      } catch (e) {
        console.log("Permission API status: camera = unsupported/error querying");
      }

      try {
        const mic = await navigator.permissions.query({ name: "microphone" as any });
        console.log(`Permission API status: microphone = ${mic.state}`);
      } catch (e) {
        console.log("Permission API status: microphone = unsupported/error querying");
      }
    } else {
      console.log("Permission API status: Permissions API not supported by browser");
    }

    let cameraStream: MediaStream | null = null;
    let micStream: MediaStream | null = null;

    // Try joint request first (standard browser behavior for unified prompts)
    try {
      addToast("Requesting camera and microphone access...", "info", 2000);
      const combinedStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      console.log("getUserMedia success");
      console.log("Stream received:", combinedStream.id);
      
      const videoTracks = combinedStream.getVideoTracks();
      const audioTracks = combinedStream.getAudioTracks();
      console.log(`Video tracks: ${videoTracks.length} tracks found`);
      videoTracks.forEach(t => console.log(`- ${t.label} (state: ${t.readyState}, enabled: ${t.enabled})`));
      console.log(`Audio tracks: ${audioTracks.length} tracks found`);
      audioTracks.forEach(t => console.log(`- ${t.label} (state: ${t.readyState}, enabled: ${t.enabled})`));
      
      setCameraState("granted");
      setMicState("granted");
      addToast("Camera and microphone access granted", "success");
      addToast("All permissions granted", "success");
      
      // Split stream tracks into separate MediaStreams
      cameraStream = new MediaStream(videoTracks);
      micStream = new MediaStream(audioTracks);

      setRequesting(false);
      onAllPermissionsGranted({ video: cameraStream, audio: micStream });
      return;
    } catch (combinedErr: any) {
      console.warn("Combined permission request failed, fallback to separate isolated checks:", combinedErr);
      console.log("Recovery dialog reason: check failed, analyzing hardware components separately...");

      let camPassed = false;
      let micPassed = false;

      // Fallback: Check Camera in isolation
      try {
        console.log("Fallback: Requesting camera only...");
        const camTest = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("Camera test success");
        setCameraState("granted");
        camPassed = true;
        
        // Stop the tracks immediately to release hardware locks
        camTest.getTracks().forEach((t) => {
          t.stop();
          console.log(`Stopped camera track: ${t.label}`);
        });
      } catch (err: any) {
        console.error("Camera individual test failed:", err);
        const name = err.name || "";
        console.log(`Recovery dialog reason: camera error name = ${name}`);
        
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          console.log("Recovery dialog reason: Device unavailable");
        } else if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          console.log("Recovery dialog reason: Permission denied / Permission blocked");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          console.log("Recovery dialog reason: NotReadableError (device locked by another app)");
        } else if (name === "AbortError") {
          console.log("Recovery dialog reason: AbortError");
        }
        
        const isBlocked = name === "NotAllowedError" || name === "PermissionDeniedError";
        setCameraState(isBlocked ? "blocked" : "denied");
        addToast(isBlocked ? "Camera blocked in settings" : "Camera permission denied", "error");
      }

      // Fallback: Check Microphone in isolation
      try {
        console.log("Fallback: Requesting microphone only...");
        const micTest = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Microphone test success");
        setMicState("granted");
        micPassed = true;
        
        // Stop the tracks immediately to release hardware locks
        micTest.getTracks().forEach((t) => {
          t.stop();
          console.log(`Stopped microphone track: ${t.label}`);
        });
      } catch (err: any) {
        console.error("Microphone individual test failed:", err);
        const name = err.name || "";
        console.log(`Recovery dialog reason: microphone error name = ${name}`);
        
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          console.log("Recovery dialog reason: Device unavailable");
        } else if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          console.log("Recovery dialog reason: Permission denied / Permission blocked");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          console.log("Recovery dialog reason: NotReadableError (device locked by another app)");
        } else if (name === "AbortError") {
          console.log("Recovery dialog reason: AbortError");
        }
        
        const isBlocked = name === "NotAllowedError" || name === "PermissionDeniedError";
        setMicState(isBlocked ? "blocked" : "denied");
        addToast(isBlocked ? "Microphone blocked in settings" : "Microphone permission denied", "error");
      }

      setRequesting(false);

      if (camPassed && micPassed) {
        console.log("Both devices passed verification in isolation. Re-triggering combined stream...");
        try {
          const finalStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          const videoTracks = finalStream.getVideoTracks();
          const audioTracks = finalStream.getAudioTracks();
          
          cameraStream = new MediaStream(videoTracks);
          micStream = new MediaStream(audioTracks);
          
          addToast("All permissions granted", "success");
          onAllPermissionsGranted({ video: cameraStream, audio: micStream });
        } catch (e: any) {
          console.error("Failed final combined re-acquisition:", e);
          setShowRecovery(true);
        }
      } else {
        console.log("One or both devices failed permissions check. Opening recovery dialog.");
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
