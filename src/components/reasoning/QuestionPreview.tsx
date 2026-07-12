import React from "react";
import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import { ReasoningQuestion } from "@/models/reasoning";

export function QuestionPreview({ lessonId, questions }: { lessonId: string, questions: ReasoningQuestion[] }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-12 border-t border-zinc-800 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-500" />
          Practice Questions
        </h3>
        <Link 
          href={`/reasoning/practice/${lessonId}`}
          className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          View all {questions.length}+ questions <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {questions.slice(0, 4).map((q, idx) => {
          const qId = q.id as string;
          return (
          <Link 
            key={qId}
            href={`/reasoning/practice/${lessonId}?q=${qId}`}
            className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-emerald-500/50 transition-colors group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold px-2 py-1 bg-zinc-800 text-zinc-300 rounded">
                Q{idx + 1}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' :
                q.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {q.difficulty}
              </span>
            </div>
            <p className="text-zinc-300 text-sm line-clamp-2 mt-2">{q.question}</p>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
