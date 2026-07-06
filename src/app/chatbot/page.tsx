"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Calendar, CheckSquare, Compass, ListTodo, Award, Sparkles,
  Bell, BellOff, Trash2, Plus, MessageSquare, ChevronRight,
  TrendingUp, CheckCircle, RefreshCw, Send
} from "lucide-react";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  category: "dsa" | "aptitude" | "sql" | "general";
  dueDate: string;
};

type Milestone = {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_MILESTONES: Milestone[] = [
  { id: "1", title: "DSA Fundamentals", description: "Master Arrays, Hashing, Two Pointers, and Binary Search", duration: "Week 1-2", completed: true },
  { id: "2", title: "Advanced Data Structures", description: "Trees, Graphs, Heap, and Dynamic Programming", duration: "Week 3-4", completed: false },
  { id: "3", title: "Database & SQL Practice", description: "Joins, Aggregations, Indexes, and normalization exercises", duration: "Week 5", completed: false },
  { id: "4", title: "Aptitude & Core CS", description: "Verbal/Logical reasoning, Operating Systems, Networking", duration: "Week 6", completed: false },
  { id: "5", title: "Mock Interviews & System Design", description: "Behavioral practice, scalable design, and speed trials", duration: "Week 7-8", completed: false },
];

const MOTIVATIONS = [
  "Consistency is key. Coding just 30 minutes a day adds up to 180 hours in a year!",
  "Make today the day you solve that one tough problem. Growth lies outside the comfort zone.",
  "Your placement is the result of daily habits, not last-minute cramming. Keep coding!",
  "Every compile error is just a step closer to clean code. Don't give up!",
  "LeetCode medium questions are the sweet spot for major product company interviews.",
];

export default function ProductivityAssistantPage() {
  const [isDark, setIsDark] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<Task["category"]>("dsa");
  const [milestones, setMilestones] = useState<Milestone[]>(INITIAL_MILESTONES);
  const [motivationIdx, setMotivationIdx] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<"planner" | "roadmap" | "coach">("planner");

  // Coach Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI Placement & Productivity Coach. I can generate a personalized study roadmap, construct a daily schedule, or suggest revisions. How can I help you excel today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync Theme
  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Load Persisted Data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTasks = localStorage.getItem("nexthire:tasks");
      if (savedTasks) {
        try {
          setTasks(JSON.parse(savedTasks) as Task[]);
        } catch {
          // fallback
        }
      } else {
        // Default tasks
        const defaultTasks: Task[] = [
          { id: "t1", text: "Complete 2 Binary Search problems", completed: false, category: "dsa", dueDate: new Date().toISOString().split("T")[0] },
          { id: "t2", text: "Revise SQL joins and index schemas", completed: true, category: "sql", dueDate: new Date().toISOString().split("T")[0] },
          { id: "t3", text: "Do a 15-minute logical reasoning test", completed: false, category: "aptitude", dueDate: new Date().toISOString().split("T")[0] },
        ];
        setTasks(defaultTasks);
        localStorage.setItem("nexthire:tasks", JSON.stringify(defaultTasks));
      }

      const savedMilestones = localStorage.getItem("nexthire:milestones");
      if (savedMilestones) {
        try {
          setMilestones(JSON.parse(savedMilestones) as Milestone[]);
        } catch {
          // fallback
        }
      }

      // Check Notification Permission
      if ("Notification" in window) {
        setNotificationsEnabled(Notification.permission === "granted");
      }
    }
  }, []);

  // Save Tasks
  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem("nexthire:tasks", JSON.stringify(updated));
  };

  // Save Milestones
  const saveMilestones = (updated: Milestone[]) => {
    setMilestones(updated);
    localStorage.setItem("nexthire:milestones", JSON.stringify(updated));
  };

  // Add Task
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      category: newTaskCategory,
      dueDate: new Date().toISOString().split("T")[0],
    };

    const updated = [...tasks, newTask];
    saveTasks(updated);
    setNewTaskText("");

    // Trigger Notification
    triggerLocalNotification("Task Added", `"${newTask.text}" has been successfully scheduled!`);
  };

  // Toggle Task
  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasks(updated);
  };

  // Delete Task
  const deleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
  };

  // Toggle Milestone
  const toggleMilestone = (id: string) => {
    const updated = milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m));
    saveMilestones(updated);
  };

  // Notification Setup
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      triggerLocalNotification("Notifications Enabled", "You will now receive study prompts and revision alarms!");
    } else {
      setNotificationsEnabled(false);
    }
  };

  const triggerLocalNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
      });
    }
  };

  // Coach AI submit
  const sendCoachMessage = async (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: query };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
        }),
      });

      if (!response.ok) throw new Error("Connection failed");
      const data = (await response.json()) as { message?: string };
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message || "I am unable to answer this query. Let's try again." },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I encountered an error connecting to the AI Coach engine. Please verify connection and retry." },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const totalProgress = Math.round(
    (milestones.filter((m) => m.completed).length / milestones.length) * 100
  );

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-slate-50 text-black"} transition-colors duration-300`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        
        {/* Navigation & Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl flex items-center gap-2">
              <Compass className="h-8 w-8 text-cyan-400 animate-pulse" />
              Global Productivity Assistant
            </h1>
            <p className={`mt-1.5 text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
              Schedule your day, audit placement roadmaps, track revision status, and work with your AI Study Coach.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${isDark ? "border-white/20 bg-white/5 hover:bg-white/10" : "border-black/10 bg-white hover:bg-slate-100"}`}
            >
              My Dashboard
            </Link>
            <button
              onClick={requestNotificationPermission}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition ${notificationsEnabled ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-amber-500/25 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"}`}
            >
              {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {notificationsEnabled ? "Reminders On" : "Enable Reminders"}
            </button>
          </div>
        </header>

        {/* Dynamic Alert Banner: Motivations */}
        <section className={`mb-8 flex items-center justify-between gap-4 rounded-2xl border p-4 backdrop-blur-md ${isDark ? "border-cyan-500/20 bg-cyan-950/15 text-cyan-100" : "border-cyan-500/15 bg-cyan-50 text-cyan-950"}`}>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="text-sm font-medium italic">"{MOTIVATIONS[motivationIdx]}"</p>
          </div>
          <button
            onClick={() => setMotivationIdx((prev) => (prev + 1) % MOTIVATIONS.length)}
            title="Refresh Motivation"
            className="rounded-full p-1.5 hover:bg-cyan-500/10 transition"
          >
            <RefreshCw className="h-4 w-4 text-cyan-400" />
          </button>
        </section>

        {/* Navigation Tabs */}
        <div className="mb-6 flex border-b border-foreground/10">
          <button
            onClick={() => setActiveTab("planner")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition ${activeTab === "planner" ? "border-cyan-400 text-cyan-400" : "border-transparent text-foreground/60 hover:text-foreground"}`}
          >
            <ListTodo className="h-4 w-4" />
            Daily Planner & Tasks
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition ${activeTab === "roadmap" ? "border-cyan-400 text-cyan-400" : "border-transparent text-foreground/60 hover:text-foreground"}`}
          >
            <Compass className="h-4 w-4" />
            Placement Roadmap
          </button>
          <button
            onClick={() => setActiveTab("coach")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition ${activeTab === "coach" ? "border-cyan-400 text-cyan-400" : "border-transparent text-foreground/60 hover:text-foreground"}`}
          >
            <MessageSquare className="h-4 w-4" />
            AI Placement Coach
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Tab: Planner */}
            {activeTab === "planner" && (
              <div className={`rounded-3xl border p-6 ${isDark ? "border-white/10 bg-zinc-950/40" : "border-black/5 bg-white shadow-sm"}`}>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-cyan-400" />
                    Daily Agenda
                  </h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${isDark ? "bg-white/5 text-white/70" : "bg-black/5 text-black/70"}`}>
                    {tasks.filter((t) => !t.completed).length} pending tasks
                  </span>
                </div>

                {/* Task Form */}
                <form onSubmit={addTask} className="mb-6 flex flex-wrap gap-2">
                  <input
                    type="text"
                    required
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add a daily goal... (e.g. Solve 2 Stack questions)"
                    className={`flex-1 min-w-[200px] rounded-xl border px-4 py-2 text-sm outline-none transition ${isDark ? "border-white/10 bg-black text-white focus:border-cyan-400" : "border-black/10 bg-slate-50 text-black focus:border-cyan-500"}`}
                  />
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as Task["category"])}
                    className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/10 bg-black text-white" : "border-black/10 bg-slate-50 text-black"}`}
                  >
                    <option value="dsa">DSA</option>
                    <option value="aptitude">Aptitude</option>
                    <option value="sql">SQL Practice</option>
                    <option value="general">General</option>
                  </select>
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-black hover:bg-cyan-400 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
                  </button>
                </form>

                {/* Task List */}
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-foreground/50 text-sm">
                      Your planner is empty! Add tasks to map out your day.
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between rounded-xl border p-3.5 transition-all ${task.completed ? "opacity-60 bg-foreground/5" : ""} ${isDark ? "border-white/5 bg-zinc-950/20" : "border-black/5 bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className={`rounded-md p-1 border hover:scale-105 transition ${task.completed ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-foreground/20 text-transparent"}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <div>
                            <p className={`text-sm font-medium ${task.completed ? "line-through text-foreground/55" : "text-foreground"}`}>
                              {task.text}
                            </p>
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                              {task.category}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="text-foreground/40 hover:text-red-500 p-1.5 transition rounded-lg hover:bg-foreground/5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Roadmap */}
            {activeTab === "roadmap" && (
              <div className={`rounded-3xl border p-6 ${isDark ? "border-white/10 bg-zinc-950/40" : "border-black/5 bg-white shadow-sm"}`}>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Compass className="h-5 w-5 text-cyan-400" />
                      Placement Milestones
                    </h2>
                    <p className={`mt-1 text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>
                      Follow this timeline to structure your preparation over the next 8 weeks.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Award className="h-5 w-5 text-amber-400" />
                    <span className="text-sm font-bold">{totalProgress}% Completed</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-foreground/10 rounded-full h-2 mb-8 overflow-hidden">
                  <div className="bg-cyan-400 h-2 rounded-full transition-all duration-500" style={{ width: `${totalProgress}%` }} />
                </div>

                {/* Roadmap Timeline */}
                <div className="relative border-l border-foreground/10 pl-6 space-y-6">
                  {milestones.map((m) => (
                    <div key={m.id} className="relative group">
                      {/* Timeline dot */}
                      <button
                        type="button"
                        onClick={() => toggleMilestone(m.id)}
                        className={`absolute -left-[35px] top-1 h-5.5 w-5.5 rounded-full border-2 flex items-center justify-center transition-all ${m.completed ? "bg-cyan-400 border-cyan-400 text-black" : "bg-black border-foreground/30 text-transparent hover:border-cyan-400"}`}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>

                      <div className={`rounded-2xl border p-4 transition ${m.completed ? "opacity-75" : ""} ${isDark ? "border-white/5 bg-zinc-950/20" : "border-black/5 bg-slate-50"}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">
                            {m.duration}
                          </span>
                          {m.completed && <span className="text-xs text-emerald-400 font-semibold">Done</span>}
                        </div>
                        <h4 className="text-sm font-bold mt-2 text-foreground">{m.title}</h4>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-white/60" : "text-black/60"}`}>
                          {m.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Coach */}
            {activeTab === "coach" && (
              <div className={`rounded-3xl border flex flex-col h-[520px] ${isDark ? "border-white/10 bg-zinc-950/40" : "border-black/5 bg-white shadow-sm"}`}>
                <div className="border-b border-foreground/10 px-6 py-4 flex items-center gap-2 flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-sm">AI Placement Coach</h3>
                    <p className={`text-[10px] ${isDark ? "text-white/60" : "text-black/60"}`}>Ask questions to build schedules or map priorities</p>
                  </div>
                </div>

                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={`chat-${idx}`}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-cyan-500 text-black font-medium" : isDark ? "bg-white/5 border border-white/10 text-white" : "bg-slate-100 text-black"}`}
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className={`rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                        <span className="spinner" />
                        AI is compiling strategy…
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat suggestions */}
                <div className="px-6 py-2 flex flex-wrap gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => sendCoachMessage("Construct a daily 3-hour study plan for DSA recursion and trees.")}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-lg border ${isDark ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10" : "border-black/10 bg-slate-50 text-black hover:bg-slate-100"}`}
                  >
                    DSA Study Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => sendCoachMessage("What SQL topics are most common in product company technical rounds?")}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-lg border ${isDark ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10" : "border-black/10 bg-slate-50 text-black hover:bg-slate-100"}`}
                  >
                    SQL Interview Focus
                  </button>
                  <button
                    type="button"
                    onClick={() => sendCoachMessage("Give me a motivation summary and priority list for arrays and search.")}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-lg border ${isDark ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10" : "border-black/10 bg-slate-50 text-black hover:bg-slate-100"}`}
                  >
                    Motivation & Priority
                  </button>
                </div>

                {/* Chat Form */}
                <div className="p-4 border-t border-foreground/10 flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendCoachMessage()}
                      placeholder="Ask the AI Coach... (e.g. How to prepare for DP in 5 days?)"
                      className={`flex-1 rounded-xl border px-4 py-2 text-sm outline-none transition ${isDark ? "border-white/10 bg-black text-white focus:border-cyan-400" : "border-black/10 bg-slate-50 text-black focus:border-cyan-500"}`}
                    />
                    <button
                      type="button"
                      onClick={() => sendCoachMessage()}
                      disabled={chatLoading}
                      className="rounded-xl bg-cyan-500 text-black p-2.5 hover:bg-cyan-400 transition"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar Widget Column */}
          <div className="space-y-8">
            
            {/* Widget: Calendar Integration */}
            <div className={`rounded-3xl border p-5 ${isDark ? "border-white/10 bg-zinc-950/40" : "border-black/5 bg-white shadow-sm"}`}>
              <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-cyan-400" />
                Study Calendar
              </h3>
              
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-foreground/50 mb-2">
                <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {/* Visual Representation of days */}
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const isActive = day === 2 || day === 4 || day === 7 || day === 15 || day === 21;
                  const isToday = day === new Date().getDate();
                  
                  return (
                    <div
                      key={`day-${day}`}
                      className={`aspect-square flex items-center justify-center rounded-lg font-medium transition ${isToday ? "bg-cyan-500 text-black" : isActive ? "bg-cyan-400/25 border border-cyan-400/30 text-cyan-300" : "hover:bg-foreground/5 text-foreground/80"}`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 flex items-center justify-between text-[10px] text-foreground/60 border-t border-foreground/10 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400/20 border border-cyan-400/30" />
                  <span>Active Coding Day</span>
                </div>
              </div>
            </div>

            {/* Widget: Revision Planner */}
            <div className={`rounded-3xl border p-5 ${isDark ? "border-white/10 bg-zinc-950/40" : "border-black/5 bg-white shadow-sm"}`}>
              <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-cyan-400" />
                Revision Triggers
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 text-xs">
                  <div>
                    <h5 className="font-semibold text-foreground">Dynamic Programming</h5>
                    <p className="text-[10px] text-foreground/50">Last solved: 6 days ago</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Due to Revise</span>
                </div>
                <div className="w-full bg-foreground/10 rounded-full h-1">
                  <div className="bg-amber-500 h-1 rounded-full" style={{ width: "35%" }} />
                </div>

                <div className="flex items-start justify-between gap-3 text-xs pt-2">
                  <div>
                    <h5 className="font-semibold text-foreground">Binary Trees & Traversals</h5>
                    <p className="text-[10px] text-foreground/50">Last solved: 2 days ago</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Secure</span>
                </div>
                <div className="w-full bg-foreground/10 rounded-full h-1">
                  <div className="bg-emerald-400 h-1 rounded-full" style={{ width: "85%" }} />
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
