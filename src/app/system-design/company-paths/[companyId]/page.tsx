"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Target } from "lucide-react";

export default function CompanyPathPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const companyName = companyId.charAt(0).toUpperCase() + companyId.slice(1).replace('-', ' ');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl pb-32">
      <div className="flex items-center gap-2 text-sm opacity-60 mb-2">
        <Link href="/system-design/company-paths" className="hover:underline">Company Paths</Link>
        <ChevronRight className="h-4 w-4" />
        <span>{companyName}</span>
      </div>

      <header className="border-b border-foreground/10 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight mb-3 flex items-center gap-2">
          {companyName} Interview Blueprint
        </h1>
        <p className="text-sm opacity-70">
          This blueprint breaks down {companyName}&apos;s specific interview structure, required topics, and expected evaluation rubric.
        </p>
      </header>

      <div className="p-8 text-center rounded-2xl border border-dashed border-foreground/20 bg-foreground/5">
        <Target className="h-12 w-12 mx-auto text-blue-500/50 mb-4" />
        <h2 className="text-xl font-bold">Company Profiles Under Construction</h2>
        <p className="text-sm opacity-70 mt-2 max-w-lg mx-auto mb-6">
          The specific interview rubrics and previous questions database are being populated in Phase 5 of the System Design module roadmap.
        </p>
      </div>

    </div>
  );
}
