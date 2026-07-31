"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Filter, Sparkles } from "lucide-react";
import { InteractivePracticeQuestion } from "./InteractivePracticeQuestion";

interface PracticeQuestionsSectionProps {
  questions: any[];
  lessonId: string;
}

export function PracticeQuestionsSection({ questions, lessonId }: PracticeQuestionsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  const safeQuestions = Array.isArray(questions) ? questions : [];

  // Filter by difficulty if selected
  const filteredQuestions = safeQuestions.filter((q) => {
    if (selectedDifficulty === "all") return true;
    return (q.difficulty || "medium").toLowerCase() === selectedDifficulty.toLowerCase();
  });

  // Display initial 4 questions unless "showAll" is toggled
  const displayedQuestions = showAll ? filteredQuestions : filteredQuestions.slice(0, 4);

  return (
    <section className="space-y-6 pt-10 border-t border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Practice Bank ({safeQuestions.length} Questions)
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mt-2">
            <HelpCircle className="w-6 h-6 text-emerald-500" />
            Practice Questions & The Bits
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            All questions are sourced from real hiring tests (TCS NQT, Infosys, Wipro, Accenture) and evaluated against 50+ hidden test cases.
          </p>
        </div>

        {/* Difficulty Filter Dropdown */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 hover:border-emerald-500/50 text-white text-xs font-semibold rounded-xl pl-8 pr-8 py-2 appearance-none cursor-pointer focus:outline-none transition-colors"
            >
              <option value="all">All Difficulties ({safeQuestions.length})</option>
              <option value="easy">Easy (30%)</option>
              <option value="medium">Medium (45%)</option>
              <option value="hard">Hard (25%)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Render Questions List */}
      <div className="space-y-6">
        {displayedQuestions.map((q, idx) => (
          <InteractivePracticeQuestion
            key={q.id || `${lessonId}-q-${idx}-${(q.question || '').slice(0, 15)}`}
            id={q.id || `${lessonId}-q-${idx}`}
            idx={idx}
            question={q.question}
            options={Array.isArray(q.options) ? q.options : []}
            correctIndex={typeof q.correct_index === "number" ? q.correct_index : 0}
            explanation={q.explanation}
            difficulty={q.difficulty || "medium"}
            companies={Array.isArray(q.companies) ? q.companies : undefined}
          />
        ))}

        {filteredQuestions.length === 0 && (
          <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <p className="text-zinc-400 font-semibold mb-1">No questions found for difficulty '{selectedDifficulty}'</p>
            <button
              onClick={() => setSelectedDifficulty("all")}
              className="text-xs text-emerald-400 hover:underline mt-2 font-medium"
            >
              Reset Filter to Show All Questions
            </button>
          </div>
        )}
      </div>

      {/* Show All / Show Less Toggle Button */}
      {filteredQuestions.length > 4 && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            {showAll ? (
              <>
                Show Less (Initial 4 Questions) <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show All {filteredQuestions.length} Practice Questions <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
