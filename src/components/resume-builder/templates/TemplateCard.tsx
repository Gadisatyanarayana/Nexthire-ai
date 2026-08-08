import React from "react";
import { FullTemplateConfig } from "./config/TemplateDefinitions";
import { ResumeDocument } from "../types";
import LayoutEngine from "../engine/LayoutEngine";
import { evaluateATSCompatibility } from "../engine/ATSEngine";
import { Check, Star, ShieldCheck } from "lucide-react";

interface TemplateCardProps {
  template: FullTemplateConfig;
  document: ResumeDocument;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export default function TemplateCard({ template, document, isSelected, onSelect }: TemplateCardProps) {
  // Create a virtual document configured with this template ID for live rendering
  const virtualDoc: ResumeDocument = {
    ...document,
    metadata: {
      ...document.metadata,
      templateId: template.id,
    },
  };

  const atsEval = evaluateATSCompatibility(virtualDoc);

  return (
    <div
      className={`group relative flex flex-col bg-[#111111] border rounded-xl overflow-hidden transition-all duration-300 hover:border-brand-blue/60 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${
        isSelected ? "border-brand-blue ring-2 ring-brand-blue/30" : "border-white/10"
      }`}
    >
      {/* Visual Live A4 Thumbnail Container */}
      <div className="relative w-full h-[260px] bg-neutral-900 overflow-hidden flex justify-center items-start pt-3 cursor-pointer" onClick={() => onSelect(template.id)}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#111111] z-10 pointer-events-none"></div>

        {/* Live Scaled A4 DOM Snapshot */}
        <div
          className="bg-white shadow-2xl origin-top transition-transform duration-300 group-hover:scale-[0.24] pointer-events-none select-none"
          style={{
            width: "8.5in",
            height: "11in",
            transform: "scale(0.22)",
          }}
        >
          <LayoutEngine form={virtualDoc} />
        </div>

        {/* Selected Badge */}
        {isSelected && (
          <div className="absolute top-3 right-3 z-20 bg-brand-blue text-white p-1.5 rounded-full shadow-lg">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Card Info Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#111111]">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">{template.name}</h3>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/10 text-gray-300">
              {template.category}
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{template.tagline}</p>
        </div>

        {/* Deterministic ATS Compatibility Rating */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ATS Compatibility
            </span>
            <div className="flex items-center gap-1 font-bold text-emerald-400">
              <span className="text-amber-400 flex">
                {Array.from({ length: atsEval.stars }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </span>
              <span className="text-[11px] ml-1">{atsEval.rating}</span>
            </div>
          </div>

          {/* Recommended Roles Pills */}
          <div className="flex flex-wrap gap-1">
            {template.recommendedRoles.slice(0, 3).map((role, idx) => (
              <span key={idx} className="text-[10px] bg-white/5 text-gray-300 px-1.5 py-0.5 rounded border border-white/5">
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onSelect(template.id)}
          className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            isSelected
              ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20"
              : "bg-white/10 hover:bg-white/20 text-white"
          }`}
        >
          {isSelected ? "Active Template" : "Use Template"}
        </button>
      </div>
    </div>
  );
}
