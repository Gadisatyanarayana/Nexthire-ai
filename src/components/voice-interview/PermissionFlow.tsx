"use client";

import React, { useState, useCallback, useEffect } from "react";
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
    
    // 1. Log current browser permission state if available
    let currentCameraPermission = "unknown";
    let currentMicPermission = "unknown";
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const cam = await navigator.permissions.query({ name: "camera" as any });
        currentCameraPermission = cam.state;
        console.log(`Current browser permission state: camera = ${cam.state}`);
      } catch (e) {
        console.log("Current browser permission state: camera = not queryable");
      }

      try {
        const mic = await navigator.permissions.query({ name: "microphone" as any });
        currentMicPermission = mic.state;
        console.log(`Current browser permission state: microphone = ${mic.state}`);
      } catch (e) {
        console.log("Current browser permission state: microphone = not queryable");
      }
    } else {
      console.log("Current browser permission state: Permissions API not supported");
    }

    console.log("getUserMedia() called: requesting combined video and audio streams");

    let cameraStream: MediaStream | null = null;
    let micStream: MediaStream | null = null;

    // Try joint request first (standard browser behavior for unified prompts)
    try {
      addToast("Requesting camera and microphone access...", "info", 2000);
      const combinedStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      console.log("getUserMedia() succeeded: combined stream received");
      console.log("Stream received ID:", combinedStream.id);
      
      const videoTracks = combinedStream.getVideoTracks();
      const audioTracks = combinedStream.getAudioTracks();
      console.log(`Video tracks count: ${videoTracks.length}`);
      videoTracks.forEach(t => console.log(`- Track: ${t.label} (state: ${t.readyState}, enabled: ${t.enabled})`));
      console.log(`Audio tracks count: ${audioTracks.length}`);
      audioTracks.forEach(t => console.log(`- Track: ${t.label} (state: ${t.readyState}, enabled: ${t.enabled})`));
      
      setCameraState("granted");
      setMicState("granted");
      addToast("Camera and microphone access granted", "success");
      addToast("All permissions granted", "success");
      
      cameraStream = new MediaStream(videoTracks);
      micStream = new MediaStream(audioTracks);

      setRequesting(false);
      onAllPermissionsGranted({ video: cameraStream, audio: micStream });
      return;
    } catch (combinedErr: any) {
      const errName = combinedErr.name || "UnknownError";
      const errMsg = combinedErr.message || "";
      console.log("getUserMedia() failed: combined request threw an error");
      console.log(`Exact error name: ${errName}`);
      console.log(`Exact error message: ${errMsg}`);

      // Handle each error separately
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        console.log("Recovery dialog reason: Permission denied");
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        console.log("Recovery dialog reason: Device unavailable");
      } else if (errName === "NotReadableError" || errName === "TrackStartError") {
        console.log("Recovery dialog reason: NotReadableError");
      } else if (errName === "AbortError") {
        console.log("Recovery dialog reason: AbortError");
      } else if (errName === "SecurityError") {
        console.log("Recovery dialog reason: SecurityError");
      }

      console.warn("Combined request failed. Initiating fallback separate checks to isolate status...");

      let camPassed = false;
      let micPassed = false;

      // Fallback: Check Camera in isolation
      try {
        console.log("getUserMedia() called: fallback requesting camera video track in isolation");
        const camTest = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("getUserMedia() succeeded: camera video track isolation test passed");
        setCameraState("granted");
        camPassed = true;
        
        // Release hardware resources immediately
        camTest.getTracks().forEach((t) => {
          t.stop();
          console.log(`Stopped camera track: ${t.label}`);
        });
      } catch (err: any) {
        const name = err.name || "UnknownError";
        const msg = err.message || "";
        console.log(`getUserMedia() failed: camera individual test failed. Error: ${name}. Message: ${msg}`);
        
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          console.log("Recovery dialog reason: Permission denied");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          console.log("Recovery dialog reason: Device unavailable");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          console.log("Recovery dialog reason: NotReadableError");
        } else if (name === "AbortError") {
          console.log("Recovery dialog reason: AbortError");
        } else if (name === "SecurityError") {
          console.log("Recovery dialog reason: SecurityError");
        }

        const isBlocked = name === "NotAllowedError" || name === "PermissionDeniedError";
        setCameraState(isBlocked ? "blocked" : "denied");
        addToast(isBlocked ? "Camera blocked in settings" : "Camera permission denied", "error");
      }

      // Fallback: Check Microphone in isolation
      try {
        console.log("getUserMedia() called: fallback requesting microphone audio track in isolation");
        const micTest = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("getUserMedia() succeeded: microphone audio track isolation test passed");
        setMicState("granted");
        micPassed = true;
        
        // Release hardware resources immediately
        micTest.getTracks().forEach((t) => {
          t.stop();
          console.log(`Stopped microphone track: ${t.label}`);
        });
      } catch (err: any) {
        const name = err.name || "UnknownError";
        const msg = err.message || "";
        console.log(`getUserMedia() failed: microphone individual test failed. Error: ${name}. Message: ${msg}`);
        
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          console.log("Recovery dialog reason: Permission denied");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          console.log("Recovery dialog reason: Device unavailable");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          console.log("Recovery dialog reason: NotReadableError");
        } else if (name === "AbortError") {
          console.log("Recovery dialog reason: AbortError");
        } else if (name === "SecurityError") {
          console.log("Recovery dialog reason: SecurityError");
        }

        const isBlocked = name === "NotAllowedError" || name === "PermissionDeniedError";
        setMicState(isBlocked ? "blocked" : "denied");
        addToast(isBlocked ? "Microphone blocked in settings" : "Microphone permission denied", "error");
      }

      setRequesting(false);

      if (camPassed && micPassed) {
        console.log("Both checks passed in isolation fallback. Re-calling getUserMedia() for final combined streams...");
        try {
          const finalStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          const videoTracks = finalStream.getVideoTracks();
          const audioTracks = finalStream.getAudioTracks();
          
          cameraStream = new MediaStream(videoTracks);
          micStream = new MediaStream(audioTracks);
          
          addToast("All permissions granted", "success");
          onAllPermissionsGranted({ video: cameraStream, audio: micStream });
        } catch (e: any) {
          console.error("Failed final combined re-acquisition stream callback:", e);
          setShowRecovery(true);
        }
      } else {
        console.log("One or both devices failed checks. Recovery dialog shown.");
        setShowRecovery(true);
      }
    }
  }, [addToast, onAllPermissionsGranted]);

  // Auto check permissions on mount (bypasses click if already granted in browser settings)
  useEffect(() => {
    let active = true;
    const autoCheckState = async () => {
      if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const cam = await navigator.permissions.query({ name: "camera" as any });
          const mic = await navigator.permissions.query({ name: "microphone" as any });
          
          if (cam.state === "granted" && mic.state === "granted") {
            console.log("Browser settings indicate permissions are already granted. Auto-initiating stream request...");
            if (active) {
              void requestPermissions();
            }
          }
        } catch (e) {
          console.log("Error querying auto-permissions check:", e);
        }
      }
    };
    void autoCheckState();
    return () => {
      active = false;
    };
  }, [requestPermissions]);

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
