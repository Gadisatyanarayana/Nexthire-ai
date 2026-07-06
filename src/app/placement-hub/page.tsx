"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HubItem = {
  title: string;
  href: string;
  subtitle: string;
  bullets: string[];
};

export default function PlacementHubPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const modules = useMemo<HubItem[]>(
    () => [
      {
        title: "My Resume Workspace",
        href: "/my-resume",
        subtitle: "Upload, track ATS score, and prepare your action plan.",
        bullets: [
          "Quick ATS scoring with clear next actions",
          "Basic job-match check before applying",
          "One workspace to monitor readiness",
        ],
      },
      {
        title: "Resume Analyzer",
        href: "/resume-analyzer",
        subtitle: "Find skill gaps, missing keywords, and practical improvements.",
        bullets: [
          "Skill gaps and missing keywords by role",
          "Before/after bullet improvement section",
          "Interview-readiness and priority actions",
        ],
      },
      {
        title: "Resume Builder",
        href: "/resume-builder",
        subtitle: "Build ATS-friendly resume with templates and guided sections.",
        bullets: [
          "Template presets: minimal, modern, ATS",
          "ATS-friendly mode toggle",
          "Auto-fill + AI improvement on each section",
        ],
      },
      {
        title: "Coding Platform",
        href: "/coding",
        subtitle: "Practice DSA with problem list, editor, run, and submit.",
        bullets: [
          "Filter by difficulty, topic, acceptance",
          "Programiz-style output console",
          "Monaco editor + self-hosted sandbox execution",
        ],
      },
      {
        title: "Contest Center",
        href: "/contests",
        subtitle: "Join live OA rounds or private contests using secure join keys.",
        bullets: [
          "Public and private rounds",
          "Secret contest key onboarding",
          "Admin-ready contest workflow",
        ],
      },
      {
        title: "Live Voice AI Assistant",
        href: "/voice-interviewer",
        subtitle: "Talk naturally and get instant spoken answers for interview, coding, or general questions.",
        bullets: [
          "Ask anything by voice in real time",
          "Smart duplicate filter and mic/speaker loop control",
          "Fast natural responses with live speak-back",
        ],
      },
      {
        title: "Aptitude Preparation",
        href: "/aptitude",
        subtitle: "Timed practice tests and pattern-wise quantitative math questions.",
        bullets: [
          "Pattern-wise and company-specific targets",
          "Interactive quiz runner with step explanations",
          "Score reports and speed stats",
        ],
      },
      {
        title: "Reasoning Practice",
        href: "/reasoning",
        subtitle: "Verbal, logical, and analytical reasoning puzzles for assessments.",
        bullets: [
          "Timed test metrics for speed audit",
          "Blood relations, syllogisms, and seating puzzles",
          "Detailed logic walkthrough steps",
        ],
      },
      {
        title: "SQL Practice Playground",
        href: "/sql-practice",
        subtitle: "Write queries against mock database schemas inside Monaco Editor.",
        bullets: [
          "Dialect support: MySQL, PostgreSQL, MongoDB",
          "Live Database Schema Viewer",
          "Verification against expected output sheets",
        ],
      },
      {
        title: "System Design Workspace",
        href: "/system-design",
        subtitle: "Learn scaling, CAP theorem, load balancing, and read detailed case studies.",
        bullets: [
          "Embedded SVG architecture flowcharts",
          "Real-world case studies (TinyURL, Youtube)",
          "Interview cheatsheets and pro tips",
        ],
      },
    ],
    []
  );

  const placementTimeline = useMemo(
    () => [
      {
        phase: "Week 1",
        title: "Build Resume Foundation",
        tasks: [
          "Complete Resume Builder required fields",
          "Turn ATS-friendly mode on",
          "Save first draft and cloud-sync upload",
        ],
      },
      {
        phase: "Week 2",
        title: "Analyze and Improve",
        tasks: [
          "Run ATS analysis and job match",
          "Fix skill gaps and missing keywords",
          "Use before/after bullet improvements",
        ],
      },
      {
        phase: "Week 3",
        title: "Role-Specific Optimization",
        tasks: [
          "Create one resume variant per target role",
          "Target match score above 70%",
          "Prepare recruiter notes checklist",
        ],
      },
      {
        phase: "Weekly",
        title: "Coding + Tracking",
        tasks: [
          "Practice coding questions in platform",
          "Submit solutions and review outcomes",
          "Track progress in dashboard",
        ],
      },
    ],
    []
  );

  const companyTracks = useMemo(
    () => [
      {
        company: "Google",
        profile: "Strong algorithms + depth in graphs/DP.",
        targets: [
          { section: "Graphs", count: 25, href: "/coding?section=graphs" },
          { section: "Dynamic Programming", count: 30, href: "/coding?section=dynamic-programming" },
          { section: "Binary Search", count: 15, href: "/coding?section=binary-search" },
        ],
      },
      {
        company: "Amazon",
        profile: "Execution speed + robust edge-case handling.",
        targets: [
          { section: "Arrays & Hashing", count: 25, href: "/coding?section=arrays-hashing" },
          { section: "Trees", count: 20, href: "/coding?section=trees" },
          { section: "Heaps / Priority Queue", count: 15, href: "/coding?section=heaps-priority-queue" },
        ],
      },
      {
        company: "TCS",
        profile: "Core DSA consistency + coding round confidence.",
        targets: [
          { section: "Arrays & Hashing", count: 20, href: "/coding?section=arrays-hashing" },
          { section: "Strings", count: 20, href: "/coding?section=strings" },
          { section: "Recursion", count: 15, href: "/coding?section=recursion" },
        ],
      },
      {
        company: "Infosys",
        profile: "Problem-solving basics + reliable implementation.",
        targets: [
          { section: "Two Pointers / Sliding Window", count: 15, href: "/coding?section=two-pointers-sliding-window" },
          { section: "Stacks / Queues", count: 15, href: "/coding?section=stack-queue" },
          { section: "Math", count: 12, href: "/coding?section=math" },
        ],
      },
    ],
    []
  );

  return (
    <main className={`min-h-screen px-6 pb-10 pt-4 ${isDark ? "bg-black text-white" : "bg-slate-50 text-black"}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
          <p className={`mb-2 text-xs uppercase tracking-[0.16em] ${isDark ? "text-white/65" : "text-black/65"}`}>Student Placement Hub</p>
          <h1 className="text-3xl font-semibold">Everything You Need For Placement Applications In One Place</h1>
          <p className={`mt-3 text-sm md:text-base ${isDark ? "text-white/75" : "text-black/70"}`}>
            Use this flow every week: Build resume, analyze gaps, improve bullets, check role match, and practice coding rounds.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {modules.map((item) => (
            <article key={item.title} className={`rounded-2xl border p-5 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className={`mt-2 text-sm ${isDark ? "text-white/75" : "text-black/70"}`}>{item.subtitle}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {item.bullets.map((point) => (
                  <li key={point} className={isDark ? "text-white/80" : "text-black/75"}>{point}</li>
                ))}
              </ul>
              <Link
                href={item.href}
                className={`mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isDark ? "bg-white text-black hover:bg-gray-100" : "bg-black text-white hover:bg-gray-900"
                }`}
              >
                Open {item.title}
              </Link>
            </article>
          ))}
        </section>

        <section className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
          <h2 className="text-xl font-semibold">Recommended Student Workflow</h2>
          <ol className={`mt-3 space-y-2 text-sm ${isDark ? "text-white/80" : "text-black/75"}`}>
            <li>1. Build or update resume in Resume Builder with ATS mode on.</li>
            <li>2. Run Resume Analyzer to find skill gaps and missing role keywords.</li>
            <li>3. Apply improvements and verify ATS and match scores.</li>
            <li>4. Use Coding Platform daily for online assessment preparation.</li>
            <li>5. Use Live Voice AI Assistant for real-time speaking practice and question solving.</li>
            <li>6. Track progress in Dashboard and improve weekly.</li>
          </ol>
        </section>

        <section className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
          <h2 className="text-xl font-semibold">Daily Problem Learning Loop (45-60 min)</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              {
                title: "Understand",
                detail: "Read one problem deeply: constraints, pattern, and edge cases.",
                href: "/coding",
                cta: "Open Coding",
              },
              {
                title: "Solve",
                detail: "Implement brute-force first, then optimize and test carefully.",
                href: "/editor",
                cta: "Open Editor",
              },
              {
                title: "Reflect",
                detail: "Ask AI coach for approach review, mistakes, and better alternatives.",
                href: "/chatbot",
                cta: "Open AI Coach",
              },
              {
                title: "Track",
                detail: "Measure section completion and pick weakest section for tomorrow.",
                href: "/dashboard",
                cta: "Open Dashboard",
              },
            ].map((step) => (
              <article key={step.title} className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-black/20" : "border-black/10 bg-black/5"}`}>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className={`mt-2 text-sm ${isDark ? "text-white/75" : "text-black/70"}`}>{step.detail}</p>
                <Link
                  href={step.href}
                  className={`mt-3 inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${isDark ? "bg-white text-black hover:bg-gray-100" : "bg-black text-white hover:bg-gray-900"}`}
                >
                  {step.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
          <h2 className="text-xl font-semibold">Placement Timeline</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {placementTimeline.map((item) => (
              <article key={item.phase} className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-black/20" : "border-black/10 bg-black/5"}`}>
                <p className={`text-xs uppercase tracking-[0.14em] ${isDark ? "text-white/60" : "text-black/60"}`}>{item.phase}</p>
                <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                <ul className={`mt-2 space-y-1.5 text-sm ${isDark ? "text-white/80" : "text-black/75"}`}>
                  {item.tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
          <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-xl font-semibold">Company-Specific Placement Tracks</h2>
            <Link
              href="/dashboard"
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${isDark ? "bg-white text-black hover:bg-gray-100" : "bg-black text-white hover:bg-gray-900"}`}
            >
              Match With My Progress
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {companyTracks.map((track) => (
              <article key={track.company} className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-black/20" : "border-black/10 bg-black/5"}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{track.company}</h3>
                  <Link
                    href="/coding"
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${isDark ? "bg-white text-black hover:bg-gray-100" : "bg-black text-white hover:bg-gray-900"}`}
                  >
                    Start Track
                  </Link>
                </div>
                <p className={`mt-1 text-sm ${isDark ? "text-white/75" : "text-black/70"}`}>{track.profile}</p>
                <div className="mt-3 space-y-2">
                  {track.targets.map((target) => (
                    <Link
                      key={`${track.company}-${target.section}`}
                      href={target.href}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition ${isDark ? "border-white/10 bg-black/30 hover:bg-black/40" : "border-black/10 bg-white hover:bg-black/5"}`}
                    >
                      <span>{target.section}</span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${isDark ? "bg-white/10 text-white" : "bg-black/10 text-black"}`}>
                        Target {target.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
