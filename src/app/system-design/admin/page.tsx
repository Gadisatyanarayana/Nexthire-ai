"use client";

import { FileText, Settings } from "lucide-react";

export default function AdminCMSPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-foreground/50" />
          Content Management System
        </h1>
        <p className="text-sm opacity-70 mt-2">
          Author, review, and publish System Design modules, lessons, and case studies.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border-r border-foreground/10 pr-6 space-y-2">
          <h2 className="font-bold text-sm uppercase tracking-wider mb-4 opacity-70">Navigation</h2>
          <button className="w-full text-left px-4 py-2 rounded-lg bg-foreground/10 font-bold">Modules & Lessons</button>
          <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-foreground/5 text-sm">MCQ Bank</button>
          <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-foreground/5 text-sm">Case Studies</button>
          <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-foreground/5 text-sm">Review Queue</button>
        </div>

        <div className="md:col-span-2">
          <div className="p-8 text-center rounded-2xl border border-dashed border-foreground/20 bg-foreground/5">
            <FileText className="h-12 w-12 mx-auto opacity-30 mb-4" />
            <h2 className="text-xl font-bold">CMS Workflow Engine</h2>
            <p className="text-sm opacity-70 mt-2 max-w-md mx-auto">
              This portal will handle MDX editing, diagram uploads, and version control. Currently in Phase 1 setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
