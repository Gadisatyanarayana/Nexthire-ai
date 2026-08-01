"use client";

import { SolarSystem } from "@/components/landing/SolarSystem";
import { LandingFooter } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#030308] text-foreground relative flex flex-col justify-between overflow-x-hidden">
      {/* ── Solar System Hero Section ── */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-[calc(100vh-64px)] overflow-hidden">
        <SolarSystem />
        
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-tr from-cyan-500/15 via-purple-500/15 to-transparent blur-[140px] opacity-30 pointer-events-none -z-10 rounded-full" />
      </div>

      {/* ── Landing Page Footer ── */}
      <LandingFooter />
    </main>
  );
}
