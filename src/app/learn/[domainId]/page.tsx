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

        {/* Modules Timeline */}
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
          {modules.map((mod, idx) => (
            <div key={mod.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-black bg-zinc-800 text-zinc-400 group-hover:bg-emerald-500 group-hover:text-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow transition-colors z-10">
                <span className="font-bold text-sm">{mod.level_order}</span>
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                    Module {mod.level_order}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{mod.title}</h3>
                <p className="text-sm text-zinc-400 mb-6">{mod.description}</p>
                
                <Link 
                  href={`/learn/${domainId}/${mod.id}`}
                  className="inline-flex items-center justify-center w-full rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-black text-white px-4 py-2.5 text-sm font-semibold transition"
                >
                  View Lessons
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
