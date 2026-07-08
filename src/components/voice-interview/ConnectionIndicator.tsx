"use client";

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
     
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
        isOnline
          ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-400"
          : "border-red-500/10 bg-red-500/5 text-red-400 animate-pulse"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline Connection</span>
        </>
      )}
    </div>
  );
}
