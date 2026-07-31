import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, Clock, Zap, Target, BookOpen, 
  CheckCircle, PlayCircle, FileText, ChevronRight, Download,
  HelpCircle, ShieldCheck, Award, Briefcase
} from "lucide-react";
import { LearningService } from "@/lib/learning/services/LearningService";
import { ProgressTracker } from "@/components/learning/ProgressTracker";
import { getFallbackQuestionsForLesson } from "@/lib/learning/fallbackQuestions";
import { InteractivePracticeQuestion } from "@/components/learning/InteractivePracticeQuestion";
import { PracticeQuestionsSection } from "@/components/learning/PracticeQuestionsSection";
import { DownloadNotesButton } from "@/components/learning/DownloadNotesButton";
import { LessonOutlineSidebar } from "@/components/learning/LessonOutlineSidebar";

export const revalidate = 3600;

export default async function LessonViewerPage({ 
  params 
}: { 
  params: Promise<{ domainId: string, moduleId: string, lessonId: string }> 
}) {
  const { domainId, moduleId, lessonId } = await params;
  const normalizedDomainId = LearningService.queries.normalizeDomainId(domainId);
  
  // 1. Fetch domain, module, and lesson
  const domains = await LearningService.queries.getDomains();
  const currentDomain = domains.find(d => d.id === normalizedDomainId);
  
  const modules = await LearningService.queries.getModules(normalizedDomainId);
  const currentModule = modules.find(m => m.id === moduleId);

  const lesson = await LearningService.queries.getLesson(lessonId, normalizedDomainId);
  
  if (!currentDomain || !currentModule || !lesson) {
    return notFound();
  }

  const domainPath = normalizedDomainId === "logical-reasoning" ? "reasoning" : normalizedDomainId === "verbal-ability" ? "verbal" : "aptitude";

  // 2. Fetch concepts for this lesson
  const concepts = await LearningService.queries.getConceptsByLesson(lessonId);
  const formulas = await LearningService.queries.getFormulasByLesson(lessonId);
  
  // 3. Fetch questions preview to get practice count & companies
  let practiceQuestions = await LearningService.queries.getQuestionPreview(lessonId, 50, normalizedDomainId);
  if (!practiceQuestions || practiceQuestions.length === 0) {
    practiceQuestions = getFallbackQuestionsForLesson(lessonId, normalizedDomainId, 10);
  }
  
  // 3b. Determine Next and Previous lessons
  const moduleLessons = await LearningService.queries.getLessonsByModule(moduleId, normalizedDomainId);
  const currentIndex = moduleLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? moduleLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex !== -1 && currentIndex < moduleLessons.length - 1 ? moduleLessons[currentIndex + 1] : null;

  // Extract unique companies
  const uniqueCompanies = Array.from(new Set(
    practiceQuestions.flatMap(q => q.companies || [])
  )).slice(0, 3);

  // 4. Safe defaults
  const skills = Array.isArray(lesson.skills) ? lesson.skills : [];
  const resources = lesson.resources || {};
  const difficultyLabel = (lesson.difficulty || "medium").charAt(0).toUpperCase() + (lesson.difficulty || "medium").slice(1);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      
      {/* Top Breadcrumb Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-zinc-400">
            <Link href="/learn" className="hover:text-white transition hidden md:block">Catalog</Link>
            <ChevronRight className="w-4 h-4 text-zinc-700 hidden md:block" />
            <Link href={`/learn/${domainId}`} className="hover:text-white transition hidden md:block line-clamp-1">{currentDomain.title}</Link>
            <ChevronRight className="w-4 h-4 text-zinc-700 hidden md:block" />
            <Link href={`/learn/${domainId}/${moduleId}`} className="hover:text-white transition hidden md:block line-clamp-1">{currentModule.title}</Link>
            <ChevronRight className="w-4 h-4 text-zinc-700 hidden md:block" />
            <span className="text-emerald-400 line-clamp-1">{lesson.title}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href={`/learn/${domainId}/${moduleId}`}
              className="text-xs font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 transition"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 items-start relative">
        
        {/* Main Lesson Content */}
        <main className="space-y-12 pb-24">
          
          {/* Lesson Header */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                lesson.difficulty === 'beginner' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                lesson.difficulty === 'intermediate' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {difficultyLabel}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                {lesson.reading_time || "15 mins"}
              </span>
              <DownloadNotesButton
                lessonTitle={lesson.title}
                moduleTitle={currentModule.title}
                domainTitle={currentDomain.title}
                concepts={concepts}
                formulas={formulas}
                questions={practiceQuestions}
              />
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {lesson.title}
            </h1>
            
            <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl">
              {lesson.description}
            </p>

            {/* Learning Objectives */}
            {skills.length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 mt-8">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Learning Objectives
                </h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {skills.map((skill: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Concepts Section */}
          <section className="space-y-10">
            {concepts.map((concept, index) => (
              <div key={concept.id} id={`concept-${index}`} className="scroll-mt-24 space-y-4 border-t border-zinc-800/50 pt-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-sm text-zinc-400">
                    {index + 1}
                  </span>
                  {concept.title}
                </h2>
                
                <div className="prose prose-invert prose-emerald max-w-none text-zinc-300">
                  <p className="text-base leading-relaxed">
                    {concept.description}
                  </p>
                  
                  {/* Rich Concept Explanation */}
                  <div className="mt-6 p-6 rounded-xl bg-zinc-900 border border-zinc-800">
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      Concept Explanation & Theory
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                      {concept.description || lesson.description || "Mastering this concept requires understanding the underlying mathematical and logical relationships used by top recruitment platforms."}
                    </p>
                    
                    {resources.formulas && (Array.isArray(resources.formulas) ? resources.formulas.length > 0 : true) && (
                      <div className="bg-black border border-zinc-800 rounded-lg p-4 font-mono text-sm text-emerald-300 overflow-x-auto">
                        <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Key Formula / Shortcut Bit</div>
                        {(Array.isArray(resources.formulas) ? resources.formulas : [resources.formulas]).map((f: any, idx: number) => (
                          <div key={idx} className="mb-2 last:mb-0">
                            {typeof f === "string" ? f : (f?.formula_text || f?.text || f?.title || JSON.stringify(f))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {concepts.length === 0 && (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                <p className="text-zinc-400 font-semibold mb-2">{lesson.description || "Comprehensive Theory & Core Concepts"}</p>
                <p className="text-zinc-500 text-sm">Review the practice questions and bits below to master this topic.</p>
              </div>
            )}
          </section>

          {/* Practice Questions & The Bits Section */}
          <PracticeQuestionsSection questions={practiceQuestions} lessonId={lessonId} />

          {/* Navigation Buttons */}
          <section className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-zinc-800">
            {prevLesson ? (
              <Link 
                href={`/learn/${domainId}/${moduleId}/${prevLesson.id}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Previous</div>
                  <div className="text-sm font-semibold">{prevLesson.title}</div>
                </div>
                <span className="sm:hidden">Previous Lesson</span>
              </Link>
            ) : <div className="hidden sm:block" />}
            
            {nextLesson ? (
              <Link 
                href={`/learn/${domainId}/${moduleId}/${nextLesson.id}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition flex items-center justify-center gap-2"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Next</div>
                  <div className="text-sm font-semibold">{nextLesson.title}</div>
                </div>
                <span className="sm:hidden">Next Lesson</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <ProgressTracker lessonId={lesson.id} isCompleted={false} />
            )}
          </section>

          {/* Practice Section */}
          <section id="practice" className="scroll-mt-24 pt-12 border-t border-zinc-800">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 md:p-10 text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Zap className="w-64 h-64" />
              </div>
              
              <h2 className="text-3xl font-bold text-white relative z-10">
                Ready to test your knowledge?
              </h2>
              
              <p className="text-zinc-400 max-w-xl mx-auto relative z-10">
                Apply what you've learned. There are <strong className="text-white">{practiceQuestions.length}+ practice questions</strong> available for this specific topic to help solidify your understanding.
              </p>
              
              {uniqueCompanies.length > 0 && (
                <div className="flex items-center justify-center gap-3 relative z-10 text-sm text-zinc-500 font-semibold">
                  <span>Tested at:</span>
                  <div className="flex gap-2">
                    {uniqueCompanies.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-zinc-800 rounded-md text-zinc-300">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
                <Link
                  href={`/${domainPath}/practice/${lessonId}`}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
                  Start Practice
                </Link>
                <Link
                  href={`/${domainPath}/mock-tests`}
                  className="w-full sm:w-auto px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition border border-zinc-700 flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Take Assessment
                </Link>
              </div>
            </div>
          </section>

        </main>
        
        {/* Sticky Table of Contents Sidebar */}
        <aside className="hidden lg:block">
          <LessonOutlineSidebar concepts={concepts} />
        </aside>

      </div>
    </div>
  );
}
