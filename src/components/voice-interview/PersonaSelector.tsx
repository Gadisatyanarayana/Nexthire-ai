"use client";

import React from "react";
import { PERSONAS } from "./constants";
import { RecruiterPersona } from "./types";
import { UserCheck, HelpCircle } from "lucide-react";

type PersonaSelectorProps = {
  selected: RecruiterPersona;
  onSelect: (persona: RecruiterPersona) => void;
};

export function PersonaSelector({ selected, onSelect }: PersonaSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
        <UserCheck className="h-4 w-4 text-cyan-400" />
        <span>Recruiter Persona style:</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {(Object.keys(PERSONAS) as RecruiterPersona[]).map((key) => {
          const config = PERSONAS[key];
          const isSelected = selected === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`p-3.5 text-left rounded-2xl border text-xs transition-all flex items-start gap-3 h-20 ${
                isSelected
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                  : "border-white/5 bg-white/5 text-foreground/75 hover:border-white/10"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-extrabold flex items-center justify-between">
                  <span>{config.label}</span>
                </div>
                <div className="text-[9px] text-foreground/45 mt-1 leading-normal line-clamp-2">
                  {config.traits}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
