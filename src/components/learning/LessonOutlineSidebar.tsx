"use client";

import React, { useState, useEffect } from "react";
import { List, CheckCircle2, ChevronRight } from "lucide-react";

interface ConceptItem {
  id: string;
  title: string;
}

export function LessonOutlineSidebar({ concepts }: { concepts: ConceptItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!concepts || concepts.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;

      for (let i = concepts.length - 1; i >= 0; i--) {
        const element = document.getElementById(`concept-${i}`);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveIndex(i);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [concepts]);

  if (!concepts || concepts.length === 0) return null;

  const scrollToConcept = (index: number) => {
    setActiveIndex(index);
    const element = document.getElementById(`concept-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 sticky top-24 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4 pb-3 border-b border-zinc-800">
        <List className="w-4 h-4 text-emerald-500" />
        Lesson Outline & Progress
      </div>

      <nav className="space-y-1.5">
        {concepts.map((concept, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={concept.id || idx}
              onClick={() => scrollToConcept(idx)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-300 ${
                isActive
                  ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                  isActive ? "bg-emerald-500 text-black font-extrabold" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {idx + 1}
                </span>
                <span className="truncate">{concept.title}</span>
              </div>
              {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
