import Link from "next/link";
import { Database, Network, ChevronRight, Activity, Code, Scale, AlertTriangle, Lock, FileText, Server, HardDrive, Share2, ShieldAlert, Cpu } from "lucide-react";
import { getV2CaseStudy } from "@/lib/api/systemDesignV2";
import AIMentor from "@/components/system-design/ai/AIMentor";

export default async function CaseStudyPage(props: { params: Promise<{ caseId: string }> }) {
  const params = await props.params;
  const { caseId } = params;
  
  const caseData = await getV2CaseStudy(caseId);

  if (!caseData) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-foreground/20 bg-foreground/5 max-w-4xl mx-auto my-12">
        <Lock className="h-8 w-8 mx-auto opacity-50 mb-3" />
        <h3 className="font-bold text-lg">Case Study Not Found</h3>
        <p className="text-sm opacity-70 mt-1">This blueprint is either locked or migrating to the V2 architecture.</p>
        <Link href="/system-design/cases" className="text-cyan-500 mt-4 block text-sm hover:underline">Return to Directory</Link>
      </div>
    );
  }

  // Parse JSON content
  const content = typeof caseData.content === 'string' ? JSON.parse(caseData.content) : caseData.content;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl pb-32">
      <div className="flex items-center gap-2 text-sm opacity-60 mb-2">
        <Link href="/system-design" className="hover:underline">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/system-design/cases" className="hover:underline">Case Studies</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate max-w-[200px] text-foreground font-semibold">{caseData.title}</span>
      </div>

      <header className="border-b border-foreground/10 pb-6 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-xs font-mono font-bold tracking-wider uppercase">
          <Activity className="h-3.5 w-3.5" />
          Production Blueprint
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{caseData.title}</h1>
        <div className="flex items-center gap-2 text-sm font-mono opacity-70 bg-foreground/5 p-3 rounded-xl border border-foreground/5 w-fit">
          <Scale className="h-4 w-4" />
          Target Scale: <span className="font-bold text-foreground">{caseData.target_scale}</span>
        </div>
      </header>

      {/* 14-Step Standardized Blueprint Scaffold */}

      {/* 1. Functional & Non-Functional Requirements */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-400">
          <Database className="h-6 w-6" />
          1. Requirements Engineering
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/5 space-y-4">
            <h3 className="font-bold border-b border-foreground/10 pb-2 flex items-center justify-between">
              Functional Requirements
              <span className="text-xs font-normal opacity-50 bg-foreground/10 px-2 py-0.5 rounded">Core Features</span>
            </h3>
            <ul className="space-y-3">
              {content.functionalSpecs?.map((spec: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm opacity-90 leading-relaxed">
                  <span className="opacity-40 font-mono text-xs mt-0.5">{(i+1).toString().padStart(2, '0')}</span>
                  {spec}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/5 space-y-4">
            <h3 className="font-bold border-b border-foreground/10 pb-2 flex items-center justify-between">
              Non-Functional Requirements
              <span className="text-xs font-normal opacity-50 bg-foreground/10 px-2 py-0.5 rounded">System Goals</span>
            </h3>
            <ul className="space-y-3">
              {content.nonFunctionalSpecs?.map((spec: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm opacity-90 leading-relaxed">
                  <span className="opacity-40 font-mono text-xs mt-0.5">{(i+1).toString().padStart(2, '0')}</span>
                  {spec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Out of Scope */}
      {content.outOfScope && content.outOfScope.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-bold flex items-center gap-2 text-foreground/80">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            Out of Scope Features
          </h3>
          <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/10 text-sm opacity-80 leading-relaxed">
            <ul className="list-disc list-inside space-y-1">
              {content.outOfScope.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 4. Capacity Estimation */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
          <Scale className="h-5 w-5" />
          2. Scale & Capacity Estimation
        </h2>
        <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-sm leading-relaxed opacity-90 font-mono">
          {content.capacityEstimation}
        </div>
      </section>

      {/* 5. API Endpoints */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
          <Code className="h-5 w-5" />
          3. API Contract & Endpoints
        </h2>
        <div className="overflow-hidden rounded-xl border border-foreground/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-foreground/5 border-b border-foreground/10 text-xs uppercase tracking-wider opacity-70">
              <tr>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Endpoint</th>
                <th className="p-4 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5 bg-foreground/[0.02]">
              {content.apiEndpoints?.map((api: any, i: number) => (
                <tr key={i} className="hover:bg-foreground/5 transition-colors">
                  <td className="p-4">
                    <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                      api.method === 'GET' ? 'bg-blue-500/10 text-blue-500' :
                      api.method === 'POST' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {api.method}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs opacity-90">{api.path}</td>
                  <td className="p-4 opacity-70">{api.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. High Level Design */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-400">
          <Network className="h-6 w-6" />
          4. High Level Design (HLD)
        </h2>
        <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-sm leading-relaxed opacity-95">
          {content.highLevelDesign}
        </div>
      </section>

      {/* 7. Low Level Design */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
          <Cpu className="h-5 w-5" />
          5. Detailed Component & Low Level Design (LLD)
        </h2>
        <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-sm leading-relaxed opacity-95">
          {content.lowLevelDesign}
        </div>
      </section>

      {/* 8. Database Schema Design */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-purple-400">
          <HardDrive className="h-5 w-5" />
          6. Database Schema Design
        </h2>
        <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.03] text-sm leading-relaxed opacity-95 font-mono whitespace-pre-line">
          {content.databaseSchema}
        </div>
      </section>

      {/* 9. Core Data Flow */}
      {content.dataFlow && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-teal-400">
            <Share2 className="h-5 w-5" />
            7. Core Data Flow Steps
          </h2>
          <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-sm leading-relaxed opacity-95 whitespace-pre-line">
            {content.dataFlow}
          </div>
        </section>
      )}

      {/* 10. Caching Strategy */}
      {content.cachingStrategy && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500">
            <Server className="h-5 w-5" />
            8. Caching & CDN Strategy
          </h2>
          <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-sm leading-relaxed opacity-95">
            {content.cachingStrategy}
          </div>
        </section>
      )}

      {/* 11. Scalability Design */}
      {content.scalability && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-500">
            <Scale className="h-5 w-5" />
            9. Scalability & Data Partitioning
          </h2>
          <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-sm leading-relaxed opacity-95">
            {content.scalability}
          </div>
        </section>
      )}

      {/* 12. Resilience & Fault Tolerance */}
      {content.faultTolerance && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-red-400">
            <ShieldAlert className="h-5 w-5" />
            10. Resilience & Fault Tolerance
          </h2>
          <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-sm leading-relaxed opacity-95">
            {content.faultTolerance}
          </div>
        </section>
      )}

      {/* 13. Key Tradeoffs */}
      <section className="space-y-4 pt-4 border-t border-dashed border-foreground/20">
        <h2 className="text-xl font-bold flex items-center gap-2 text-rose-500">
          <AlertTriangle className="h-5 w-5" />
          11. Architectural Trade-offs
        </h2>
        <div className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-sm opacity-95 leading-relaxed">
          {content.tradeoffs}
        </div>
      </section>

      {/* 14. Future Extensions */}
      {content.futureExtensions && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
            <FileText className="h-5 w-5" />
            12. Future Scalability Extensions
          </h2>
          <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-sm leading-relaxed opacity-95">
            {content.futureExtensions}
          </div>
        </section>
      )}

      {/* Floating AI Mentor Widget */}
      <AIMentor />
    </div>
  );
}
