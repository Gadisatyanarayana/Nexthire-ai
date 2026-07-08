import Link from "next/link";
import { ChevronRight, BookOpen, Layers } from "lucide-react";
import { getV2Modules } from "@/lib/api/systemDesignV2";
import { MODULES } from "@/lib/systemDesignContent";

export default async function ModulesIndexPage() {
  let modules: any = await getV2Modules();
  
  if (!modules || modules.length === 0) {
    // Fallback if DB is empty
    modules = MODULES.map(m => ({
      id: m.id,
      title: m.title,
      sd_lessons: m.lessons
    }));
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl pb-32">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Layers className="h-8 w-8 text-indigo-500" />
          System Design Modules
        </h1>
        <p className="text-sm opacity-70 mt-2 max-w-2xl">
          Progress through structured modules covering fundamentals to advanced distributed architectures.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod: any, idx: number) => (
          <Link
            key={mod.id}
            href={`/system-design/${mod.id}`}
            className="p-6 rounded-2xl border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 transition-colors flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold">
                {idx + 1}
              </div>
              <h2 className="text-xl font-bold">{mod.title}</h2>
            </div>
            
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-4 w-4 opacity-50" />
              <span className="text-sm font-medium opacity-80">
                {mod.sd_lessons?.length || 0} Lessons
              </span>
            </div>

            <div className="mt-auto pt-4 border-t border-foreground/10 flex items-center justify-between text-sm font-semibold text-indigo-500">
              <span className="flex items-center gap-1">Start Module</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
