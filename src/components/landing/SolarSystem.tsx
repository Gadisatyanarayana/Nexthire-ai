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
  Layers
} from "lucide-react";

// Cinematic Lucide icons
const skills = [
  { icon: Layout, color: "#61DAFB", distance: 160, size: 55, duration: 25, delay: 0 },
  { icon: Layers, color: "#ffffff", distance: 160, size: 60, duration: 25, delay: 12.5 },
  { icon: Server, color: "#339933", distance: 280, size: 55, duration: 45, delay: 5 },
  { icon: Terminal, color: "#3776AB", distance: 280, size: 65, duration: 45, delay: 27 },
  { icon: Code2, color: "#E34F26", distance: 440, size: 70, duration: 70, delay: 0 },
  { icon: Cpu, color: "#8A2BE2", distance: 440, size: 75, duration: 70, delay: 35 },
  { icon: Database, color: "#336791", distance: 620, size: 65, duration: 100, delay: 15 },
  { icon: Box, color: "#2496ED", distance: 620, size: 60, duration: 100, delay: 65 },
  { icon: Globe, color: "#F7DF1E", distance: 820, size: 85, duration: 140, delay: 30 },
];

export function SolarSystem() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div 
      className="relative w-full h-[80vh] flex items-center justify-center mx-auto opacity-100 transition-opacity duration-1000 overflow-visible bg-transparent"
      style={{ perspective: "1500px" }}
    >
      {/* Background Nebula (Optimized) */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-60 animate-pulse" 
          style={{ 
            background: 'radial-gradient(circle at center, rgba(138,43,226,0.15) 0%, transparent 70%)',
            animationDuration: '8s' 
          }} 
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-50 animate-pulse" 
          style={{ 
            background: 'radial-gradient(circle at center, rgba(0,242,254,0.15) 0%, transparent 70%)',
            animationDuration: '6s', 
            animationDelay: '2s' 
          }} 
        />
      </div>

      <div 
        className="relative w-full h-full flex items-center justify-center z-10"
        style={{ transform: "rotateX(72deg)", transformStyle: "preserve-3d" }}
      >
        {/* Central Star (The Core) */}
        <div 
          className="absolute flex flex-col items-center justify-center w-48 h-48 rounded-full z-20"
          style={{ 
            transform: "rotateX(-72deg)",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Corona Glow Layers (Optimized) */}
          <div 
            className="absolute inset-0 rounded-full animate-pulse" 
            style={{ 
              animationDuration: '3s',
              boxShadow: '0 0 80px 20px rgba(0,242,254,0.15)'
            }} 
          />
          <div 
            className="absolute -inset-10 rounded-full animate-pulse" 
            style={{ 
              animationDuration: '5s', 
              animationDelay: '1s',
              boxShadow: '0 0 100px 30px rgba(138,43,226,0.1)'
            }} 
          />
          
          {/* Physical Star Sphere */}
          <div className="relative flex items-center justify-center w-full h-full rounded-full border-2 border-brand-blue/50 overflow-hidden"
               style={{
                 background: "radial-gradient(circle at 30% 30%, #00f2fe 0%, #4facfe 30%, #050505 90%)",
                 boxShadow: "inset -20px -20px 50px rgba(0,0,0,0.9), inset 10px 10px 30px rgba(255,255,255,0.4), 0 0 100px rgba(0, 242, 254, 0.5)"
               }}
          >
            {/* "NH" Logo */}
            <div className="flex items-center justify-center font-black text-6xl tracking-tighter z-10">
              <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">N</span>
              <span className="text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">H</span>
            </div>
            
            {/* Plasma Surface Animation (Optional visual flair) */}
            <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          </div>
        </div>

        {/* Cinematic Orbit Rings */}
        {[320, 560, 880, 1240, 1640].map((size, idx) => (
          <div 
            key={idx}
            className="absolute rounded-full border border-foreground/15"
            style={{ 
              width: size, 
              height: size,
            }} 
          />
        ))}

        {/* Orbiting Skills (Planets) */}
        {skills.map((skill, i) => {
          const Icon = skill.icon;
          return (
            <motion.div
              key={i}
              className="absolute flex items-center justify-center"
              style={{
                width: skill.distance * 2,
                height: skill.distance * 2,
                transformStyle: "preserve-3d",
              }}
              animate={{ rotateZ: 360 }}
              transition={{
                repeat: Infinity,
                duration: skill.duration,
                ease: "linear",
                delay: -skill.delay,
              }}
            >
              <motion.div
                className="absolute"
                style={{
                  top: 0,
                  marginTop: -skill.size / 2,
                  width: skill.size,
                  height: skill.size,
                  transformStyle: "preserve-3d",
                }}
                animate={{ rotateZ: -360 }}
                transition={{
                  repeat: Infinity,
                  duration: skill.duration,
                  ease: "linear",
                  delay: -skill.delay,
                }}
              >
                {/* 3D Planet Sphere (Optimized) */}
                <div
                  className="group flex items-center justify-center w-full h-full rounded-full relative cursor-pointer transition-all duration-300 hover:scale-110"
                  style={{ 
                    transform: "rotateX(-72deg)",
                    background: `radial-gradient(circle at 30% 30%, ${skill.color} 0%, #050505 85%)`,
                    border: `1px solid ${skill.color}50`,
                    boxShadow: `
                      inset -10px -10px 20px rgba(0,0,0,0.9), 
                      inset 5px 5px 15px rgba(255,255,255,0.4), 
                      0 0 20px ${skill.color}60
                    `
                  }}
                >
                  <Icon className="relative z-10 w-1/2 h-1/2 text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </div>
              </motion.div>
            </motion.div>
          );
        })}
        
        {/* Parallax Starfield */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ transform: "rotateX(-72deg) scale(2)" }}>
           {Array.from({ length: 150 }).map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full bg-foreground shadow-sm"
                style={{
                  width: Math.random() * 3 + 'px',
                  height: Math.random() * 3 + 'px',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  opacity: Math.random() * 0.8 + 0.1,
                  animation: `pulse ${Math.random() * 5 + 2}s infinite`,
                }}
              />
           ))}
        </div>
      </div>
    </div>
  );
}
