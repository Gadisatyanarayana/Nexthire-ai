"use client";

import { SolarSystem } from "@/components/landing/SolarSystem";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-64px)] w-full bg-background text-foreground premium-glow-bg overflow-hidden flex flex-col items-center justify-center">
      {/* ── Solar System Hero ── */}
      <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center flex-1">
        <SolarSystem />
      </div>
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-brand-blue-dim to-brand-purple-dim blur-[120px] opacity-20 pointer-events-none -z-10 rounded-full" />
    </main>
  );
}
