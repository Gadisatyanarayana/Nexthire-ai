import Link from "next/link";
import { ChevronRight, Target, Shield, BookOpen, AlertTriangle, ListChecks, Award, Compass } from "lucide-react";
import { getV2CompanyProfile } from "@/lib/api/systemDesignV2";
import AIMentor from "@/components/system-design/ai/AIMentor";

export default async function CompanyPathPage(props: { params: Promise<{ companyId: string }> }) {
  const params = await props.params;
  const { companyId } = params;
  const company = await getV2CompanyProfile(companyId);

  if (!company) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-foreground/20 bg-foreground/5 max-w-4xl mx-auto my-12">
        <Target className="h-8 w-8 mx-auto opacity-50 mb-3" />
        <h3 className="font-bold text-lg">Company Path Not Found</h3>
        <p className="text-sm opacity-70 mt-1">This company profile does not exist in our database.</p>
        <Link href="/system-design/company-paths" className="text-cyan-500 mt-4 block text-sm hover:underline">Return to Directory</Link>
      </div>
    );
  }

  // Parse JSON rubric content
  const rubric = typeof company.rubric === 'string' ? JSON.parse(company.rubric) : company.rubric;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl pb-32">
      <div className="flex items-center gap-2 text-sm opacity-60 mb-2">
        <Link href="/system-design/company-paths" className="hover:underline">Company Paths</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{company.name}</span>
      </div>

      <header className="border-b border-foreground/10 pb-6 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-xs font-mono font-bold tracking-wider uppercase">
          <Shield className="h-3.5 w-3.5" />
          Verified Company Path
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{company.name} Interview Roadmap</h1>
        <div className="flex flex-col gap-2 bg-foreground/5 p-4 rounded-xl border border-foreground/5 text-sm leading-relaxed">
          <div><span className="font-mono opacity-60">Difficulty:</span> <span className="font-bold text-cyan-500">{company.difficulty}</span></div>
          <div><span className="font-mono opacity-60">Focus Areas:</span> <span className="text-foreground font-semibold">{company.focus}</span></div>
        </div>
      </header>

      {/* Interview Rounds */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-indigo-400" />
          1. Interview Structure & Rounds
        </h2>
        <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/5">
          <ul className="space-y-3">
            {rubric.interviewRounds?.map((round: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm opacity-90 leading-relaxed">
                <span className="opacity-40 font-mono text-xs mt-0.5">{(i+1).toString().padStart(2, '0')}</span>
                {round}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HLD & LLD Focus Areas */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] space-y-3">
          <h3 className="font-bold border-b border-foreground/10 pb-2 text-cyan-500">High-Level Design (HLD) Focus</h3>
          <p className="text-sm opacity-80 leading-relaxed">{rubric.hldFocus}</p>
        </div>

        <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] space-y-3">
          <h3 className="font-bold border-b border-foreground/10 pb-2 text-indigo-400">Low-Level Design (LLD) Focus</h3>
          <p className="text-sm opacity-80 leading-relaxed">{rubric.lldFocus}</p>
        </div>
      </section>

      {/* Frequently Asked Topics */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-400" />
          2. Frequently Asked Topics
        </h2>
        <div className="flex flex-wrap gap-2">
          {rubric.frequentTopics?.map((topic: string, i: number) => (
            <span key={i} className="px-3 py-1.5 rounded-xl bg-foreground/5 border border-foreground/10 text-xs font-semibold">{topic}</span>
          ))}
        </div>
      </section>

      {/* Previous Questions */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          3. Previous Interview Questions
        </h2>
        <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/5 space-y-4">
          {rubric.previousQuestions?.map((q: string, i: number) => (
            <div key={i} className="flex gap-3 text-sm opacity-90 leading-relaxed border-b border-foreground/5 last:border-b-0 pb-3 last:pb-0">
              <span className="text-cyan-500 font-mono text-xs mt-0.5">Q{(i+1)}</span>
              {q}
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Lessons */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Compass className="h-5 w-5 text-rose-500" />
          4. Recommended Foundation Lessons
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rubric.recommendedLessons?.map((lessonId: string, i: number) => (
            <Link
              key={i}
              href={`/system-design/mod-foundations/${lessonId}`}
              className="p-4 rounded-xl border border-foreground/10 bg-foreground/[0.03] hover:bg-foreground/5 transition-colors block text-sm font-semibold truncate text-cyan-500 hover:underline"
            >
              Lesson: {lessonId.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Link>
          ))}
        </div>
      </section>

      {/* Mock Interview Roadmap */}
      <section className="space-y-4 pt-4 border-t border-dashed border-foreground/20">
        <h2 className="text-xl font-bold flex items-center gap-2 text-rose-500">
          <AlertTriangle className="h-5 w-5" />
          5. Prep & Mock Interview Roadmap
        </h2>
        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20">
          <ul className="space-y-3">
            {rubric.mockRoadmap?.map((step: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm opacity-90 leading-relaxed">
                <span className="opacity-50 font-bold text-rose-400">{i+1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Floating AI Mentor Widget */}
      <AIMentor />
    </div>
  );
}
