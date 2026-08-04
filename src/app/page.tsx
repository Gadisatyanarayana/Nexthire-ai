"use client";

import Link from "next/link";
import { SolarSystem } from "@/components/landing/SolarSystem";
import { LandingFooter } from "@/components/landing/Footer";
import { 
  Code2, 
  Mic, 
  Calculator, 
  Server, 
  Database, 
  Building2, 
  BarChart3, 
  Sparkles, 
  ChevronDown, 
  ArrowRight,
  Zap,
  ShieldCheck,
  Award
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#030308] text-foreground relative flex flex-col overflow-x-hidden">
      
      {/* ── 1. SOLAR SYSTEM HERO SECTION (FULL SCREEN 100VH) ── */}
      <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden border-b border-white/10">
        
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] bg-gradient-to-tr from-cyan-500/15 via-purple-500/15 to-transparent blur-[140px] opacity-40 pointer-events-none -z-10 rounded-full" />

        {/* 3D Solar System Universe */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <SolarSystem />
        </div>

        {/* Hero Text Overlay Header */}
        <div className="relative z-20 pt-28 px-4 text-center max-w-4xl mx-auto flex flex-col items-center pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Software Engineering Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight mb-4 drop-shadow-md">
            Master Coding, AI Interviews & Aptitude in One <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">Unified Galaxy</span>
          </h1>

          <p className="text-sm md:text-lg text-zinc-300 max-w-2xl leading-relaxed mb-8">
            Sub-second LeetCode-style code execution, real-time AI Voice interviews, complete quantitative aptitude modules, and company-wise placement papers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/coding"
              aria-label="Start Coding Now"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-xl hover:scale-105"
            >
              <Code2 className="w-4 h-4" />
              <span>Start Coding Now</span>
            </Link>

            <Link
              href="/placement-hub"
              aria-label="Explore Placement Hub"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-sm transition-all backdrop-blur-md hover:scale-105"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Explore Placement Hub</span>
            </Link>
          </div>
        </div>

        {/* Scroll Down Prompt Indicator */}
        <div className="relative z-20 pb-8 flex flex-col items-center justify-center pointer-events-auto">
          <a
            href="#features"
            aria-label="Scroll Down to Features"
            className="flex flex-col items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors group"
          >
            <span className="text-xs font-semibold uppercase tracking-widest group-hover:tracking-widest transition-all">
              Scroll Down to Explore
            </span>
            <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900/80 flex items-center justify-center group-hover:border-emerald-500 transition-colors animate-bounce">
              <ChevronDown className="w-4 h-4" />
            </div>
          </a>
        </div>
      </section>


      {/* ── 2. FEATURE SHOWCASE GRID SECTION ── */}
      <section id="features" className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need to Crack Top Tech Roles
          </h2>
          <p className="text-zinc-400 text-sm md:text-base">
            Built for students and software engineers to practice, evaluate, and land offers with 100% accuracy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Coding Workspace */}
          <div className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                LeetCode-Speed Coding Judge
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Sub-second code execution for C++, Java, Python 3, and JavaScript. Real-time test case ticker and percentiles against platform submissions.
              </p>
            </div>
            <Link href="/coding" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300">
              Open Coding Workspace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: AI Voice Interviewer */}
          <div className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-purple-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                Live AI Voice Interviewer
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Conduct real-time technical voice interviews powered by AI. Receive feedback on technical accuracy, communication, and problem-solving.
              </p>
            </div>
            <Link href="/voice-interviewer" className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300">
              Start Voice Interview <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Aptitude & Reasoning Suite */}
          <div className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                Aptitude & Reasoning Hub
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Complete modules for Quantitative Aptitude, Logical Reasoning, and Verbal Ability with real percentage mock test scoring.
              </p>
            </div>
            <Link href="/learn" className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300">
              View All Modules <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Placement Hub */}
          <div className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-pink-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">
                Company Placement Hub
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Access curated question sets and mock assessments targeted for TCS, Infosys, Amazon, Google, Meta, and Microsoft.
              </p>
            </div>
            <Link href="/placement-hub" className="inline-flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-pink-300">
              Explore Companies <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 5: System Design */}
          <div className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                System Design & Architecture
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Learn high-level architecture, load balancers, caching strategies, microservices, and distributed database designs.
              </p>
            </div>
            <Link href="/system-design" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300">
              Learn System Design <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 6: Performance Analytics */}
          <div className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-blue-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                Percentile Speed Graphs
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Inspect your runtime and memory performance vs global user submissions for any programming language.
              </p>
            </div>
            <Link href="/coding" className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300">
              Try Coding Engine <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>


      {/* ── 3. PLATFORM STATS SECTION ── */}
      <section id="about" className="py-16 border-y border-zinc-800 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-emerald-400 mb-1">100,000+</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Students Learning</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-cyan-400 mb-1">&lt; 100ms</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Execution Speed</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-purple-400 mb-1">100+</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Company Test Sets</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-amber-400 mb-1">100%</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Scoring Accuracy</p>
          </div>
        </div>
      </section>


      {/* ── 4. FOOTER (BELOW THE FOLD ON SCROLL) ── */}
      <LandingFooter />

    </main>
  );
}
