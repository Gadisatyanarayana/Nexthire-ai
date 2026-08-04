"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Code2, 
  Database, 
  Server, 
  Terminal, 
  Cpu, 
  Globe, 
  Layout, 
  Box,
  Layers,
  Sparkles,
  Zap,
  Mic,
  Calculator,
  Building2,
  BarChart3
} from "lucide-react";

// Software Development Solar System Planets
const planets = [
  { 
    id: "coding",
    icon: Code2, 
    name: "Coding & DSA", 
    desc: "C++, Java, Python 3 with LeetCode-speed judge",
    color: "#ef4743", 
    distance: 160, 
    size: 54, 
    duration: 24, 
    delay: 0 
  },
  { 
    id: "ai-voice",
    icon: Mic, 
    name: "AI Voice Interviewer", 
    desc: "Live real-time AI technical mock interviews",
    color: "#a371f7", 
    distance: 160, 
    size: 50, 
    duration: 24, 
    delay: 12 
  },
  { 
    id: "system-design",
    icon: Server, 
    name: "System Design", 
    desc: "Architecture blueprints & scalable systems",
    color: "#00b8a3", 
    distance: 290, 
    size: 56, 
    duration: 36, 
    delay: 4 
  },
  { 
    id: "aptitude",
    icon: Calculator, 
    name: "Aptitude Hub", 
    desc: "Quantitative, reasoning & verbal curriculum",
    color: "#ffa116", 
    distance: 290, 
    size: 58, 
    duration: 36, 
    delay: 22 
  },
  { 
    id: "sql",
    icon: Database, 
    name: "SQL Playground", 
    desc: "Interactive database query execution",
    color: "#38bdf8", 
    distance: 430, 
    size: 62, 
    duration: 54, 
    delay: 8 
  },
  { 
    id: "placement",
    icon: Building2, 
    name: "Placement Hub", 
    desc: "Company-wise test papers (TCS, Amazon, Google)",
    color: "#ec4899", 
    distance: 430, 
    size: 64, 
    duration: 54, 
    delay: 35 
  },
  { 
    id: "analytics",
    icon: BarChart3, 
    name: "Speed Analytics", 
    desc: "Runtime & memory distribution graphs",
    color: "#3b82f6", 
    distance: 580, 
    size: 68, 
    duration: 78, 
    delay: 20 
  },
];

export function SolarSystem() {
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const activeInfo = planets.find((p) => p.id === hoveredPlanet);

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center mx-auto opacity-100 transition-opacity duration-1000 overflow-hidden bg-transparent"
      style={{ perspective: "1200px" }}
    >
      {/* Deep Space Starfield & Background Nebula */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div 
          className="absolute w-[900px] h-[900px] rounded-full opacity-60 animate-pulse" 
          style={{ 
            background: 'radial-gradient(circle at center, rgba(163,113,247,0.2) 0%, transparent 70%)',
            animationDuration: '8s' 
          }} 
        />
        <div 
          className="absolute w-[700px] h-[700px] rounded-full opacity-50 animate-pulse" 
          style={{ 
            background: 'radial-gradient(circle at center, rgba(0,184,163,0.2) 0%, transparent 70%)',
            animationDuration: '6s', 
            animationDelay: '2s' 
          }} 
        />
      </div>

      <div 
        className="relative w-full h-full flex items-center justify-center z-10 scale-90 md:scale-105"
        style={{ transform: "rotateX(66deg)", transformStyle: "preserve-3d" }}
      >
        {/* Central Sun Core: NEXTHIRE AI STAR */}
        <div 
          className="absolute flex flex-col items-center justify-center w-40 h-40 md:w-52 md:h-52 rounded-full z-20"
          style={{ 
            transform: "rotateX(-66deg)",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Corona Solar Glow Layers */}
          <div 
            className="absolute -inset-6 rounded-full animate-pulse" 
            style={{ 
              animationDuration: '3s',
              boxShadow: '0 0 100px 30px rgba(0,184,163,0.35)'
            }} 
          />
          <div 
            className="absolute -inset-12 rounded-full animate-pulse" 
            style={{ 
              animationDuration: '5s', 
              animationDelay: '1s',
              boxShadow: '0 0 140px 40px rgba(163,113,247,0.25)'
            }} 
          />
          
          {/* Physical 3D Sun Sphere */}
          <div className="relative flex items-center justify-center w-full h-full rounded-full border-2 border-cyan-300/60 overflow-hidden"
               style={{
                 background: "radial-gradient(circle at 30% 30%, #00b8a3 0%, #a371f7 50%, #030308 95%)",
                 boxShadow: "inset -25px -25px 60px rgba(0,0,0,0.95), inset 12px 12px 35px rgba(255,255,255,0.5), 0 0 120px rgba(0, 184, 163, 0.7)"
               }}
          >
            <div className="flex flex-col items-center justify-center text-center z-10">
              <span className="text-white font-black text-2xl md:text-3xl tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]">
                NEXTHIRE
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">
                AI CORE
              </span>
            </div>
          </div>
        </div>

        {/* Orbit Rings */}
        {[320, 580, 860, 1160].map((size, idx) => (
          <div 
            key={`ring-${idx}`}
            className="absolute rounded-full border border-white/15 shadow-[0_0_20px_rgba(255,255,255,0.03)]"
            style={{ 
              width: size, 
              height: size,
            }} 
          />
        ))}

        {/* Orbiting Tech Planets */}
        {planets.map((planet) => {
          const Icon = planet.icon;
          return (
            <motion.div
              key={planet.id}
              className="absolute flex items-center justify-center"
              style={{
                width: planet.distance * 2,
                height: planet.distance * 2,
                transformStyle: "preserve-3d",
              }}
              animate={{ rotateZ: 360 }}
              transition={{
                repeat: Infinity,
                duration: planet.duration,
                ease: "linear",
                delay: -planet.delay,
              }}
            >
              <motion.div
                className="absolute"
                style={{
                  top: 0,
                  marginTop: -planet.size / 2,
                  width: planet.size,
                  height: planet.size,
                  transformStyle: "preserve-3d",
                }}
                animate={{ rotateZ: -360 }}
                transition={{
                  repeat: Infinity,
                  duration: planet.duration,
                  ease: "linear",
                  delay: -planet.delay,
                }}
              >
                {/* 3D Planet Sphere */}
                <div
                  onMouseEnter={() => setHoveredPlanet(planet.id)}
                  onMouseLeave={() => setHoveredPlanet(null)}
                  className="group flex items-center justify-center w-full h-full rounded-full relative cursor-pointer transition-all duration-300 hover:scale-125"
                  style={{ 
                    transform: "rotateX(-66deg)",
                    background: `radial-gradient(circle at 30% 30%, ${planet.color} 0%, #030308 85%)`,
                    border: `1px solid ${planet.color}80`,
                    boxShadow: `
                      inset -12px -12px 25px rgba(0,0,0,0.95), 
                      inset 6px 6px 15px rgba(255,255,255,0.5), 
                      0 0 30px ${planet.color}90
                    `
                  }}
                >
                  <Icon className="relative z-10 w-1/2 h-1/2 text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Active Planet Card */}
      {activeInfo && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-5 py-3 rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-3 animate-fade-in"
          style={{ background: "rgba(10, 10, 24, 0.85)" }}
        >
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0"
            style={{ background: activeInfo.color, boxShadow: `0 0 20px ${activeInfo.color}` }}
          >
            <activeInfo.icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{activeInfo.name}</h4>
            <p className="text-xs text-zinc-400">{activeInfo.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}
