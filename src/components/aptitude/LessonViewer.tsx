import React from "react";
import Link from "next/link";
import { AptitudeLesson, AptitudeFormula, AptitudeQuestion } from "@/models/aptitude";
import { LearningBreadcrumb } from "./LearningBreadcrumb";
import { DifficultyBadge } from "./DifficultyBadge";
import { FormulaViewer } from "./FormulaViewer";
import { QuestionPreview } from "./QuestionPreview";
import { Clock, CheckSquare, Target, Lightbulb, GraduationCap, AlertTriangle, Briefcase, FileText, ListChecks } from "lucide-react";

export function LessonViewer({ 
  lesson, 
  moduleName, 
  formulas,
  questions,
  prevLesson,
  nextLesson
}: { 
  lesson: AptitudeLesson, 
  moduleName: string,
  formulas: AptitudeFormula[],
  questions: AptitudeQuestion[],
  prevLesson?: { id: string, title: string, moduleId: string },
  nextLesson?: { id: string, title: string, moduleId: string }
}) {
  let c: any = {};
  if (typeof lesson.content === 'object' && lesson.content !== null) {
    c = lesson.content;
  } else if (typeof lesson.content === 'string') {
    try {
      c = JSON.parse(lesson.content);
    } catch {
      c = { fallback: lesson.content };
    }
  }

  const renderSection = (title: string, icon: React.ReactNode, contentHtml?: string) => {
    if (!contentHtml) return null;
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
          {icon}
          {title}
        </h2>
        <div className="prose prose-invert prose-emerald max-w-none text-zinc-300" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
      <LearningBreadcrumb items={[
        { label: moduleName, href: `/aptitude/learn/${lesson.module_id}` },
        { label: lesson.title }
      ]} />

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <DifficultyBadge difficulty={lesson.difficulty} />
          <span className="flex items-center text-zinc-400 text-sm bg-zinc-900 px-3 py-1 rounded-full">
            <Clock className="w-4 h-4 mr-2" />
            {c.estimatedTime || lesson.reading_time}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          {lesson.title}
        </h1>
        
        {c.prerequisites && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-200">
            <strong>Prerequisites:</strong> {c.prerequisites}
          </div>
        )}
      </header>

      {/* Main Content Sections */}
      {c.fallback ? (
        <div className="prose prose-invert prose-emerald max-w-none text-zinc-300 mb-10">
          <div dangerouslySetInnerHTML={{ __html: c.fallback }} />
        </div>
      ) : (
        <>
          {renderSection("Overview", <Target className="text-emerald-500 w-6 h-6" />, c.overview)}
          {renderSection("Learning Objectives", <ListChecks className="text-cyan-500 w-6 h-6" />, c.learningObjectives)}
          {renderSection("Concept Explanation", <Lightbulb className="text-amber-500 w-6 h-6" />, c.conceptExplanation)}
          {renderSection("Theory", <GraduationCap className="text-emerald-500 w-6 h-6" />, c.theory)}
          {renderSection("Visual Explanation", null, c.visualExplanation)}
          
          <FormulaViewer formulas={formulas} />

          {renderSection("Time Saving Tricks", <Clock className="text-amber-500 w-6 h-6" />, c.timeSavingTricks)}
          {renderSection("Common Mistakes", <AlertTriangle className="text-red-500 w-6 h-6" />, c.commonMistakes)}
          {renderSection("Interview Tips", <Briefcase className="text-blue-500 w-6 h-6" />, c.interviewTips)}
          {renderSection("Company Asked Questions", null, c.companyAskedQuestions)}
          {renderSection("Assignments", <FileText className="text-emerald-500 w-6 h-6" />, c.assignments)}
          {renderSection("Revision Notes", null, c.revisionNotes)}
          {renderSection("Cheat Sheet", null, c.cheatSheet)}
          {renderSection("Summary & Key Takeaways", null, c.summary)}
        </>
      )}

      {/* Related Lessons (if any) */}
      {c.relatedLessons && c.relatedLessons.length > 0 && (
        <div className="mb-10 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-4">Related Lessons</h3>
          <ul className="list-disc pl-5 text-emerald-400">
            {c.relatedLessons.map((rl: any, idx: number) => (
              <li key={idx}><Link href={rl.href || "#"} className="hover:underline">{rl.title}</Link></li>
            ))}
          </ul>
        </div>
      )}
      
      <QuestionPreview lessonId={lesson.id} questions={questions} />

      <div className="mt-12 flex flex-col sm:flex-row justify-between items-center border-t border-zinc-800 pt-8 gap-4">
        {prevLesson ? (
          <Link href={`/aptitude/learn/${prevLesson.moduleId}/${prevLesson.id}`} className="text-zinc-400 hover:text-white transition-colors text-sm font-medium w-full sm:w-auto text-center">
            ← {prevLesson.title}
          </Link>
        ) : (
          <div className="w-full sm:w-auto"></div>
        )}
        
        <button className="bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          Mark as Complete <CheckSquare className="w-4 h-4" />
        </button>

        {nextLesson ? (
          <Link href={`/aptitude/learn/${nextLesson.moduleId}/${nextLesson.id}`} className="text-zinc-400 hover:text-white transition-colors text-sm font-medium w-full sm:w-auto text-center">
            {nextLesson.title} →
          </Link>
        ) : (
          <div className="w-full sm:w-auto"></div>
        )}
      </div>
    </div>
  );
}
