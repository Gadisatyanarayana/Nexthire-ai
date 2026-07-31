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

// Cinematic 3D Solar System Planets & Orbits
const skills = [
  { icon: Layout, name: "Frontend", color: "#61DAFB", distance: 170, size: 52, duration: 22, delay: 0 },
  { icon: Layers, name: "Architecture", color: "#ffffff", distance: 170, size: 56, duration: 22, delay: 11 },
  { icon: Server, name: "Backend", color: "#339933", distance: 300, size: 54, duration: 38, delay: 4 },
  { icon: Terminal, name: "DevOps", color: "#3776AB", distance: 300, size: 62, duration: 38, delay: 23 },
  { icon: Code2, name: "Core DSA", color: "#E34F26", distance: 460, size: 68, duration: 60, delay: 0 },
  { icon: Cpu, name: "AI Engine", color: "#8A2BE2", distance: 460, size: 72, duration: 60, delay: 30 },
  { icon: Database, name: "SQL & DB", color: "#336791", distance: 650, size: 66, duration: 90, delay: 15 },
  { icon: Box, name: "Docker", color: "#2496ED", distance: 650, size: 60, duration: 90, delay: 60 },
  { icon: Globe, name: "Web3", color: "#F7DF1E", distance: 860, size: 82, duration: 130, delay: 25 },
];

export function SolarSystem() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div 
      className="relative w-full h-[85vh] md:h-[92vh] flex items-center justify-center mx-auto opacity-100 transition-opacity duration-1000 overflow-hidden bg-transparent"
      style={{ perspective: "1300px" }}
    >
      {/* Deep Space Background Nebula */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div 
          className="absolute w-[900px] h-[900px] rounded-full opacity-60 animate-pulse" 
          style={{ 
            background: 'radial-gradient(circle at center, rgba(138,43,226,0.2) 0%, transparent 70%)',
            animationDuration: '8s' 
          }} 
        />
        <div 
          className="absolute w-[700px] h-[700px] rounded-full opacity-50 animate-pulse" 
          style={{ 
            background: 'radial-gradient(circle at center, rgba(0,242,254,0.2) 0%, transparent 70%)',
            animationDuration: '6s', 
            animationDelay: '2s' 
          }} 
        />
      </div>

      <div 
        className="relative w-full h-full flex items-center justify-center z-10 scale-100 md:scale-110"
        style={{ transform: "rotateX(68deg)", transformStyle: "preserve-3d" }}
      >
        {/* Central Sun Core */}
        <div 
          className="absolute flex flex-col items-center justify-center w-44 h-44 md:w-56 md:h-56 rounded-full z-20"
          style={{ 
            transform: "rotateX(-68deg)",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Corona Solar Glow Layers */}
          <div 
            className="absolute -inset-6 rounded-full animate-pulse" 
            style={{ 
              animationDuration: '3s',
              boxShadow: '0 0 100px 30px rgba(0,242,254,0.35)'
            }} 
          />
          <div 
            className="absolute -inset-12 rounded-full animate-pulse" 
            style={{ 
              animationDuration: '5s', 
              animationDelay: '1s',
              boxShadow: '0 0 140px 40px rgba(138,43,226,0.25)'
            }} 
          />
          
          {/* Physical 3D Sun Sphere */}
          <div className="relative flex items-center justify-center w-full h-full rounded-full border-2 border-cyan-300/60 overflow-hidden"
               style={{
                 background: "radial-gradient(circle at 30% 30%, #00f2fe 0%, #4facfe 35%, #08081a 90%)",
                 boxShadow: "inset -25px -25px 60px rgba(0,0,0,0.95), inset 12px 12px 35px rgba(255,255,255,0.5), 0 0 120px rgba(0, 242, 254, 0.7)"
               }}
          >
            <div className="flex items-center justify-center font-black text-6xl md:text-7xl tracking-tighter z-10">
              <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]">N</span>
              <span className="text-white/80 drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]">H</span>
            </div>
          </div>
        </div>

        {/* Cinematic Orbit Rings (Extending Outwards) */}
        {[340, 600, 920, 1300, 1720].map((size, idx) => (
          <div 
            key={idx}
            className="absolute rounded-full border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
            style={{ 
              width: size, 
              height: size,
            }} 
          />
        ))}

        {/* Orbiting 3D Planets */}
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
                {/* 3D Planet Sphere */}
                <div
                  className="group flex items-center justify-center w-full h-full rounded-full relative cursor-pointer transition-all duration-300 hover:scale-125"
                  style={{ 
                    transform: "rotateX(-68deg)",
                    background: `radial-gradient(circle at 30% 30%, ${skill.color} 0%, #030308 85%)`,
                    border: `1px solid ${skill.color}70`,
                    boxShadow: `
                      inset -12px -12px 25px rgba(0,0,0,0.95), 
                      inset 6px 6px 15px rgba(255,255,255,0.5), 
                      0 0 25px ${skill.color}80
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
    </div>
  );
}
