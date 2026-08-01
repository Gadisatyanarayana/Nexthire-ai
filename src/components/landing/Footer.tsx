'use client';

import Link from 'next/link';
import { Sparkles, Terminal, Briefcase, FileText, ShieldCheck, Heart } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#030308]/90 backdrop-blur-2xl text-white relative z-20 py-12 px-6 sm:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-purple-500/30 border border-cyan-400/40 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(0,242,254,0.4)]">
              <img src="/icon.svg" alt="NextHire Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent uppercase">
              NEXTHIRE AI
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
            Enterprise Placement Performance Platform. Master DSA coding, ATS resumes, and real-time AI technical interviews.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>OAuth 2.0 & Containerized Sandbox</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Platform Modules</h4>
          <ul className="space-y-2 text-xs text-zinc-300">
            <li>
              <Link href="/coding" className="hover:text-cyan-400 transition flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" />
                <span>DSA Coding Arena</span>
              </Link>
            </li>
            <li>
              <Link href="/placement-hub" className="hover:text-cyan-400 transition flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Placement Hub</span>
              </Link>
            </li>
            <li>
              <Link href="/voice-interviewer" className="hover:text-cyan-400 transition flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Voice AI Interviewer</span>
              </Link>
            </li>
            <li>
              <Link href="/my-resume" className="hover:text-cyan-400 transition flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                <span>ATS Resume Analyzer</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Analytics & Knowledge */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Learning & Analytics</h4>
          <ul className="space-y-2 text-xs text-zinc-300">
            <li>
              <Link href="/coding/knowledge-graph" className="hover:text-cyan-400 transition">
                DSA Knowledge Graph
              </Link>
            </li>
            <li>
              <Link href="/admin/coding-audit" className="hover:text-cyan-400 transition">
                QA Content Audit Dashboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-cyan-400 transition">
                Student Performance Analytics
              </Link>
            </li>
          </ul>
        </div>

        {/* System Status */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Supported Languages</h4>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-cyan-300 font-mono font-bold">C++</span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-emerald-300 font-mono font-bold">Python</span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-purple-300 font-mono font-bold">Java</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed pt-2">
            6,902 Canonical Problems • 500,000+ Verified Test Cases • Containerized Code Evaluation
          </p>
        </div>

      </div>

      {/* Bottom Legal Bar */}
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
        <div>
          © {new Date().getFullYear()} NextHire AI. All rights reserved.
        </div>
        <div className="flex items-center gap-1">
          <span>Engineered with precision for tech careers</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500 ml-1" />
        </div>
      </div>
    </footer>
  );
}
