"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Camera, Mic, RefreshCw, ShieldCheck } from "lucide-react";
import { useToast } from "./hooks";
import { PermissionRecoveryDialog } from "./PermissionRecoveryDialog";

type PermissionFlowProps = {
  onAllPermissionsGranted: (streams: { video: MediaStream; audio: MediaStream }) => void;
  onCancel?: () => void;
};

export function PermissionFlow({ onAllPermissionsGranted, onCancel }: PermissionFlowProps) {
  const { addToast } = useToast();
  const [requesting, setRequesting] = useState(true);
  const [cameraState, setCameraState] = useState<"checking" | "idle" | "granted" | "denied" | "blocked" | "notFound" | "inUse">("checking");
  const [micState, setMicState] = useState<"checking" | "idle" | "granted" | "denied" | "blocked" | "notFound" | "inUse">("checking");
  const [showRecovery, setShowRecovery] = useState(false);
  
  // Guard to prevent multiple simultaneous requests on mount in React StrictMode
  const requestInProgress = useRef(false);

  const requestPermissions = useCallback(async () => {
    if (requestInProgress.current) return;
    requestInProgress.current = true;
    setRequesting(true);
    setShowRecovery(false);
    setCameraState("checking");
    setMicState("checking");

    console.log("----------------------------------------");
    
    // Add temporary console logging for enumerateDevices()
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("enumerateDevices() success:", devices);
    } catch (e) {
      console.error("enumerateDevices() error:", e);
    }

    console.log("getUserMedia() called: requesting combined video and audio streams");

    let cameraStream: MediaStream | null = null;
    let micStream: MediaStream | null = null;

    const savedMicId = window.localStorage.getItem("nh-mic")?.replace(/"/g, "");
    const savedCamId = window.localStorage.getItem("nh-cam")?.replace(/"/g, "");

    const constraints: MediaStreamConstraints = {
      video: savedCamId ? { deviceId: { ideal: savedCamId } } : true,
      audio: savedMicId ? { deviceId: { ideal: savedMicId } } : true
    };

    // Try joint request first
    try {
      const combinedStream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log("getUserMedia() succeeded: combined stream received");
      console.log("Stream received ID:", combinedStream.id);

      setCameraState("granted");
      setMicState("granted");
      addToast("All permissions granted", "success");

      const videoTracks = combinedStream.getVideoTracks();
      const audioTracks = combinedStream.getAudioTracks();

      cameraStream = new MediaStream(videoTracks);
      micStream = new MediaStream(audioTracks);

      setRequesting(false);
      requestInProgress.current = false;
      onAllPermissionsGranted({ video: cameraStream, audio: micStream });
      return;
    } catch (e) {
      const combinedErr = e as Error;
      const errName = combinedErr.name || "UnknownError";
      const errMsg = combinedErr.message || "";
      console.log("getUserMedia() failed: combined request threw an error");
      console.log(`Exact error name: ${errName}`);
      console.log(`Exact error message: ${errMsg}`);

      console.warn("Combined request failed. Initiating fallback separate checks to isolate status...");

      let camPassed = false;
      let micPassed = false;

      // Fallback: Check Camera in isolation
      try {
        console.log("getUserMedia() called: fallback requesting camera video track in isolation");
        const camTest = await navigator.mediaDevices.getUserMedia(constraints.video ? { video: constraints.video } : { video: true });
        console.log("getUserMedia() succeeded: camera video track isolation test passed");
        setCameraState("granted");
        camPassed = true;

        camTest.getTracks().forEach((t) => t.stop());
      } catch (e) {
        const err = e as Error;
        const name = err.name || "UnknownError";
        const msg = err.message || "";
        console.log(`getUserMedia() failed: camera individual test failed. Error: ${name}. Message: ${msg}`);

        let state: "blocked" | "notFound" | "inUse" | "denied" = "denied";
        let toastMsg = "Camera permission denied";

        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          state = "blocked";
          toastMsg = "Camera blocked in settings";
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          state = "notFound";
          toastMsg = "Device not found.";
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          state = "inUse";
          toastMsg = "Device in use.";
        } else if (name === "OverconstrainedError") {
          state = "notFound";
          toastMsg = "Camera constraints not met";
        } else if (name === "AbortError") {
          state = "denied";
          toastMsg = "Camera request aborted";
        } else if (name === "SecurityError") {
          state = "blocked";
          toastMsg = "Camera access blocked by security policy";
        }

        setCameraState(state);
        addToast(toastMsg, "error");
      }

      // Fallback: Check Microphone in isolation
      try {
        console.log("getUserMedia() called: fallback requesting microphone audio track in isolation");
        const micTest = await navigator.mediaDevices.getUserMedia(constraints.audio ? { audio: constraints.audio } : { audio: true });
        console.log("getUserMedia() succeeded: microphone audio track isolation test passed");
        setMicState("granted");
        micPassed = true;

        micTest.getTracks().forEach((t) => t.stop());
      } catch (e) {
        const err = e as Error;
        const name = err.name || "UnknownError";
        const msg = err.message || "";
        console.log(`getUserMedia() failed: microphone individual test failed. Error: ${name}. Message: ${msg}`);

        let state: "blocked" | "notFound" | "inUse" | "denied" = "denied";
        let toastMsg = "Microphone permission denied";

        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          state = "blocked";
          toastMsg = "Microphone blocked in settings";
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          state = "notFound";
          toastMsg = "Device not found.";
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          state = "inUse";
          toastMsg = "Device in use.";
        } else if (name === "OverconstrainedError") {
          state = "notFound";
          toastMsg = "Microphone constraints not met";
        } else if (name === "AbortError") {
          state = "denied";
          toastMsg = "Microphone request aborted";
        } else if (name === "SecurityError") {
          state = "blocked";
          toastMsg = "Microphone access blocked by security policy";
        }

        setMicState(state);
        addToast(toastMsg, "error");
      }

      setRequesting(false);
      requestInProgress.current = false;

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
        } catch (e) {
          console.error("Failed final combined re-acquisition stream callback:", e);
          setShowRecovery(true);
        }
      } else {
        console.log("One or both devices failed checks. Recovery dialog shown.");
        setShowRecovery(true);
      }
    }
  }, [addToast, onAllPermissionsGranted]);

  // Auto check permissions on mount (bypasses click if already granted in browser settings, or prompts if not)
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  const getStatusBadge = (state: typeof cameraState) => {
    switch (state) {
      case "checking":
        return {
          text: "Checking permissions...",
          styles: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400 animate-pulse",
          iconStyles: "bg-cyan-500/10 text-cyan-400",
        };
      case "granted":
        return {
          text: "Active",
          styles: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
          iconStyles: "bg-emerald-500/10 text-emerald-400",
        };
      case "blocked":
        return {
          text: "Blocked",
          styles: "border-red-500/20 bg-red-500/10 text-red-400",
          iconStyles: "bg-red-500/10 text-red-400",
        };
      case "notFound":
        return {
          text: "Device not found.",
          styles: "border-amber-500/20 bg-amber-500/10 text-amber-400",
          iconStyles: "bg-amber-500/10 text-amber-400",
        };
      case "inUse":
        return {
          text: "Device in use.",
          styles: "border-purple-500/20 bg-purple-500/10 text-purple-400",
          iconStyles: "bg-purple-500/10 text-purple-400",
        };
      case "denied":
        return {
          text: "Denied",
          styles: "border-red-500/20 bg-red-500/10 text-red-400",
          iconStyles: "bg-red-500/10 text-red-400",
        };
      default:
        return {
          text: "Idle",
          styles: "border-white/5 bg-transparent text-foreground/40",
          iconStyles: "bg-white/5 text-foreground/60",
        };
    }
  };

  const camBadge = getStatusBadge(cameraState);
  const micBadge = getStatusBadge(micState);

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
            <div className={`p-2.5 rounded-xl ${camBadge.iconStyles}`}>
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold">Webcam Device</div>
              <div className="text-[10px] text-foreground/50">Required for presence and identity audits</div>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${camBadge.styles}`}>
            {camBadge.text}
          </span>
        </div>

        {/* Mic Status Card */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${micBadge.iconStyles}`}>
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold">Microphone Input</div>
              <div className="text-[10px] text-foreground/50">Required for vocal responses and STT logic</div>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${micBadge.styles}`}>
            {micBadge.text}
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
          onClick={() => {
             requestInProgress.current = false;
             requestPermissions();
          }}
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
          cameraState={cameraState}
          micState={micState}
          onRetry={() => {
             requestInProgress.current = false;
             requestPermissions();
          }}
          onClose={() => setShowRecovery(false)}
        />
      )}
    </div>
  );
}
