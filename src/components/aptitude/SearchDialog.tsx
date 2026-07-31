"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Book, Calculator, X } from "lucide-react";
import Link from "next/link";
import { AptitudeLesson, AptitudeFormula } from "@/models/aptitude";

export function SearchDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState<AptitudeLesson[]>([]);
  const [formulas, setFormulas] = useState<AptitudeFormula[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length < 2) {
        setLessons([]);
        setFormulas([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/aptitude/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setLessons(data.lessons || []);
          setFormulas(data.formulas || []);
        }
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons, formulas, topics..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500"
          />
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && (
            <div className="p-8 flex justify-center text-emerald-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          
          {!loading && query.length >= 2 && lessons.length === 0 && formulas.length === 0 && (
            <div className="p-8 text-center text-zinc-500">
              No results found for "{query}"
            </div>
          )}

          {!loading && lessons.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Lessons</div>
              {lessons.map(lesson => (
                <Link
                  key={lesson.id}
                  href={`/aptitude/learn/${lesson.module_id}/${lesson.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-emerald-500/10 transition-colors group"
                >
                  <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-emerald-500/20 text-zinc-400 group-hover:text-emerald-400">
                    <Book className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{lesson.title}</div>
                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                      <span className="capitalize">{lesson.difficulty}</span> • <span>{lesson.reading_time}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && formulas.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Formulas</div>
              {(Array.isArray(formulas) ? formulas : []).map(formula => (
                <Link
                  key={formula.id}
                  href={`/aptitude/formulas/${formula.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-emerald-500/10 transition-colors group"
                >
                  <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-emerald-500/20 text-zinc-400 group-hover:text-emerald-400">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white truncate max-w-md">{formula.formula_text}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
