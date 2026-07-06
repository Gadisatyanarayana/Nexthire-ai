"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  BookOpen, Clock, Award, CheckCircle, XCircle, ChevronRight,
  Zap, ArrowRight, RefreshCw, Eye, EyeOff, BookOpenCheck, HelpCircle
} from "lucide-react";
import { getAptitudeQuestions, APTITUDE_TOPICS, type AptitudeQuestion } from "@/lib/aptitudeGenerator";

export default function AptitudePrepPage() {
  const [isDark, setIsDark] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>("Time & Work");
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

  // Fetch questions for the selected topic (dynamically generated bank of 125+ questions per topic)
  const questions = useMemo(() => {
    return getAptitudeQuestions(selectedTopic);
  }, [selectedTopic]);

  // Formulas & cheatsheet data for the Learn tab
  const topicCheatsheet = useMemo(() => {
    switch (selectedTopic) {
      case "Time & Work":
        return {
          formulas: [
            "If A can do a piece of work in D days, A's 1-day work = 1/D.",
            "If A can do work in X days and B in Y days, together they can finish it in: (X * Y) / (X + Y) days.",
            "Work = Rate * Time."
          ],
          workedExample: {
            q: "A can complete a task in 12 days and B can do it in 24 days. Working together, how long will they take?",
            a: "A's rate = 1/12. B's rate = 1/24. Combined rate = 1/12 + 1/24 = 3/24 = 1/8. Inverting this combined rate, they will take 8 days working together."
          }
        };
      case "Time & Distance":
        return {
          formulas: [
            "Distance = Speed * Time.",
            "Speed = Distance / Time.",
            "To convert km/h to m/s, multiply by 5/18.",
            "To convert m/s to km/h, multiply by 18/5."
          ],
          workedExample: {
            q: "A train covers a distance of 360 km at a speed of 72 km/h. How much time does it take?",
            a: "Time = Distance / Speed = 360 / 72 = 5 hours."
          }
        };
      case "Profit & Loss":
        return {
          formulas: [
            "Profit = Selling Price (SP) - Cost Price (CP).",
            "Loss = Cost Price (CP) - Selling Price (SP).",
            "Profit Percentage = (Profit / CP) * 100.",
            "Selling Price (SP) = CP * (1 + Profit% / 100)."
          ],
          workedExample: {
            q: "An item purchased for $200 is sold at a 15% profit. Find its selling price.",
            a: "Profit = 15% of $200 = $30. Selling Price = $200 + $30 = $230."
          }
        };
      case "Percentage":
        return {
          formulas: [
            "Percentage value = (Part / Total) * 100.",
            "To increase a value by x%, multiply it by (1 + x/100).",
            "To decrease a value by x%, multiply it by (1 - x/100)."
          ],
          workedExample: {
            q: "What is 35% of 800?",
            a: "Value = (35 / 100) * 800 = 0.35 * 800 = 280."
          }
        };
      case "Simple & Compound Interest":
        return {
          formulas: [
            "Simple Interest (SI) = (P * R * T) / 100, where P = Principal, R = Rate of Interest, T = Time.",
            "Compound Interest Amount (A) = P * (1 + R/100)^T.",
            "Compound Interest (CI) = Amount (A) - Principal (P)."
          ],
          workedExample: {
            q: "Calculate SI on a principal of $1000 at 5% rate for 3 years.",
            a: "SI = (1000 * 5 * 3) / 100 = $150."
          }
        };
      case "Problems on Ages":
        return {
          formulas: [
            "If the current age of a person is X, then n years ago age was X - n, and n years hence age will be X + n.",
            "Ages ratios can be mapped directly using algebraic variables (e.g. 3x and 4x)."
          ],
          workedExample: {
            q: "The ratio of ages of a father and son is 4:1. If the father is 40 years old, how old is the son?",
            a: "Let son's age be S. 4S = 40. Therefore, Son's age S = 10 years."
          }
        };
      case "Average":
        return {
          formulas: [
            "Average = (Sum of all observations) / (Total number of observations).",
            "Sum of observations = Average * Total number of observations."
          ],
          workedExample: {
            q: "Find the average of 10, 20, 30, 40.",
            a: "Sum = 10 + 20 + 30 + 40 = 100. Count = 4. Average = 100 / 4 = 25."
          }
        };
      case "Ratio & Proportion":
        return {
          formulas: [
            "A duplicate ratio of a:b is a^2:b^2.",
            "If a/b = c/d, then a, b, c, d are in proportion.",
            "Dividing a total sum S in the ratio a:b:c yields portions of: S*(a/total), S*(b/total), and S*(c/total)."
          ],
          workedExample: {
            q: "Divide $120 between A and B in the ratio 3:2.",
            a: "Total parts = 3 + 2 = 5 parts. A's share = (3/5) * 120 = $72. B's share = (2/5) * 120 = $48."
          }
        };
      default:
        return {
          formulas: ["Formula sheet not found."],
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
              Aptitude Prep Pathway
            </h1>
            <p className={`mt-1.5 text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
              Learn fundamental arithmetic rules and practice thousands of dynamic placement preparation questions.
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
              {APTITUDE_TOPICS.map(topic => (
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
                  Learn Theory & Formulas
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
                      Core Concepts & Formulas
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
                      Solved Example
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div>
                        <p className="font-semibold text-foreground mb-1.5">Question:</p>
                        <p className="bg-foreground/5 p-4 rounded-xl border border-foreground/10 font-medium leading-relaxed">
                          {topicCheatsheet.workedExample.q}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1.5">Solution Walkthrough:</p>
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
                        <p className="text-sm font-semibold leading-relaxed text-foreground/90">
                          {q.question}
                        </p>

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
