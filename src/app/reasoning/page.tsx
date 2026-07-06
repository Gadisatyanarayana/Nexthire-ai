"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  BookOpen, Clock, Award, CheckCircle, XCircle, ChevronRight,
  Zap, ArrowRight, RefreshCw, Eye, EyeOff, BookOpenCheck, HelpCircle
} from "lucide-react";
import { getReasoningQuestions, REASONING_TOPICS, type ReasoningQuestion } from "@/lib/reasoningGenerator";

export default function ReasoningPrepPage() {
  const [isDark, setIsDark] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>("Syllogism");
  const [activeTab, setActiveTab] = useState<"learn" | "practice">("practice");
  const [answersRevealed, setAnswersRevealed] = useState<Record<string, boolean>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [practPage, setPractPage] = useState(1);
  const PAGE_SIZE = 20;

  // Theme Sync
  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Fetch reasoning questions dynamically from the generator bank
  const questions = useMemo(() => {
    return getReasoningQuestions(selectedTopic);
  }, [selectedTopic]);

  // Cheatsheet notes for Learn tab
  const topicCheatsheet = useMemo(() => {
    switch (selectedTopic) {
      case "Syllogism":
        return {
          formulas: [
            "Use Euler Diagrams / Venn Diagrams to map statements.",
            "Verify all logical paths (e.g. some A are B, all B are C).",
            "Be careful with negative conclusions (e.g. 'No A is C')."
          ],
          workedExample: {
            q: "Statements: All cats are animals. All animals are mammals.\nConclusion: I. All cats are mammals.",
            a: "Cats is a subset of Animals. Animals is a subset of Mammals. Therefore, Cats is a subset of Mammals, so Conclusion I holds true."
          }
        };
      case "Blood Relations":
        return {
          formulas: [
            "Draw a family tree diagram (squares for males, circles for females).",
            "Use standard connection notations (e.g. double lines for spouses, single branch for siblings).",
            "Solve the relation from the end of the sentence backward."
          ],
          workedExample: {
            q: "Pointing to a man, a woman says 'He is the son of my father's only son'. How is the man related to the woman?",
            a: "The woman's father's only son is her brother. The man is her brother's son, which makes her his Aunt, and the man her Nephew."
          }
        };
      case "Coding-Decoding":
        return {
          formulas: [
            "Write down alphabetical indexes: A=1, B=2, ..., Z=26.",
            "Look for shift patterns (+1, -2, alternate).",
            "Check opposite letters (e.g. A-Z, B-Y, C-X)."
          ],
          workedExample: {
            q: "If RED is coded as 18-5-4, how is BLUE coded?",
            a: "B=2, L=12, U=21, E=5. The code is 2-12-21-5."
          }
        };
      case "Series Completion":
        return {
          formulas: [
            "Find differences between consecutive terms.",
            "Look for prime numbers, square series, or cube series.",
            "Check for alternating double series."
          ],
          workedExample: {
            q: "Complete the series: 3, 6, 12, 24, ?",
            a: "Each term is multiplied by 2. Next term is 24 * 2 = 48."
          }
        };
      case "Analogy":
        return {
          formulas: [
            "Identify the exact logical relation of the first pair.",
            "Map that relation (cause-effect, worker-tool, state-capital) to the second pair."
          ],
          workedExample: {
            q: "Thermometer : Temperature :: Hygrometer : ?",
            a: "A thermometer measures temperature. A hygrometer measures humidity. Thus, answer is Humidity."
          }
        };
      case "Direction Sense":
        return {
          formulas: [
            "Draw a cardinal directions cross (North Up, South Down, East Right, West Left).",
            "Always trace movements from a central start point.",
            "Apply the Pythagorean Theorem (a^2 + b^2 = c^2) for straight-line distances."
          ],
          workedExample: {
            q: "A person goes 3m North and then 4m East. What is the shortest distance from the start?",
            a: "Shortest distance = sqrt(3^2 + 4^2) = sqrt(9 + 16) = sqrt(25) = 5 meters."
          }
        };
      default:
        return {
          formulas: ["Concept guidelines not found for this topic."],
          workedExample: { q: "N/A", a: "N/A" }
        };
    }
  }, [selectedTopic]);

  const handleSelectOption = (qId: string, oIdx: number) => {
    setSelectedOptions(prev => ({ ...prev, [qId]: oIdx }));
    setAnswersRevealed(prev => ({ ...prev, [qId]: true }));
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-slate-50 text-black"} transition-colors duration-300`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl flex items-center gap-2">
              <Zap className="h-8 w-8 text-amber-400" />
              Reasoning Prep Pathway
            </h1>
            <p className={`mt-1.5 text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
              Solve Logical, Verbal, and Analytical reasoning drills tailored for placement screening tests.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/placement-hub"
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${isDark ? "border-white/20 bg-white/5 hover:bg-white/10" : "border-black/10 bg-white hover:bg-slate-100"}`}
            >
              Back to Hub
            </Link>
          </div>
        </header>

        {/* Workspace Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Topic Navigation Sidebar */}
          <div className={`lg:col-span-1 rounded-3xl border p-5 space-y-4 no-scrollbar overflow-y-auto max-h-[75vh] ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Course Syllabus
            </h3>
            <div className="space-y-1.5">
              {REASONING_TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setAnswersRevealed({});
                    setSelectedOptions({});
                    setPractPage(1);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${selectedTopic === topic ? "bg-amber-500 border-amber-500 text-black" : isDark ? "border-white/10 bg-zinc-900/30 text-white/80 hover:bg-white/5" : "border-black/10 bg-white text-black/80 hover:bg-slate-100"}`}
                >
                  <span>{topic}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Main workspace section */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Learn & Practice Tabs */}
            <div className="flex border-b border-foreground/10 pb-px">
              <button
                onClick={() => setActiveTab("practice")}
                className={`px-6 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition ${activeTab === "practice" ? "border-amber-500 text-amber-500 font-extrabold" : "border-transparent text-foreground/50 hover:text-foreground"}`}
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" />
                  Practice ({questions.length} questions)
                </span>
              </button>
              <button
                onClick={() => setActiveTab("learn")}
                className={`px-6 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition ${activeTab === "learn" ? "border-amber-500 text-amber-500 font-extrabold" : "border-transparent text-foreground/50 hover:text-foreground"}`}
              >
                <span className="flex items-center gap-1.5">
                  <BookOpenCheck className="h-4 w-4" />
                  Learn Theory & Logic
                </span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="no-scrollbar overflow-y-auto max-h-[70vh] pr-1 space-y-6">
              
              {activeTab === "learn" ? (
                <div className="space-y-6">
                  {/* Formulas Card */}
                  <div className={`rounded-3xl border p-6 ${isDark ? "border-white/10 bg-zinc-950/40" : "border-black/5 bg-white shadow-sm"}`}>
                    <h3 className="font-bold text-sm text-amber-400 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      Analytical Guidelines & Rules
                    </h3>
                    <ul className="space-y-3">
                      {topicCheatsheet.formulas.map((formula, idx) => (
                        <li key={idx} className="text-xs leading-relaxed flex items-start gap-2 text-foreground/80">
                          <span className="text-amber-500 font-bold shrink-0">•</span>
                          <span>{formula}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Worked Example */}
                  <div className={`rounded-3xl border p-6 ${isDark ? "border-white/10 bg-zinc-950/40" : "border-black/5 bg-white shadow-sm"}`}>
                    <h3 className="font-bold text-sm text-cyan-400 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      Worked Example
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div>
                        <p className="font-semibold text-foreground mb-1.5">Question Scenario:</p>
                        <p className="bg-foreground/5 p-4 rounded-xl border border-foreground/10 font-medium leading-relaxed">
                          {topicCheatsheet.workedExample.q}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1.5">Logical Proof:</p>
                        <p className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 leading-relaxed text-foreground/80">
                          {topicCheatsheet.workedExample.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                <div className="space-y-4">
                  {/* Practice Questions list with pagination */}
                  {questions.slice((practPage - 1) * PAGE_SIZE, practPage * PAGE_SIZE).map((q, idx) => {
                    const revealed = answersRevealed[q.id];
                    const selectedOpt = selectedOptions[q.id];
                    const isCorrect = selectedOpt === q.correctAnswer;

                    return (
                      <div
                        key={q.id}
                        className={`rounded-3xl border p-6 space-y-4 transition ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}
                      >
                        {/* Tags */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded">
                            Question {idx + 1} ({q.difficulty})
                          </span>
                          <div className="flex gap-1.5">
                            {q.companies.map(company => (
                              <span key={company} className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDark ? "bg-white/5 text-white/50" : "bg-black/5 text-black/50"}`}>
                                {company}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="text-sm font-semibold leading-relaxed text-foreground/90 whitespace-pre-line">
                          {q.question}
                        </div>

                        {/* Multiple Choice Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt, oIdx) => {
                            let borderClass = isDark ? "border-white/10 bg-white/5 hover:bg-white/10 text-white/80" : "border-black/10 bg-white hover:bg-slate-50 text-black/80";
                            
                            if (revealed) {
                              if (oIdx === q.correctAnswer) {
                                borderClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold";
                              } else if (selectedOpt === oIdx) {
                                borderClass = "border-red-500 bg-red-500/10 text-red-400";
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={revealed}
                                onClick={() => handleSelectOption(q.id, oIdx)}
                                className={`text-left p-3.5 rounded-xl border text-xs font-semibold transition ${borderClass}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation block */}
                        {revealed && (
                          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/5 p-4 text-xs space-y-2">
                            <div className="flex items-center gap-1.5">
                              {isCorrect ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle className="h-4.5 w-4.5" /> Correct Answer!
                                </span>
                              ) : (
                                <span className="text-red-400 font-bold flex items-center gap-1">
                                  <XCircle className="h-4.5 w-4.5" /> Incorrect.
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-foreground/80">Explanation:</p>
                            <p className="leading-relaxed text-foreground/60">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {activeTab === "practice" && questions.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-2 pb-4">
                    <button
                      onClick={() => { setPractPage(p => Math.max(1, p - 1)); setAnswersRevealed({}); setSelectedOptions({}); }}
                      disabled={practPage === 1}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition ${practPage === 1 ? 'opacity-30 cursor-not-allowed' : ''} ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border-black/10 bg-white hover:bg-slate-100 text-black'}`}
                    >
                      ← Prev
                    </button>
                    <span className={`text-xs font-semibold ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      Page {practPage} of {Math.ceil(questions.length / PAGE_SIZE)} &nbsp;·&nbsp; {questions.length} questions
                    </span>
                    <button
                      onClick={() => { setPractPage(p => Math.min(Math.ceil(questions.length / PAGE_SIZE), p + 1)); setAnswersRevealed({}); setSelectedOptions({}); }}
                      disabled={practPage === Math.ceil(questions.length / PAGE_SIZE)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition ${practPage === Math.ceil(questions.length / PAGE_SIZE) ? 'opacity-30 cursor-not-allowed' : ''} ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border-black/10 bg-white hover:bg-slate-100 text-black'}`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>)}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
