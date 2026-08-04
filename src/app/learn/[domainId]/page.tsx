import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, CheckCircle, Lock } from "lucide-react";
import { LearningService } from "@/lib/learning/services/LearningService";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function DomainCurriculumPage({ params }: { params: Promise<{ domainId: string }> }) {
  const { domainId } = await params;
  const normalizedDomainId = LearningService.queries.normalizeDomainId(domainId);
  
  const domains = await LearningService.queries.getDomains();
  const currentDomain = domains.find(d => d.id === normalizedDomainId);
  
  if (!currentDomain) {
    return notFound();
  }

  const modules = await LearningService.queries.getModules(normalizedDomainId);
  const userId = await LearningService.queries.getServerUserId();

  // In a real scenario, we'd calculate mastery here. For now, all unlocked.
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8">
        
        {/* Navigation */}
        <Link 
          href="/learn" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-emerald-400 transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Learning Hub
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl flex items-center gap-3">
            {currentDomain.title || currentDomain.name}
          </h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl">
            {currentDomain.description}
          </p>
        </header>

        {/* Modules List Grid */}
        <div className="grid gap-6">
          {modules.map((mod, idx) => (
            <div
              key={mod.id}
              className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-emerald-400 font-bold text-sm shrink-0 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                  {mod.level_order || idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                      Module {mod.level_order || idx + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-zinc-400 max-w-2xl">{mod.description}</p>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  href={`/learn/${domainId}/${mod.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-black text-white px-6 py-2.5 text-sm font-semibold transition whitespace-nowrap"
                >
                  View Lessons &rarr;
                </Link>
              </div>
            </div>
          ))}

          {modules.length === 0 && (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
              No modules found for this domain yet.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
