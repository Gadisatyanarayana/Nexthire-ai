"use client";

import React from "react";
import { COMPANY_MODES } from "./constants";
import { CompanyMode } from "./types";
import { Building2, Sparkles } from "lucide-react";

type CompanyModeProps = {
  selected: CompanyMode;
  onSelect: (mode: CompanyMode) => void;
};

export function CompanyModeSelector({ selected, onSelect }: CompanyModeProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
        <Building2 className="h-4 w-4 text-cyan-400" />
        <span>Target Company Environment:</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {(Object.keys(COMPANY_MODES) as CompanyMode[]).map((key) => {
          const config = COMPANY_MODES[key];
          const isSelected = selected === key;
          
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`p-3 text-left rounded-2xl border text-xs transition-all relative overflow-hidden flex flex-col justify-between h-20 ${
                isSelected
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                  : "border-white/5 bg-white/5 text-foreground/70 hover:border-white/10"
              }`}
            >
              <div className="font-extrabold flex items-center justify-between w-full">
                <span>{config.label}</span>
                {isSelected && <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />}
              </div>
              <div className="text-[9px] text-foreground/40 leading-normal line-clamp-2 mt-1">
                {config.style}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
