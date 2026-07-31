"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReasoningLesson, ReasoningFormula, ReasoningQuestion } from "@/models/reasoning";
import { LearningBreadcrumb } from "./LearningBreadcrumb";
import { DifficultyBadge } from "./DifficultyBadge";
import { FormulaViewer } from "./FormulaViewer";
import { QuestionPreview } from "./QuestionPreview";
import { Clock, CheckSquare, Target, Lightbulb, GraduationCap, AlertTriangle, Briefcase, FileText, ListChecks, Loader2, Lock, CheckCircle2 } from "lucide-react";

export function LessonViewer({ 
  lesson, 
  moduleName, 
  formulas,
  questions,
  prevLesson,
  nextLesson
}: { 
  lesson: ReasoningLesson, 
  moduleName: string,
  formulas: ReasoningFormula[],
  questions: ReasoningQuestion[],
  prevLesson?: { id: string, title: string, moduleId: string },
  nextLesson?: { id: string, title: string, moduleId: string }
}) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);
  const [stats, setStats] = useState({ practiceAttempted: 0, practiceCorrect: 0, totalAvailable: 0, hasMastery: false });
  const [lessonViewed, setLessonViewed] = useState(false);
  const [formulasViewed, setFormulasViewed] = useState(formulas.length === 0);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const formulaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/v1/reasoning/lesson-status?lesson_id=${lesson.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(console.error);
  }, [lesson.id]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === bottomRef.current) setLessonViewed(true);
          if (entry.target === formulaRef.current) setFormulasViewed(true);
        }
      });
    }, { threshold: 0.1 });

    if (bottomRef.current) observer.observe(bottomRef.current);
    if (formulaRef.current) observer.observe(formulaRef.current);

    return () => observer.disconnect();
  }, [formulas.length]);

  const [activeMode, setActiveMode] = useState<"learn" | "practice" | "revision" | "challenge" | "interview">("learn");

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

  const reqAttempted = Math.min(5, stats.totalAvailable);
  const hasEnoughAttempts = stats.practiceAttempted >= reqAttempted;
  const accuracy = stats.practiceAttempted > 0 ? (stats.practiceCorrect / stats.practiceAttempted) * 100 : 0;
  const hasAccuracy = accuracy >= 70;
  
  const canComplete = lessonViewed && formulasViewed && hasEnoughAttempts && hasAccuracy;

  const handleMarkComplete = async () => {
    if (!canComplete) return;
    setMarking(true);
    try {
      await fetch('/api/v1/reasoning/mastery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: lesson.id, markAsComplete: true })
      });
      // Force reload to update navigation state globally
      window.location.href = nextLesson ? `/reasoning/learn/${nextLesson.moduleId}/${nextLesson.id}` : `/reasoning/learn/${lesson.module_id}`;
    } catch (e) {
      console.error(e);
      setMarking(false);
    }
  };

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

  const modes = [
    { id: "learn", label: "Learn", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "practice", label: "Practice", icon: <Target className="w-4 h-4" /> },
    { id: "revision", label: "Revision", icon: <FileText className="w-4 h-4" /> },
    { id: "challenge", label: "Challenge", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "interview", label: "Interview", icon: <Briefcase className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
      <LearningBreadcrumb items={[
        { label: moduleName, href: `/reasoning/learn/${lesson.module_id}` },
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

      {/* Learning Modes Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 border-b border-zinc-800 hide-scrollbar">
        {modes.map(mode => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeMode === mode.id 
                ? "bg-emerald-500 text-black" 
                : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      {/* Main Content Sections Based on Mode */}
      {activeMode === "learn" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              
              <div ref={formulaRef}>
                <FormulaViewer formulas={formulas} />
              </div>

              {renderSection("Summary & Key Takeaways", null, c.summary)}
            </>
          )}
        </div>
      )}

      {activeMode === "practice" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <QuestionPreview lessonId={lesson.id} questions={questions} />
          {renderSection("Common Mistakes", <AlertTriangle className="text-red-500 w-6 h-6" />, c.commonMistakes)}
        </div>
      )}

      {activeMode === "revision" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div ref={formulaRef}>
            <FormulaViewer formulas={formulas} />
          </div>
          {renderSection("Time Saving Tricks", <Clock className="text-amber-500 w-6 h-6" />, c.timeSavingTricks)}
          {renderSection("Revision Notes", null, c.revisionNotes)}
          {renderSection("Cheat Sheet", null, c.cheatSheet)}
        </div>
      )}

      {activeMode === "challenge" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderSection("Assignments", <FileText className="text-emerald-500 w-6 h-6" />, c.assignments)}
          {renderSection("Company Asked Questions", null, c.companyAskedQuestions)}
          <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-indigo-400 font-bold mb-1">Company Challenge</h3>
              <p className="text-zinc-400 text-sm">Attempt hard-level questions previously asked by top companies.</p>
            </div>
            <Link href={`/reasoning/practice/${lesson.id}`} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition">
              Start Challenge
            </Link>
          </div>
        </div>
      )}

      {activeMode === "interview" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderSection("Interview Tips", <Briefcase className="text-blue-500 w-6 h-6" />, c.interviewTips)}
          <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <h3 className="text-blue-400 font-bold mb-2">Mental Math & Rapid Fire</h3>
            <p className="text-zinc-300 text-sm mb-4">Can you solve these variations within 30 seconds mentally?</p>
            <div className="space-y-3">
              {questions.slice(0, 3).map((q, i) => (
                <div key={q.id || i} className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1 block">Rapid Q{i+1}</span>
                  <div dangerouslySetInnerHTML={{ __html: q.question }} className="text-sm text-zinc-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-4" />

      {/* Completion Criteria Panel */}
      <div className="mb-10 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h3 className="text-lg font-bold text-white mb-4">Lesson Completion Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            {lessonViewed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Lock className="w-5 h-5 text-zinc-500" />}
            <span className={lessonViewed ? "text-white" : "text-zinc-400"}>Read entire lesson</span>
          </div>
          {formulas.length > 0 && (
            <div className="flex items-center gap-3">
              {formulasViewed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Lock className="w-5 h-5 text-zinc-500" />}
              <span className={formulasViewed ? "text-white" : "text-zinc-400"}>View required formulas</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            {hasEnoughAttempts ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Lock className="w-5 h-5 text-zinc-500" />}
            <span className={hasEnoughAttempts ? "text-white" : "text-zinc-400"}>
              Practice Questions ({stats.practiceAttempted}/{reqAttempted})
            </span>
          </div>
          <div className="flex items-center gap-3">
            {hasAccuracy ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Lock className="w-5 h-5 text-zinc-500" />}
            <span className={hasAccuracy ? "text-white" : "text-zinc-400"}>
              70% Accuracy Target ({accuracy.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>


      <div className="mt-12 flex flex-col sm:flex-row justify-between items-center border-t border-zinc-800 pt-8 gap-4">
        {prevLesson ? (
          <Link href={`/reasoning/learn/${prevLesson.moduleId}/${prevLesson.id}`} className="text-zinc-400 hover:text-white transition-colors text-sm font-medium w-full sm:w-auto text-center">
            ← {prevLesson.title}
          </Link>
        ) : (
          <div className="w-full sm:w-auto"></div>
        )}
        
        <button 
          onClick={handleMarkComplete}
          disabled={marking || !canComplete}
          className={`${canComplete ? 'bg-emerald-500 hover:bg-emerald-600 text-black' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'} px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm w-full sm:w-auto`}
        >
          {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : (canComplete ? "Mark as Complete" : "Complete Requirements")}
          {!marking && canComplete && <CheckSquare className="w-4 h-4" />}
          {!marking && !canComplete && <Lock className="w-4 h-4" />}
        </button>

        {nextLesson ? (
          <Link href={`/reasoning/learn/${nextLesson.moduleId}/${nextLesson.id}`} className="text-zinc-400 hover:text-white transition-colors text-sm font-medium w-full sm:w-auto text-center">
            {nextLesson.title} →
          </Link>
        ) : (
          <div className="w-full sm:w-auto"></div>
        )}
      </div>
    </div>
  );
}

