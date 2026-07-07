import Link from "next/link";
import { Database, Network, ChevronRight, Activity, Code, Scale, AlertTriangle, Lock } from "lucide-react";
import { getV2CaseStudy } from "@/lib/api/systemDesignV2";

export default async function CaseStudyPage({ params }: { params: { caseId: string } }) {
  const { caseId } = params;
  
  const caseData = await getV2CaseStudy(caseId);

  if (!caseData) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-foreground/20 bg-foreground/5 max-w-4xl">
        <Lock className="h-8 w-8 mx-auto opacity-50 mb-3" />
        <h3 className="font-bold">Case Study Not Found</h3>
        <p className="text-sm opacity-70 mt-1">This blueprint is either locked or migrating to the V2 architecture.</p>
        <Link href="/system-design/cases" className="text-cyan-500 mt-4 block text-sm">Return to Directory</Link>
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
        <span className="truncate max-w-[200px]">{caseData.title}</span>
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
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6 text-indigo-400" />
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

      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Network className="h-6 w-6 text-emerald-400" />
          2. High Level Design (HLD)
        </h2>
        <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-sm leading-relaxed opacity-90">
          {content.highLevelDesign}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Code className="h-6 w-6 text-amber-400" />
          3. Low Level Design & APIs
        </h2>
        
        <div className="space-y-4">
          <h3 className="font-bold opacity-80">API Endpoints</h3>
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
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-dashed border-foreground/20">
        <h2 className="text-xl font-bold flex items-center gap-2 text-rose-500">
          <AlertTriangle className="h-5 w-5" />
          Key Tradeoffs
        </h2>
        <div className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-sm opacity-90">
          {content.tradeoffs}
        </div>
      </section>
    </div>
  );
}
