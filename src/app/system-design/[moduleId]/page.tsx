import Link from "next/link";
import { BookOpen, CheckCircle, ChevronRight, Lock } from "lucide-react";
import { getV2Modules } from "@/lib/api/systemDesignV2";
import { MODULES } from "@/lib/systemDesignContent";

export default async function ModuleOverviewPage(props: { params: Promise<{ moduleId: string }> }) {
  const params = await props.params;
  const { moduleId } = params;
  
  // Fetch from the DB
  const modules = await getV2Modules();
  let moduleData: any = modules.find((m: any) => m.id === moduleId);

  // Fallback to legacy content if not found in DB
  if (!moduleData) {
    const legacyModule = MODULES.find(m => m.id === moduleId);
    if (legacyModule) {
      moduleData = {
        id: legacyModule.id,
        title: legacyModule.title,
        sd_lessons: legacyModule.lessons.map(l => ({
          id: l.id,
          title: l.title,
          reading_time: l.readingTime,
          difficulty: l.difficulty
        }))
      };
    }
  }

  if (!moduleData) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
        <div className="p-8 text-center rounded-2xl border border-dashed border-foreground/20 bg-foreground/5">
          <Lock className="h-8 w-8 mx-auto opacity-50 mb-3" />
          <h3 className="font-bold">Module Not Found</h3>
          <p className="text-sm opacity-70 mt-1">This module is locked or migrating to the V2 architecture.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex items-center gap-2 text-sm opacity-60 mb-2">
        <Link href="/system-design" className="hover:underline">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span>{moduleData.title}</span>
      </div>

      <section>
        <h1 className="text-3xl font-extrabold tracking-tight">{moduleData.title}</h1>
        <p className="text-sm opacity-70 mt-2">
          Complete all lessons and pass the module assessment to unlock the next level in your System Design journey.
        </p>
      </section>

      <div className="space-y-4">
        {moduleData.sd_lessons && moduleData.sd_lessons.length > 0 ? (
          moduleData.sd_lessons.map((lesson: any, idx: number) => (
            <Link 
              key={lesson.id} 
              href={`/system-design/${moduleId}/${lesson.id}`}
              className="block p-5 rounded-2xl border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{idx + 1}. {lesson.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3"/> {lesson.reading_time}</span>
                    <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3"/> {lesson.difficulty}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 opacity-50" />
              </div>
            </Link>
          ))
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-foreground/20 bg-foreground/5">
            <Lock className="h-8 w-8 mx-auto opacity-50 mb-3" />
            <h3 className="font-bold">Content Locked / In Development</h3>
            <p className="text-sm opacity-70 mt-1">This module is currently being mapped to the new V2 content architecture.</p>
          </div>
        )}
      </div>
    </div>
  );
}
