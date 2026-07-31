"use client";

import React, { useState } from "react";
import { Building2 } from "lucide-react";

interface CompanyLogoProps {
  logoUrl?: string;
  name: string;
  size?: number;
  className?: string;
}

export function CompanyLogo({ logoUrl, name, size = 64, className = "" }: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);

  const initials = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(" ")
    .filter(Boolean)
    .map(w => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase() || "JOB";

  const isLocalLogoPath = logoUrl && logoUrl.startsWith("/logos/");

  if (!logoUrl || hasError || isLocalLogoPath) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`rounded-xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex flex-col items-center justify-center text-center p-1 text-emerald-400 font-extrabold shadow-sm shrink-0 ${className}`}
      >
        <Building2 className="w-5 h-5 mb-0.5 text-emerald-400/80" />
        <span className="text-[10px] tracking-widest font-mono">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={name}
      style={{ width: size, height: size }}
      onError={() => setHasError(true)}
      className={`object-contain drop-shadow-md rounded-lg ${className}`}
    />
  );
}
