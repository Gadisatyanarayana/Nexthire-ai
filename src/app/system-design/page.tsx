"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Compass, Layout, Award, Cpu, HelpCircle,
  Database, Server, BookOpen, Layers, CheckCircle2, ArrowRight,
  ChevronRight, Play, CheckCircle, XCircle, Search, Bookmark,
  Edit3, Clock, CheckSquare, RefreshCw, BarChart2, BookMarked,
  BookOpen as BookIcon, ChevronLeft, Save
} from "lucide-react";

import { MODULES, CASE_STUDIES, GLOSSARY, type Lesson, type CaseStudy } from "@/lib/systemDesignContent";

export default function SystemDesignPage() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<"syllabus" | "cases" | "quiz" | "glossary" | "bookmarks">("syllabus");

  // Selection state
  const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  // Lesson sub-tab: "theory" | "tradeoffs" | "questions"
  const [lessonTab, setLessonTab] = useState<"theory" | "tradeoffs" | "questions">("theory");

  // Database synchronizations states
  const [progressSet, setProgressSet] = useState<Set<string>>(new Set());
  const [bookmarksSet, setBookmarksSet] = useState<Set<string>>(new Set());
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  
  // Note edit state
  const [currentNote, setCurrentNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);

  // Search state
  const [globalSearch, setGlobalSearch] = useState("");
  const [glossarySearch, setGlossarySearch] = useState("");

  // Quiz interactive card state
  const [lessonQuizAnswers, setLessonQuizAnswers] = useState<Record<string, number>>({});
  const [lessonQuizRevealed, setLessonQuizRevealed] = useState<Record<string, boolean>>({});

  // Mock Test Simulator State
  const [mockTestActive, setMockTestActive] = useState(false);
  const [mockTimeRemaining, setMockTimeRemaining] = useState(300); // 5 minutes
  const [mockQuestions, setMockQuestions] = useState<any[]>([]);
  const [mockAnswers, setMockAnswers] = useState<Record<number, number>>({});
  const [mockSubmitted, setMockSubmitted] = useState(false);
  const [mockActiveIdx, setMockActiveIdx] = useState(0);

  const activeLesson = MODULES[selectedModuleIdx]?.lessons[selectedLessonIdx] || MODULES[0].lessons[0];

  // Sync Theme with root document
  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Load User Data from DB
  const loadUserData = useCallback(async () => {
    try {
      setDbLoading(true);
      const res = await fetch("/api/system-design");
      if (res.ok) {
        const data = await res.json();
        const pSet = new Set<string>();
        for (const p of data.progress || []) {
          if (p.completed) pSet.add(p.lesson_id);
        }
        setProgressSet(pSet);
        setBookmarksSet(new Set(data.bookmarks || []));

        const nMap: Record<string, string> = {};
        for (const n of data.notes || []) {
          nMap[n.lesson_id] = n.content;
        }
        setNotesMap(nMap);
        if (nMap[activeLesson.id]) {
          setCurrentNote(nMap[activeLesson.id]);
        } else {
          setCurrentNote("");
        }
      }
    } catch (err) {
      console.error("Failed to load user system design metadata:", err);
    } finally {
      setDbLoading(false);
    }
  }, [activeLesson.id]);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  // Sync note input when lesson shifts
  useEffect(() => {
    setCurrentNote(notesMap[activeLesson.id] || "");
  }, [activeLesson.id, notesMap]);

  // Save Notes to DB
  const saveNote = async () => {
    if (!activeLesson?.id) return;
    try {
      setIsSavingNote(true);
      const res = await fetch("/api/system-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-note",
          lessonId: activeLesson.id,
          content: currentNote
        })
      });
      if (res.ok) {
        setNotesMap(prev => ({ ...prev, [activeLesson.id]: currentNote }));
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Toggle Completion Progress
  const toggleProgress = async (lessonId: string) => {
    const isCompleted = progressSet.has(lessonId);
    const newSet = new Set(progressSet);
    if (isCompleted) {
      newSet.delete(lessonId);
    } else {
      newSet.add(lessonId);
    }
    setProgressSet(newSet);

    try {
      await fetch("/api/system-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-progress",
          lessonId,
          completed: !isCompleted
        })
      });
    } catch (err) {
      console.error("Failed to toggle progress:", err);
    }
  };

  // Toggle Bookmark status
  const toggleBookmark = async (lessonId: string) => {
    const isBookmarked = bookmarksSet.has(lessonId);
    const newSet = new Set(bookmarksSet);
    if (isBookmarked) {
      newSet.delete(lessonId);
    } else {
      newSet.add(lessonId);
    }
    setBookmarksSet(newSet);

    try {
      await fetch("/api/system-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-bookmark",
          lessonId,
          bookmarked: !isBookmarked
        })
      });
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  // Navigation handlers
  const handleNext = () => {
    const activeMod = MODULES[selectedModuleIdx];
    if (selectedLessonIdx < activeMod.lessons.length - 1) {
      setSelectedLessonIdx(prev => prev + 1);
    } else if (selectedModuleIdx < MODULES.length - 1) {
      setSelectedModuleIdx(prev => prev + 1);
      setSelectedLessonIdx(0);
    }
    setLessonTab("theory");
  };

  const handlePrev = () => {
    if (selectedLessonIdx > 0) {
      setSelectedLessonIdx(prev => prev - 1);
    } else if (selectedModuleIdx > 0) {
      setSelectedModuleIdx(prev => prev - 1);
      setSelectedLessonIdx(MODULES[selectedModuleIdx - 1].lessons.length - 1);
    }
    setLessonTab("theory");
  };

  // Streak/Status math
  const totalLessons = useMemo(() => {
    let count = 0;
    for (const mod of MODULES) count += mod.lessons.length;
    return count;
  }, []);

  const completedCount = progressSet.size;
  const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Search logic across lessons
  const filteredLessons = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const query = globalSearch.toLowerCase();
    const matches: Array<{ lesson: Lesson; modTitle: string; modIdx: number; lesIdx: number }> = [];

    MODULES.forEach((mod, mIdx) => {
      mod.lessons.forEach((les, lIdx) => {
        if (
          les.title.toLowerCase().includes(query) ||
          les.theory.toLowerCase().includes(query) ||
          les.takeaways.some(t => t.toLowerCase().includes(query))
        ) {
          matches.push({ lesson: les, modTitle: mod.title, modIdx: mIdx, lesIdx: lIdx });
        }
      });
    });

    return matches;
  }, [globalSearch]);

  // Glossary Search Filter
  const filteredGlossary = useMemo(() => {
    const q = glossarySearch.toLowerCase();
    return GLOSSARY.filter(
      item => item.term.toLowerCase().includes(q) || item.definition.toLowerCase().includes(q)
    );
  }, [glossarySearch]);

  // Timer mock quiz simulator tick
  useEffect(() => {
    if (!mockTestActive || mockSubmitted) return;
    const interval = setInterval(() => {
      setMockTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setMockSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mockTestActive, mockSubmitted]);

  // Start mock quiz simulator
  const startMockTest = () => {
    // Flatten 5 questions from content MCQs
    const list: any[] = [];
    MODULES.forEach(mod => {
      mod.lessons.forEach(les => {
        les.quiz.forEach(q => {
          list.push({
            ...q,
            lessonTitle: les.title,
            lessonId: les.id
          });
        });
      });
    });

    // Shuffle and slice 5 questions
    const shuffled = [...list].sort(() => 0.5 - Math.random()).slice(0, 5);
    setMockQuestions(shuffled);
    setMockAnswers({});
    setMockTimeRemaining(300);
    setMockSubmitted(false);
    setMockActiveIdx(0);
    setMockTestActive(true);
  };

  // SVGs for Architectures
  const renderDiagram = (id: string) => {
    const baseClass = "w-full h-auto max-h-[300px] rounded-2xl p-4 transition-all duration-300";
    if (id === "scaling-diagram") {
      return (
        <svg viewBox="0 0 700 240" className={`${baseClass} ${isDark ? "bg-zinc-950/40 text-white" : "bg-slate-100 text-black"}`} fill="none">
          <rect x="15" y="90" width="100" height="50" rx="10" fill="#58a6ff" fillOpacity="0.1" stroke="#58a6ff" strokeWidth="2"/>
          <text x="65" y="120" fill="currentColor" fontSize="12" fontWeight="bold" textAnchor="middle">User Client</text>
          
          <path d="M115 115 H165" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow-head)" strokeDasharray="3 3"/>

          <rect x="175" y="80" width="120" height="70" rx="10" fill="#ffa116" fillOpacity="0.1" stroke="#ffa116" strokeWidth="2"/>
          <text x="235" y="115" fill="currentColor" fontSize="12" fontWeight="bold" textAnchor="middle">Load Balancer</text>
          <text x="235" y="132" fill="currentColor" fontSize="10" opacity="0.6" textAnchor="middle">Layer 7 Routing</text>

          <path d="M295 100 L375 55" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow-head)"/>
          <path d="M295 130 L375 175" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow-head)"/>

          <rect x="385" y="25" width="120" height="50" rx="10" fill="#a371f7" fillOpacity="0.1" stroke="#a371f7" strokeWidth="2"/>
          <text x="445" y="55" fill="currentColor" fontSize="11" fontWeight="bold" textAnchor="middle">Web Server A</text>

          <rect x="385" y="155" width="120" height="50" rx="10" fill="#a371f7" fillOpacity="0.1" stroke="#a371f7" strokeWidth="2"/>
          <text x="445" y="185" fill="currentColor" fontSize="11" fontWeight="bold" textAnchor="middle">Web Server B</text>

          <path d="M505 50 L565 95" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow-head)"/>
          <path d="M505 180 L565 135" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow-head)"/>

          <rect x="575" y="90" width="110" height="50" rx="10" fill="#00b8a3" fillOpacity="0.1" stroke="#00b8a3" strokeWidth="2"/>
          <text x="630" y="120" fill="currentColor" fontSize="11" fontWeight="bold" textAnchor="middle">Shared Cache & DB</text>

          <defs>
            <marker id="arrow-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
            </marker>
          </defs>
        </svg>
      );
    }

    if (id === "cap-diagram") {
      return (
        <svg viewBox="0 0 600 220" className={`${baseClass} ${isDark ? "bg-zinc-950/40 text-white" : "bg-slate-100 text-black"}`} fill="none">
          <circle cx="150" cy="110" r="50" fill="#ef4743" fillOpacity="0.1" stroke="#ef4743" strokeWidth="2"/>
          <text x="150" y="114" fill="currentColor" fontSize="12" fontWeight="bold" textAnchor="middle">Node A (Region 1)</text>

          <circle cx="450" cy="110" r="50" fill="#58a6ff" fillOpacity="0.1" stroke="#58a6ff" strokeWidth="2"/>
          <text x="450" y="114" fill="currentColor" fontSize="12" fontWeight="bold" textAnchor="middle">Node B (Region 2)</text>

          <path d="M210 110 H390" stroke="#ef4743" strokeWidth="3" markerEnd="url(#arrow-head)" strokeDasharray="5 5"/>
          <text x="300" y="95" fill="#ef4743" fontSize="10" fontWeight="bold" textAnchor="middle">NETWORK PARTITION</text>
          <path d="M290 85 L310 125" stroke="#ef4743" strokeWidth="3"/>
          <path d="M310 85 L290 125" stroke="#ef4743" strokeWidth="3"/>

          <defs>
            <marker id="arrow-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
            </marker>
          </defs>
        </svg>
      );
    }

    // Default diagram fallback placeholder
    return (
      <svg viewBox="0 0 600 200" className={`${baseClass} ${isDark ? "bg-zinc-950/40 text-white" : "bg-slate-100 text-black"}`} fill="none">
        <rect x="50" y="50" width="500" height="100" rx="15" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" fill="currentColor" fillOpacity="0.03"/>
        <text x="300" y="105" fill="currentColor" fontSize="13" fontWeight="bold" textAnchor="middle">System Design Flow: {id.toUpperCase()}</text>
      </svg>
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-slate-50 text-black"} transition-colors duration-300`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        
        {/* Header Section */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/10 p-2.5 text-cyan-400">
              <Cpu className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl flex items-center gap-2">
                System Design Prep Hub
              </h1>
              <p className="mt-1 text-xs opacity-70">
                Textbook explanations, timed practice quizzes, dynamic flowcharts, and notes manager.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Streak & Completion Bar */}
            <div className={`hidden sm:flex items-center gap-3 rounded-2xl border px-4 py-2 text-xs font-semibold ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
              <Award className="h-4 w-4 text-amber-500" />
              <span>Streak: <strong className="text-amber-500">5 Days</strong></span>
              <div className="w-20 bg-foreground/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${completionPercentage}%` }}/>
              </div>
              <span>{completionPercentage}% Complete</span>
            </div>

            <Link
              href="/placement-hub"
              className={`rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all ${isDark ? "border-white/20 bg-white/5 hover:bg-white/10" : "border-black/10 bg-white hover:bg-slate-100"}`}
            >
              Back to Hub
            </Link>
          </div>
        </header>

        {/* Tab Controls */}
        <nav className="flex flex-wrap gap-1 border-b border-foreground/10 pb-px mb-6">
          <button
            onClick={() => setActiveTab("syllabus")}
            className={`px-5 py-3 text-xs font-bold uppercase border-b-2 transition-all duration-200 ${activeTab === "syllabus" ? "border-cyan-400 text-cyan-400 font-extrabold" : "border-transparent text-foreground/50 hover:text-foreground"}`}
          >
            Curriculum Lectures
          </button>
          <button
            onClick={() => setActiveTab("cases")}
            className={`px-5 py-3 text-xs font-bold uppercase border-b-2 transition-all duration-200 ${activeTab === "cases" ? "border-cyan-400 text-cyan-400 font-extrabold" : "border-transparent text-foreground/50 hover:text-foreground"}`}
          >
            FAANG Case Studies
          </button>
          <button
            onClick={() => {
              setActiveTab("quiz");
              if (!mockTestActive) startMockTest();
            }}
            className={`px-5 py-3 text-xs font-bold uppercase border-b-2 transition-all duration-200 ${activeTab === "quiz" ? "border-cyan-400 text-cyan-400 font-extrabold" : "border-transparent text-foreground/50 hover:text-foreground"}`}
          >
            Mock Timed Test
          </button>
          <button
            onClick={() => setActiveTab("glossary")}
            className={`px-5 py-3 text-xs font-bold uppercase border-b-2 transition-all duration-200 ${activeTab === "glossary" ? "border-cyan-400 text-cyan-400 font-extrabold" : "border-transparent text-foreground/50 hover:text-foreground"}`}
          >
            Glossary & Search
          </button>
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={`px-5 py-3 text-xs font-bold uppercase border-b-2 transition-all duration-200 ${activeTab === "bookmarks" ? "border-cyan-400 text-cyan-400 font-extrabold" : "border-transparent text-foreground/50 hover:text-foreground"}`}
          >
            Saved Bookmarks
          </button>
        </nav>

        {/* WORKSPACE AREA */}
        <div className="grid grid-cols-1 gap-6">

          {/* TAB 1: CURRICULUM SYLLABUS (Left-Right Split view) */}
          {activeTab === "syllabus" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Left Sidebar: Lessons List */}
              <aside className={`lg:col-span-1 rounded-3xl border p-4 space-y-4 max-h-[80vh] overflow-y-auto ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
                <div className="pb-2 border-b border-foreground/15">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Chapters Course</h3>
                  <p className="text-[10px] text-foreground/60">{totalLessons} lessons total</p>
                </div>
                
                {MODULES.map((mod, mIdx) => (
                  <div key={mod.id} className="space-y-1">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-foreground/50 px-2 pt-2">{mod.title}</h4>
                    <div className="space-y-0.5">
                      {mod.lessons.map((les, lIdx) => {
                        const active = selectedModuleIdx === mIdx && selectedLessonIdx === lIdx;
                        const done = progressSet.has(les.id);
                        return (
                          <button
                            key={les.id}
                            onClick={() => {
                              setSelectedModuleIdx(mIdx);
                              setSelectedLessonIdx(lIdx);
                              setLessonTab("theory");
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                              active
                                ? "bg-cyan-400/10 text-cyan-400 font-bold border border-cyan-400/20"
                                : isDark
                                ? "hover:bg-white/5 text-white/70"
                                : "hover:bg-black/5 text-black/70"
                            }`}
                          >
                            <span className="truncate pr-2">{les.title}</span>
                            {done ? (
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-foreground/10 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </aside>

              {/* Right Content Frame */}
              <section className="lg:col-span-3 space-y-6">
                
                {/* Lesson Header Card */}
                <div className={`rounded-3xl border p-6 space-y-4 relative ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        activeLesson.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400" :
                        activeLesson.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {activeLesson.difficulty}
                      </span>
                      <span className="text-[10px] opacity-60 flex items-center gap-1 font-semibold">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        {activeLesson.readingTime} read
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleBookmark(activeLesson.id)}
                        className={`p-2 rounded-xl border transition-all ${
                          bookmarksSet.has(activeLesson.id)
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : isDark ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-slate-100"
                        }`}
                        title="Bookmark Lesson"
                      >
                        <Bookmark className="h-4.5 w-4.5 fill-current" />
                      </button>

                      <button
                        onClick={() => toggleProgress(activeLesson.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                          progressSet.has(activeLesson.id)
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : isDark ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-slate-100"
                        }`}
                      >
                        <CheckSquare className="h-4 w-4" />
                        {progressSet.has(activeLesson.id) ? "Completed" : "Mark Done"}
                      </button>
                    </div>
                  </div>

                  <h2 className="text-xl font-extrabold tracking-tight">{activeLesson.title}</h2>

                  {/* Learning Objectives box */}
                  <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2">Learning Objectives</h5>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs opacity-80 list-disc pl-4">
                      {activeLesson.objectives.map((obj, oIdx) => (
                        <li key={oIdx}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Inner Tab Controller */}
                  <div className="flex border-b border-foreground/10 pb-px mb-4">
                    <button
                      onClick={() => setLessonTab("theory")}
                      className={`pb-2 text-xs font-bold uppercase border-b-2 mr-6 transition ${lessonTab === "theory" ? "border-cyan-400 text-cyan-400" : "border-transparent text-foreground/50"}`}
                    >
                      Theory & Architecture
                    </button>
                    <button
                      onClick={() => setLessonTab("tradeoffs")}
                      className={`pb-2 text-xs font-bold uppercase border-b-2 mr-6 transition ${lessonTab === "tradeoffs" ? "border-cyan-400 text-cyan-400" : "border-transparent text-foreground/50"}`}
                    >
                      Trade-offs & Practices
                    </button>
                    <button
                      onClick={() => setLessonTab("questions")}
                      className={`pb-2 text-xs font-bold uppercase border-b-2 transition ${lessonTab === "questions" ? "border-cyan-400 text-cyan-400" : "border-transparent text-foreground/50"}`}
                    >
                      Interview Prep & Q&A
                    </button>
                  </div>

                  {/* TAB CONTENT SPACE */}
                  <div className="space-y-6">
                    {lessonTab === "theory" && (
                      <div className="space-y-6">
                        <div className="prose max-w-none text-sm leading-relaxed opacity-85">
                          {activeLesson.theory}
                        </div>

                        {/* Interactive diagram section */}
                        <div className={`rounded-3xl border p-4 flex flex-col items-center justify-center ${isDark ? "border-white/10 bg-black/40" : "border-black/5 bg-slate-50"}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-3">System Architecture Flow</span>
                          {renderDiagram(activeLesson.diagramId)}
                        </div>
                      </div>
                    )}

                    {lessonTab === "tradeoffs" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Advantages</h4>
                          <ul className="space-y-1.5 pl-4 list-disc text-xs opacity-80">
                            {activeLesson.advantages.map((adv, idx) => <li key={idx}>{adv}</li>)}
                          </ul>
                        </div>
                        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-5 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Disadvantages</h4>
                          <ul className="space-y-1.5 pl-4 list-disc text-xs opacity-80">
                            {activeLesson.disadvantages.map((dis, idx) => <li key={idx}>{dis}</li>)}
                          </ul>
                        </div>
                        <div className="md:col-span-2 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-5 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Scalability & Trade-offs</h4>
                          <p className="text-xs opacity-85 leading-relaxed">{activeLesson.tradeoffs}</p>
                        </div>
                        <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-5 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">Common Mistakes</h4>
                          <ul className="space-y-1.5 pl-4 list-disc text-xs opacity-80">
                            {activeLesson.mistakes.map((mis, idx) => <li key={idx}>{mis}</li>)}
                          </ul>
                        </div>
                        <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-5 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Best Practices</h4>
                          <ul className="space-y-1.5 pl-4 list-disc text-xs opacity-80">
                            {activeLesson.bestPractices.map((bp, idx) => <li key={idx}>{bp}</li>)}
                          </ul>
                        </div>
                      </div>
                    )}

                    {lessonTab === "questions" && (
                      <div className="space-y-4">
                        {activeLesson.interviewQuestions.map((q, idx) => (
                          <div key={idx} className={`rounded-2xl border p-5 space-y-2 ${isDark ? "border-white/5 bg-zinc-950/15" : "border-black/5 bg-slate-50"}`}>
                            <h4 className="text-xs font-extrabold text-cyan-400">Q: {q.q}</h4>
                            <p className="text-xs opacity-85 leading-relaxed"><strong className="text-amber-500">Suggested Answer:</strong> {q.a}</p>
                            <p className="text-[10px] opacity-60 italic mt-2"><strong className="text-foreground/70 uppercase not-italic tracking-wider font-bold">Interviewer Expectations:</strong> {q.expectations}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Previous / Next Lesson Footer buttons */}
                  <div className="flex items-center justify-between border-t border-foreground/10 pt-4 mt-6">
                    <button
                      onClick={handlePrev}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                        selectedLessonIdx === 0 && selectedModuleIdx === 0
                          ? "opacity-30 cursor-not-allowed border-transparent"
                          : isDark ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-slate-100"
                      }`}
                      disabled={selectedLessonIdx === 0 && selectedModuleIdx === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous Lesson
                    </button>
                    
                    <button
                      onClick={handleNext}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                        selectedModuleIdx === MODULES.length - 1 && selectedLessonIdx === MODULES[selectedModuleIdx].lessons.length - 1
                          ? "opacity-30 cursor-not-allowed border-transparent"
                          : isDark ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-slate-100"
                      }`}
                      disabled={selectedModuleIdx === MODULES.length - 1 && selectedLessonIdx === MODULES[selectedModuleIdx].lessons.length - 1}
                    >
                      Next Lesson
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Split Bottom: Notes Editor & Quick Lesson MCQ quiz */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                  
                  {/* Personal study notes editor */}
                  <div className={`rounded-3xl border p-6 space-y-4 ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Edit3 className="h-4 w-4" />
                        My Lesson Study Notes
                      </h4>
                      <button
                        onClick={saveNote}
                        disabled={isSavingNote}
                        className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1 bg-cyan-400/10 px-2.5 py-1 rounded-lg hover:bg-cyan-400/20 disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {isSavingNote ? "Saving..." : "Save Notes"}
                      </button>
                    </div>

                    <textarea
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      placeholder="Write your study logs, system key-takeaways or personal cheatsheets here..."
                      className={`w-full h-44 rounded-2xl border p-3 text-xs outline-none focus:ring-1 focus:ring-cyan-500 resize-none ${
                        isDark ? "border-white/10 bg-black/40 text-white" : "border-black/10 bg-white text-black"
                      }`}
                    />
                  </div>

                  {/* Immediate Lesson Practice Quiz */}
                  <div className={`rounded-3xl border p-6 space-y-4 ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Lesson Checkpoint MCQ</h4>
                    
                    {activeLesson.quiz.map((q, qIdx) => {
                      const revealed = lessonQuizRevealed[`${activeLesson.id}-${qIdx}`];
                      const selectedOpt = lessonQuizAnswers[`${activeLesson.id}-${qIdx}`];
                      
                      return (
                        <div key={qIdx} className="space-y-3">
                          <p className="text-xs font-semibold leading-relaxed">{q.q}</p>
                          <div className="grid grid-cols-1 gap-2">
                            {q.opts.map((opt, oIdx) => {
                              let btnClass = isDark ? "border-white/10 bg-white/5 hover:bg-white/10 text-white/80" : "border-black/10 bg-white hover:bg-slate-50 text-black/80";
                              if (revealed) {
                                if (oIdx === q.correct) {
                                  btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold";
                                } else if (selectedOpt === oIdx) {
                                  btnClass = "border-red-500 bg-red-500/10 text-red-400";
                                }
                              }

                              return (
                                <button
                                  key={oIdx}
                                  disabled={revealed}
                                  onClick={() => {
                                    setLessonQuizAnswers(prev => ({ ...prev, [`${activeLesson.id}-${qIdx}`]: oIdx }));
                                    setLessonQuizRevealed(prev => ({ ...prev, [`${activeLesson.id}-${qIdx}`]: true }));
                                  }}
                                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition ${btnClass}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {revealed && (
                            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/5 p-3 text-[11px] space-y-1">
                              <p className="font-bold text-cyan-400">Explanation:</p>
                              <p className="opacity-80 leading-relaxed">{q.exp}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </section>

            </div>
          )}

          {/* TAB 2: FAANG CASE STUDIES */}
          {activeTab === "cases" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start pb-12">
              
              {/* Left Sidebar: Case Studies selection */}
              <aside className={`lg:col-span-1 rounded-3xl border p-4 space-y-2 ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
                <div className="pb-2 border-b border-foreground/15">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">System Architectures</h3>
                  <p className="text-[10px] text-foreground/60">{CASE_STUDIES.length} FAANG cases</p>
                </div>
                {CASE_STUDIES.map((cs, idx) => (
                  <button
                    key={cs.id}
                    onClick={() => setSelectedCaseIdx(idx)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                      selectedCaseIdx === idx
                        ? "bg-cyan-400/10 text-cyan-400 font-bold border border-cyan-400/20"
                        : isDark
                        ? "hover:bg-white/5 text-white/70"
                        : "hover:bg-black/5 text-black/70"
                    }`}
                  >
                    {cs.title.split(" (")[0]}
                  </button>
                ))}
              </aside>

              {/* Right Content area */}
              <section className={`lg:col-span-3 rounded-3xl border p-6 space-y-6 ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{CASE_STUDIES[selectedCaseIdx].title}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded mt-2 inline-block">
                    Scale Constraint: {CASE_STUDIES[selectedCaseIdx].targetScale}
                  </span>
                </div>

                {/* Specs Split Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`rounded-2xl border p-4 ${isDark ? "border-white/5 bg-zinc-950/15" : "border-black/5 bg-slate-50"}`}>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">Functional Requirements</h5>
                    <ul className="space-y-1.5 text-xs opacity-80 list-disc pl-4">
                      {CASE_STUDIES[selectedCaseIdx].functionalSpecs.map((req, idx) => <li key={idx}>{req}</li>)}
                    </ul>
                  </div>
                  <div className={`rounded-2xl border p-4 ${isDark ? "border-white/5 bg-zinc-950/15" : "border-black/5 bg-slate-50"}`}>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">Non-Functional Goals</h5>
                    <ul className="space-y-1.5 text-xs opacity-80 list-disc pl-4">
                      {CASE_STUDIES[selectedCaseIdx].nonFunctionalSpecs.map((req, idx) => <li key={idx}>{req}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Capacity Estimator */}
                <div className={`rounded-2xl border p-4 ${isDark ? "border-white/5 bg-zinc-950/15" : "border-black/5 bg-slate-50"}`}>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">Capacity & Storage Estimation</h5>
                  <p className="text-xs opacity-85 leading-relaxed">{CASE_STUDIES[selectedCaseIdx].capacityEstimation}</p>
                </div>

                {/* Design Flow Diagram */}
                <div className={`rounded-3xl border p-4 flex flex-col items-center justify-center ${isDark ? "border-white/10 bg-black/40" : "border-black/5 bg-slate-100"}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-3">High-Level Topology</span>
                  {renderDiagram(CASE_STUDIES[selectedCaseIdx].diagramId)}
                </div>

                {/* Technical breakdowns */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400">High-Level Architecture</h5>
                    <p className="text-xs opacity-85 leading-relaxed">{CASE_STUDIES[selectedCaseIdx].highLevelDesign}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Low-Level Components</h5>
                    <p className="text-xs opacity-85 leading-relaxed">{CASE_STUDIES[selectedCaseIdx].lowLevelDesign}</p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Sample Database Schema</h5>
                    <pre className={`p-4 rounded-xl text-xs font-mono overflow-x-auto ${isDark ? "bg-zinc-950 text-emerald-400 border border-white/5" : "bg-slate-100 text-emerald-700 border border-black/5"}`}>
                      {CASE_STUDIES[selectedCaseIdx].databaseSchema}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Core REST API Endpoints</h5>
                    <div className="overflow-x-auto rounded-xl border border-foreground/10">
                      <table className="min-w-full text-xs text-left">
                        <thead className={`font-bold ${isDark ? "bg-zinc-900" : "bg-slate-100"}`}>
                          <tr>
                            <th className="p-3">Method</th>
                            <th className="p-3">Path</th>
                            <th className="p-3">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {CASE_STUDIES[selectedCaseIdx].apiEndpoints.map((api, idx) => (
                            <tr key={idx} className="border-t border-foreground/5">
                              <td className="p-3 font-mono font-bold text-amber-500">{api.method}</td>
                              <td className="p-3 font-mono font-semibold text-cyan-400">{api.path}</td>
                              <td className="p-3 opacity-80">{api.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Scalability Bottlenecks & Trade-offs</h5>
                    <p className="text-xs opacity-85 leading-relaxed">{CASE_STUDIES[selectedCaseIdx].tradeoffs}</p>
                  </div>
                </div>
              </section>

            </div>
          )}

          {/* TAB 3: TIMED MOCK TEST SIMULATOR */}
          {activeTab === "quiz" && (
            <div className="max-w-3xl mx-auto space-y-6 pb-12">
              
              {!mockTestActive ? (
                <div className={`rounded-3xl border p-8 text-center space-y-6 ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <BarChart2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">System Design Timed Practice</h3>
                    <p className="text-xs opacity-75 max-w-md mx-auto">
                      Simulate a live interviewer evaluation. Answer 5 randomized questions from across all modules under a strict 5-minute timer.
                    </p>
                  </div>
                  <button
                    onClick={startMockTest}
                    className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all ${
                      isDark ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"
                    }`}
                  >
                    Start Timed Quiz (5 Mins)
                  </button>
                </div>
              ) : (
                <div className={`rounded-3xl border p-6 space-y-6 ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
                  
                  {/* Timer & Progress Header */}
                  <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-cyan-400" />
                      <span className="text-xs font-bold font-mono">
                        Time Remaining: <strong className="text-cyan-400">{Math.floor(mockTimeRemaining / 60)}:{(mockTimeRemaining % 60).toString().padStart(2, '0')}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-400/10 text-cyan-400 px-2.5 py-0.5 rounded">
                      Question {mockActiveIdx + 1} of {mockQuestions.length}
                    </span>
                  </div>

                  {!mockSubmitted ? (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold leading-relaxed">
                        {mockQuestions[mockActiveIdx]?.q}
                      </p>

                      <div className="grid grid-cols-1 gap-2.5">
                        {mockQuestions[mockActiveIdx]?.opts.map((opt: string, oIdx: number) => {
                          const selected = mockAnswers[mockActiveIdx] === oIdx;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => setMockAnswers(prev => ({ ...prev, [mockActiveIdx]: oIdx }))}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition ${
                                selected
                                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                                  : isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-black/10 bg-white hover:bg-slate-50"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Navigation controls */}
                      <div className="flex items-center justify-between pt-4 border-t border-foreground/5">
                        <button
                          disabled={mockActiveIdx === 0}
                          onClick={() => setMockActiveIdx(prev => prev - 1)}
                          className="px-3 py-2 rounded-lg border border-foreground/10 text-xs font-bold disabled:opacity-40"
                        >
                          Prev
                        </button>
                        
                        {mockActiveIdx < mockQuestions.length - 1 ? (
                          <button
                            onClick={() => setMockActiveIdx(prev => prev + 1)}
                            className="px-3 py-2 rounded-lg border border-foreground/10 text-xs font-bold"
                          >
                            Next
                          </button>
                        ) : (
                          <button
                            onClick={() => setMockSubmitted(true)}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600"
                          >
                            Submit Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Mock test result dashboard
                    <div className="space-y-6">
                      <div className="text-center space-y-2 py-4">
                        <h4 className="text-lg font-bold">Quiz Results</h4>
                        <p className="text-xs opacity-75">
                          You scored:{" "}
                          <strong className="text-cyan-400 text-base">
                            {mockQuestions.reduce((acc, q, idx) => acc + (mockAnswers[idx] === q.correct ? 1 : 0), 0)}
                          </strong>{" "}
                          / {mockQuestions.length}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {mockQuestions.map((q, idx) => {
                          const correct = mockAnswers[idx] === q.correct;
                          return (
                            <div key={idx} className={`rounded-2xl border p-4 space-y-2 ${isDark ? "border-white/5 bg-zinc-950/15" : "border-black/5 bg-slate-50"}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-foreground/50 uppercase">{q.lessonTitle}</span>
                                {correct ? (
                                  <span className="text-emerald-400 text-xs font-bold">✓ Correct</span>
                                ) : (
                                  <span className="text-red-400 text-xs font-bold">✗ Incorrect</span>
                                )}
                              </div>
                              <p className="text-xs font-semibold leading-relaxed">{q.q}</p>
                              <p className="text-xs text-foreground/60"><strong className="text-emerald-400">Correct Choice:</strong> {q.opts[q.correct]}</p>
                              {!correct && (
                                <p className="text-xs text-foreground/60"><strong className="text-red-400">Your Choice:</strong> {mockAnswers[idx] !== undefined ? q.opts[mockAnswers[idx]] : "Not Answered"}</p>
                              )}
                              <p className="text-xs opacity-80 pt-2 border-t border-foreground/5 font-semibold text-cyan-400">Explanation: <span className="opacity-100 font-normal text-foreground">{q.exp}</span></p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-3 justify-center pt-4">
                        <button
                          onClick={startMockTest}
                          className="px-4 py-2.5 rounded-xl border border-foreground/10 text-xs font-bold hover:bg-foreground/5"
                        >
                          Retry Test
                        </button>
                        <button
                          onClick={() => setMockTestActive(false)}
                          className="px-4 py-2.5 rounded-xl bg-cyan-400 text-black text-xs font-bold hover:bg-cyan-300"
                        >
                          Finish Review
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* TAB 4: GLOSSARY & SEARCH */}
          {activeTab === "glossary" && (
            <div className="max-w-4xl mx-auto space-y-6 pb-12">
              
              {/* Search and filter bar */}
              <div className={`rounded-3xl border p-6 space-y-4 ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
                <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Global Search & Dictionary</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40" />
                    <input
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      placeholder="Search within textbook lessons..."
                      className={`w-full rounded-2xl border py-2.5 pl-10 pr-4 text-xs outline-none ${
                        isDark ? "border-white/10 bg-black/40 text-white" : "border-black/10 bg-white text-black"
                      }`}
                    />
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40" />
                    <input
                      value={glossarySearch}
                      onChange={(e) => setGlossarySearch(e.target.value)}
                      placeholder="Filter glossary technical terms..."
                      className={`w-full rounded-2xl border py-2.5 pl-10 pr-4 text-xs outline-none ${
                        isDark ? "border-white/10 bg-black/40 text-white" : "border-black/10 bg-white text-black"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Display Search Matches if search is filled */}
              {globalSearch.trim() !== "" && (
                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider opacity-60">Lesson Content Matches ({filteredLessons.length})</h5>
                  {filteredLessons.length === 0 ? (
                    <div className="text-center p-6 border rounded-2xl text-xs opacity-50">No matches found in theory text.</div>
                  ) : (
                    filteredLessons.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedModuleIdx(item.modIdx);
                          setSelectedLessonIdx(item.lesIdx);
                          setActiveTab("syllabus");
                          setLessonTab("theory");
                        }}
                        className={`w-full text-left rounded-2xl border p-4 space-y-2 hover:border-cyan-400/50 transition-all ${
                          isDark ? "border-white/5 bg-zinc-950/15" : "border-black/5 bg-white shadow-xs"
                        }`}
                      >
                        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">{item.modTitle}</span>
                        <h4 className="text-xs font-bold">{item.lesson.title}</h4>
                        <p className="text-xs opacity-75 line-clamp-2">{item.lesson.theory}</p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Glossary list */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider opacity-60">System Design Technical Terms</h5>
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredGlossary.map((item, idx) => (
                    <div key={idx} className={`rounded-2xl border p-5 space-y-2 ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
                      <h4 className="text-sm font-bold text-cyan-400">{item.term}</h4>
                      <p className="text-xs opacity-80 font-semibold">{item.definition}</p>
                      <p className="text-xs opacity-60 leading-relaxed">{item.explanation}</p>
                      <div className="pt-2 border-t border-foreground/5 text-[11px] opacity-75 italic text-amber-500">
                        <strong>Example:</strong> {item.example}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: SAVED BOOKMARKS */}
          {activeTab === "bookmarks" && (
            <div className="max-w-3xl mx-auto space-y-4 pb-12">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Bookmarked System Lessons</h4>
              
              {bookmarksSet.size === 0 ? (
                <div className={`rounded-3xl border p-8 text-center space-y-4 ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
                  <BookMarked className="mx-auto h-8 w-8 text-foreground/40" />
                  <p className="text-xs opacity-65">You haven't bookmarked any lessons yet. Bookmark lessons to keep them handy for fast review!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {MODULES.map(mod =>
                    mod.lessons
                      .filter(les => bookmarksSet.has(les.id))
                      .map(les => (
                        <div
                          key={les.id}
                          className={`rounded-2xl border p-5 flex items-center justify-between gap-4 ${
                            isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"
                          }`}
                        >
                          <div className="space-y-1">
                            <h5 className="text-sm font-semibold">{les.title}</h5>
                            <span className="text-[10px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded uppercase font-bold">{les.difficulty}</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              const mIdx = MODULES.findIndex(m => m.lessons.some(l => l.id === les.id));
                              const lIdx = MODULES[mIdx]?.lessons.findIndex(l => l.id === les.id);
                              if (mIdx !== -1 && lIdx !== -1) {
                                setSelectedModuleIdx(mIdx);
                                setSelectedLessonIdx(lIdx);
                                setActiveTab("syllabus");
                                setLessonTab("theory");
                              }
                            }}
                            className="text-xs font-bold text-cyan-400 hover:underline shrink-0"
                          >
                            Open Lesson →
                          </button>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
