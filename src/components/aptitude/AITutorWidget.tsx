"use client";

import React, { useState } from "react";
import { Bot, X, Maximize2, Minimize2 } from "lucide-react";
import { TutorChat } from "./TutorChat";

export function AITutorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full shadow-lg shadow-emerald-500/20 flex items-center justify-center transition-transform hover:scale-110 z-50 group"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute right-full mr-4 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Aptitude Tutor
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed right-6 bottom-6 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 ease-in-out ${
            isExpanded ? 'w-[800px] h-[80vh]' : 'w-[400px] h-[600px]'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <Bot className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-white">AI Tutor</h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                {isExpanded ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition">
                <X className="w-5 h-5"/>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <TutorChat />
          </div>
        </div>
      )}
    </>
  );
}
