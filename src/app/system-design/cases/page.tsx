import Link from "next/link";
import { Database, Network, ChevronRight, Activity, Code, Scale } from "lucide-react";
import { getV2CaseStudies } from "@/lib/api/systemDesignV2";
import { CASE_STUDIES } from "@/lib/systemDesignContent";

export default async function CaseStudiesIndexPage() {
  let cases = await getV2CaseStudies();
  if (!cases || cases.length === 0) {
    cases = CASE_STUDIES.map(c => ({
      id: c.id,
      title: c.title,
      target_scale: c.targetScale
    }));
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <header className="border-b border-foreground/10 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Real-World Architectures</h1>
        <p className="text-sm opacity-70">
          Deconstruct the systems powering the internet's largest companies. Learn how they scale to billions of users.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((cs: any) => (
          <Link 
            key={cs.id}
            href={`/system-design/cases/${cs.id}`}
            className="group p-6 rounded-2xl border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 hover:border-cyan-500/30 transition-all block space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Network className="h-24 w-24" />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-foreground/10 p-2.5 rounded-xl">
                <Database className="h-5 w-5" />
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-cyan-500 transition-colors line-clamp-2">
                {cs.title}
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-mono opacity-60">
                <Scale className="h-3.5 w-3.5" />
                {cs.target_scale}
              </div>
            </div>

            <div className="pt-4 border-t border-foreground/10 flex items-center justify-between text-sm opacity-70 group-hover:opacity-100 transition-opacity">
              <span className="font-medium text-cyan-500">View Blueprint</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        ))}


      </div>
    </div>
  );
}
