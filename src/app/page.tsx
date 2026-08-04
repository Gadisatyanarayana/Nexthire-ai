"use client";

import { SolarSystem } from "@/components/landing/SolarSystem";
import { LandingFooter } from "@/components/landing/Footer";
import { ChevronDown } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#030308] text-foreground relative flex flex-col overflow-x-hidden">
      
      {/* ── 1. FULL SCREEN 3D SOLAR SYSTEM ── */}
      <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden">
        
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] bg-gradient-to-tr from-cyan-500/15 via-purple-500/15 to-transparent blur-[140px] opacity-40 pointer-events-none -z-10 rounded-full" />

        {/* 3D Solar System Universe */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <SolarSystem />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Scroll Indicator Prompt */}
        <div className="relative z-20 pb-8 flex flex-col items-center justify-center pointer-events-auto">
          <a
            href="#footer"
            aria-label="Scroll Down to Footer"
            className="flex flex-col items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors group"
          >
            <span className="text-xs font-semibold uppercase tracking-widest group-hover:tracking-widest transition-all">
              Scroll Down for Footer
            </span>
            <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900/80 flex items-center justify-center group-hover:border-emerald-500 transition-colors animate-bounce">
              <ChevronDown className="w-4 h-4" />
            </div>
          </a>
        </div>
      </section>

      {/* ── 2. LANDING FOOTER (UNDER THE SOLAR SYSTEM ON SCROLL) ── */}
      <div id="footer">
        <LandingFooter />
      </div>

    </main>
  );
}
