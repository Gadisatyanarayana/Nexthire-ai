import React from "react";
import { ResumeDocument } from "../types";
import LayoutEngine from "../engine/LayoutEngine";
import { FileText } from "lucide-react";

interface PreviewProps {
  form: ResumeDocument;
  zoom?: number;
}

export default function ResumePreview({ form, zoom = 0.85 }: PreviewProps) {
  return (
    <aside className="flex-1 bg-transparent border-l border-white/5 p-10 overflow-y-auto print:block print:w-full print:p-0 print:border-none print:bg-white flex flex-col justify-start items-center custom-scrollbar relative z-10">
      {/* Top Page Indicator & Ratio Badge */}
      <div className="mb-4 flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 print:hidden shadow-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <FileText className="w-3.5 h-3.5 text-brand-blue" /> A4 Document (210mm × 297mm)
        </span>
        <span className="h-3 w-[1px] bg-white/20"></span>
        <span className="text-[11px] font-mono text-emerald-400 font-semibold">Page 1 of 1</span>
      </div>

      {/* Main A4 Document Sheet Container */}
      <div className="flex flex-col items-center pb-20 print:p-0 print:m-0">
        <div
          className="bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/10 print:shadow-none print:ring-0 transition-transform duration-300 relative rounded-sm print:rounded-none"
          style={{
            width: "8.5in",
            minHeight: "11in",
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            marginBottom: `calc(11in * ${zoom - 1})`,
            backgroundColor: "#ffffff",
          }}
        >
          <div className="w-full h-full relative z-10">
            <LayoutEngine form={form} />
          </div>
        </div>
      </div>
    </aside>
  );
}
