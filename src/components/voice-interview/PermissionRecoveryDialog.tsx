"use client";

import React from "react";
import { Camera, Mic, RefreshCw, X, ShieldAlert, CheckSquare, Settings, HelpCircle } from "lucide-react";

type DeviceState = "idle" | "granted" | "denied" | "blocked" | "notFound" | "inUse";

type PermissionRecoveryProps = {
  cameraState: DeviceState;
  micState: DeviceState;
  onRetry: () => void;
  onClose: () => void;
};

export function PermissionRecoveryDialog({ cameraState, micState, onRetry, onClose }: PermissionRecoveryProps) {
  const showCameraWarning = cameraState !== "idle" && cameraState !== "granted";
  const showMicWarning = micState !== "idle" && micState !== "granted";

  const getDeviceDetails = (state: DeviceState, deviceName: "Camera" | "Microphone") => {
    const Icon = deviceName === "Camera" ? Camera : Mic;
    switch (state) {
      case "blocked":
        return {
          title: `${deviceName} Permission Blocked`,
          desc: `${deviceName} permission is blocked at the browser level. Click the lock/settings icon in the browser address bar next to the URL and set ${deviceName} to 'Allow'.`,
          color: "border-red-500/20 bg-red-500/5 text-red-400",
          icon: <Icon className="h-4 w-4" />,
          actionStep: `Enable ${deviceName} permission in browser lock settings.`,
        };
      case "notFound":
        return {
          title: `${deviceName} Not Detected`,
          desc: `No active ${deviceName.toLowerCase()} hardware was found on your system. Please verify that your device is plugged in, turned on, or not disabled in Device Manager.`,
          color: "border-amber-500/20 bg-amber-500/5 text-amber-400",
          icon: <HelpCircle className="h-4 w-4" />,
          actionStep: `Check physical connections or plug in a working ${deviceName.toLowerCase()}.`,
        };
      case "inUse":
        return {
          title: `${deviceName} Busy / In Use`,
          desc: `Your ${deviceName.toLowerCase()} is already in use by another process. Please close other applications (Zoom, Teams, Discord, Skype) or other browser tabs using it.`,
          color: "border-purple-500/20 bg-purple-500/5 text-purple-400",
          icon: <Icon className="h-4 w-4" />,
          actionStep: `Close competing applications or duplicate tabs using the ${deviceName.toLowerCase()}.`,
        };
      case "denied":
      default:
        return {
          title: `${deviceName} Connection Failed`,
          desc: `Could not acquire the ${deviceName.toLowerCase()} stream due to a system error. Please check your hardware or restart your browser.`,
          color: "border-zinc-500/20 bg-zinc-500/5 text-zinc-400",
          icon: <HelpCircle className="h-4 w-4" />,
          actionStep: `Verify system settings or restart the browser.`,
        };
    }
  };

  const camDetails = getDeviceDetails(cameraState, "Camera");
  const micDetails = getDeviceDetails(micState, "Microphone");

  // Determine standard checklist based on issues
  const troubleshootingSteps: string[] = [];
  if (cameraState === "blocked" || micState === "blocked") {
    troubleshootingSteps.push("Click the site lock/settings icon in the browser address bar (left of the URL) and toggle permissions to 'Allow'.");
  }
  if (cameraState === "notFound" || micState === "notFound") {
    troubleshootingSteps.push("Make sure your camera/microphone is securely plugged in, turned on, and recognized by your operating system.");
  }
  if (cameraState === "inUse" || micState === "inUse") {
    troubleshootingSteps.push("Close all other applications (such as Teams, Discord, Zoom) or browser tabs that might be actively accessing your media devices.");
  }
  troubleshootingSteps.push("Refresh the page to reset hardware states and try again.");

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
            The placement mock session cannot start because browser access to your hardware devices was interrupted.
          </p>

          {showCameraWarning && (
            <div className={`p-3.5 rounded-2xl border ${camDetails.color}`}>
              <h4 className="font-bold flex items-center gap-1.5 mb-1 text-[13px]">
                {camDetails.icon}
                <span>{camDetails.title}</span>
              </h4>
              <p className="text-[11px] opacity-80 leading-normal">
                {camDetails.desc}
              </p>
            </div>
          )}

          {showMicWarning && (
            <div className={`p-3.5 rounded-2xl border ${micDetails.color}`}>
              <h4 className="font-bold flex items-center gap-1.5 mb-1 text-[13px]">
                {micDetails.icon}
                <span>{micDetails.title}</span>
              </h4>
              <p className="text-[11px] opacity-80 leading-normal">
                {micDetails.desc}
              </p>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
              <CheckSquare className="h-3.5 w-3.5" /> Recommended Steps:
            </h4>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-foreground/60">
              {troubleshootingSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRetry}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black py-3.5 text-xs font-extrabold transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Device Verification</span>
          </button>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                alert("Please type 'chrome://settings/content' in a new tab to manage your browser permissions.");
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white py-3.5 text-xs font-extrabold transition-all"
          >
            <Settings className="h-4 w-4" />
            <span>Open Browser Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
