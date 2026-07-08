import Link from "next/link";
import { BookOpen, CheckCircle, ChevronRight, Lock, BrainCircuit } from "lucide-react";
import { getV2Lesson } from "@/lib/api/systemDesignV2";
import { MODULES } from "@/lib/systemDesignContent";
import AIMentor from "@/components/system-design/ai/AIMentor";
import DesignReviewPanel from "@/components/system-design/ai/DesignReviewPanel";
import LessonVisualsSwitcher from "@/components/system-design/LessonVisualsSwitcher";
import ConceptTooltip from "@/components/system-design/ConceptTooltip";

// Phase 3 mock diagrams/animations since the actual DB is still being populated
const mockDiagrams = [
  {
    id: "diag-1",
    type: "mermaid" as const,
    title: "High Level Architecture",
    isInteractive: true,
    content: `
      graph TD
        A[Client] -->|HTTP| B(API Gateway)
        B --> C{Load Balancer}
        C --> D[Web Server 1]
        C --> E[Web Server 2]
        D --> F[(Database)]
        E --> F
    `
  }
];

const mockAnimations = [
  { id: '1', label: 'Client', description: 'User sends HTTP request', componentType: 'client' },
  { id: '2', label: 'Gateway', description: 'API Gateway authenticates', componentType: 'gateway' },
  { id: '3', label: 'Load Balancer', description: 'Routes to Server 1', componentType: 'loadbalancer' },
  { id: '4', label: 'Cache', description: 'Checks Redis cache (Miss)', componentType: 'cache' },
  { id: '5', label: 'Database', description: 'Queries PostgreSQL', componentType: 'database' }
];
export default async function LessonTheoryPage(props: { params: Promise<{ moduleId: string, lessonId: string }> }) {
  const params = await props.params;
  const { moduleId, lessonId } = params;
  
  let lessonData = await getV2Lesson(lessonId);

  // Fallback to legacy content if not found in DB
  if (!lessonData) {
    const legacyModule = MODULES.find(m => m.id === moduleId);
    const legacyLesson = legacyModule?.lessons.find(l => l.id === lessonId);
    if (legacyLesson) {
      lessonData = {
        id: legacyLesson.id,
        title: legacyLesson.title,
        difficulty: legacyLesson.difficulty,
        reading_time: legacyLesson.readingTime,
        sd_modules: { title: legacyModule?.title },
        content: {
          theory: legacyLesson.theory,
          advantages: legacyLesson.advantages,
          disadvantages: legacyLesson.disadvantages,
          tradeoffs: legacyLesson.tradeoffs,
          mistakes: legacyLesson.mistakes,
          summary: legacyLesson.takeaways.join(" ")
        }
      };
    }
  }

  if (!lessonData) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-foreground/20 bg-foreground/5 max-w-4xl">
        <Lock className="h-8 w-8 mx-auto opacity-50 mb-3" />
        <h3 className="font-bold">Lesson Not Found</h3>
        <p className="text-sm opacity-70 mt-1">This lesson is either locked or migrating to the V2 architecture.</p>
        <Link href={`/system-design/${moduleId}`} className="text-cyan-500 mt-4 block text-sm">Return to Module</Link>
      </div>
    );
  }

  // Parse the 23-step structured JSON content
  const content = typeof lessonData.content === 'string' ? JSON.parse(lessonData.content) : lessonData.content;
  const moduleTitle = lessonData.sd_modules?.title || "Module";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl pb-32">
      <div className="flex items-center gap-2 text-sm opacity-60 mb-2">
        <Link href="/system-design" className="hover:underline">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/system-design/${moduleId}`} className="hover:underline">{moduleTitle}</Link>
        <ChevronRight className="h-4 w-4" />
        <span>{lessonData.title}</span>
      </div>

      <header className="border-b border-foreground/10 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">{lessonData.title}</h1>
        <div className="flex items-center gap-4 text-sm opacity-70 font-semibold">
          <span className="flex items-center gap-1.5 bg-foreground/5 px-2.5 py-1 rounded-md"><BookOpen className="h-4 w-4"/> {lessonData.reading_time}</span>
          <span className="flex items-center gap-1.5 bg-foreground/5 px-2.5 py-1 rounded-md"><CheckCircle className="h-4 w-4"/> {lessonData.difficulty}</span>
        </div>
      </header>



      {/* 23-Step Standardized Template Scaffold with Visual Engine */}
      
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-indigo-400" />
          1. Overview & Theory
        </h2>
        
        <LessonVisualsSwitcher diagrams={mockDiagrams} animationSteps={mockAnimations}>
          <div className="p-5 rounded-xl bg-foreground/[0.03] border border-foreground/5 leading-relaxed text-sm opacity-90">
            {/* We mock injecting ConceptTooltips here. In production, this would be an MDX mapping. */}
            {content.theory ? (
              <div dangerouslySetInnerHTML={{ __html: content.theory }} />
            ) : (
              <p>
                In a <ConceptTooltip term="Distributed System" definition="A system whose components are located on different networked computers." difficulty="Beginner" interviewImportance="High">Distributed System</ConceptTooltip>, a <ConceptTooltip term="Load Balancer" definition="Distributes network traffic across multiple servers." difficulty="Beginner" interviewImportance="High" lessonLink="/system-design/mod-foundations/load-balancing">Load Balancer</ConceptTooltip> is used to ensure no single server bears too much demand.
              </p>
            )}
          </div>
        </LessonVisualsSwitcher>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">2. Tradeoffs & Advantages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <h3 className="font-bold text-emerald-600 mb-3 text-sm uppercase tracking-wider">Advantages</h3>
            <ul className="list-disc list-inside space-y-2 text-sm opacity-80">
              {content.advantages?.map((adv: string, i: number) => (
                <li key={i}>{adv}</li>
              ))}
            </ul>
          </div>
          <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
            <h3 className="font-bold text-red-600 mb-3 text-sm uppercase tracking-wider">Disadvantages</h3>
            <ul className="list-disc list-inside space-y-2 text-sm opacity-80">
              {content.disadvantages?.map((dis: string, i: number) => (
                <li key={i}>{dis}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm">
          <strong className="text-amber-600">The Tradeoff:</strong> {content.tradeoffs || "No tradeoffs specified."}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">3. Interview Tips & Mistakes</h2>
        <div className="p-5 rounded-xl bg-foreground/[0.03] border border-foreground/5 text-sm">
          <ul className="list-disc list-inside space-y-2 opacity-80">
            {content.mistakes?.map((mistake: string, i: number) => (
              <li key={i}>{mistake}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">14. Conclusion & Summary</h2>
        <div className="p-5 rounded-xl bg-foreground/[0.03] border border-foreground/5 leading-relaxed text-sm opacity-90">
          {content.summary || "Summary content goes here."}
        </div>
      </section>

      <div className="flex justify-end pt-8 border-t border-foreground/10">
        <Link 
          href={`/system-design/${moduleId}/${lessonId}/quiz`}
          className="bg-cyan-500 hover:bg-cyan-600 text-black px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
        >
          Take Lesson Quiz
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Floating AI Mentor Widget */}
      <AIMentor />
      
      {/* Design Review Panel (Mock placement for Phase 4) */}
      <div className="mt-12">
        <DesignReviewPanel />
      </div>
    </div>
  );
}
