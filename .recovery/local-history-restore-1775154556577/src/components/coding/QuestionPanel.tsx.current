"use client";

import { useState } from "react";
import Link from "next/link";
import type { CodingQuestion } from "@/lib/codingQuestions";
import { buildLearningBlueprint } from "@/lib/studentLearning";

type Props = {
  question: CodingQuestion;
  isDark: boolean;
  similarQuestions?: Array<Pick<CodingQuestion, "id" | "title" | "difficulty" | "topic">>;
};

export function QuestionPanel({ question, isDark, similarQuestions }: Props) {
  const [showTopics, setShowTopics] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);
  const [showLearningPlan, setShowLearningPlan] = useState(true);
  const blueprint = buildLearningBlueprint(question);

  const diffTone =
    question.difficulty === "Easy"
      ? isDark
        ? "bg-emerald-400/15 text-emerald-200 border-emerald-300/30"
        : "bg-emerald-100 text-emerald-800 border-emerald-300"
      : question.difficulty === "Medium"
      ? isDark
        ? "bg-amber-400/15 text-amber-100 border-amber-300/30"
        : "bg-amber-100 text-amber-900 border-amber-300"
      : isDark
      ? "bg-rose-400/15 text-rose-100 border-rose-300/30"
      : "bg-rose-100 text-rose-900 border-rose-300";

  return (
    <div className={`h-full overflow-y-auto rounded-2xl border p-5 backdrop-blur-lg ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>{question.title}</h1>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${diffTone}`}>{question.difficulty}</span>
      </div>

      {(question.function_name || question.input_type || question.output_type) && (
        <div className={`mb-4 rounded-xl border p-3 text-xs ${isDark ? "border-white/10 bg-black/25 text-white/75" : "border-black/10 bg-black/5 text-black/70"}`}>
          {question.function_name && <p>Function: {question.function_name}</p>}
          {question.input_type && <p>Input Type: {question.input_type}</p>}
          {question.output_type && <p>Output Type: {question.output_type}</p>}
        </div>
      )}

      {(question.company_tags || []).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(question.company_tags || []).slice(0, 30).map((tag) => (
            <span key={`company-${tag}`} className={`rounded-full border px-2.5 py-1 text-xs ${isDark ? "border-white/20 bg-black/45 text-white/85" : "border-black/15 bg-white text-black/80"}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className={`space-y-4 text-sm leading-relaxed ${isDark ? "text-white/85" : "text-black/85"}`}>
        <p>{question.description}</p>

        <div className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-black/35" : "border-black/10 bg-black/5"}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>Student Learning Plan</h2>
            <button
              type="button"
              onClick={() => setShowLearningPlan((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${isDark ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-black/20 bg-white text-black hover:bg-black/5"}`}
            >
              {showLearningPlan ? "Hide" : "Show"}
            </button>
          </div>

          {showLearningPlan && (
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <p className={`${isDark ? "text-white/60" : "text-black/60"}`}>Section</p>
                <p className={`mt-1 font-semibold wrap-break-word ${isDark ? "text-white" : "text-black"}`}>{blueprint.section}</p>
              </div>

              <div>
                <p className={`${isDark ? "text-white/60" : "text-black/60"}`}>Core Concepts</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {blueprint.concepts.map((item) => (
                    <span key={`concept-${item}`} className={`rounded-full border px-2 py-0.5 ${isDark ? "border-white/20 bg-white/10 text-white/90" : "border-black/15 bg-white text-black/85"}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className={`${isDark ? "text-white/60" : "text-black/60"}`}>Solve Steps</p>
                <ol className="mt-1 space-y-1">
                  {blueprint.solvePlan.map((step, idx) => (
                    <li key={`solve-step-${idx}`}>{idx + 1}. {step}</li>
                  ))}
                </ol>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className={`${isDark ? "text-white/60" : "text-black/60"}`}>Prerequisites</p>
                  <ul className="mt-1 space-y-1">
                    {blueprint.prerequisites.map((item) => (
                      <li key={`pre-${item}`}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={`${isDark ? "text-white/60" : "text-black/60"}`}>Common Mistakes</p>
                  <ul className="mt-1 space-y-1">
                    {blueprint.commonMistakes.map((item) => (
                      <li key={`mistake-${item}`}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <p className={`${isDark ? "text-white/60" : "text-black/60"}`}>Career Signal</p>
                <ul className="mt-1 space-y-1">
                  {blueprint.interviewSignals.map((item) => (
                    <li key={`signal-${item}`}>- {item}</li>
                  ))}
                </ul>
              </div>

              <p className={`${isDark ? "text-white/80" : "text-black/75"}`}>{blueprint.portfolioPrompt}</p>
            </div>
          )}
        </div>

        <div>
          <h2 className={`mb-2 text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>Examples</h2>
          <div className="space-y-3">
            {question.examples.map((ex, idx) => (
              <div key={`${question.id}-ex-${idx}`} className={`rounded-xl border p-3 ${isDark ? "border-white/10 bg-black/40" : "border-black/10 bg-black/5"}`}>
                <p className={`${isDark ? "text-white/60" : "text-black/60"}`}>Input</p>
                <pre className={`whitespace-pre-wrap text-sm ${isDark ? "text-white" : "text-black"}`}>{ex.input}</pre>
                <p className={`mt-2 ${isDark ? "text-white/60" : "text-black/60"}`}>Output</p>
                <pre className={`whitespace-pre-wrap text-sm ${isDark ? "text-white" : "text-black"}`}>{ex.output}</pre>
                {ex.explanation && <p className={`mt-2 text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>{ex.explanation}</p>}
              </div>
            ))}
          </div>
        </div>

        {Array.isArray(question.constraints) && question.constraints.length > 0 && (
          <div>
            <h2 className={`mb-2 text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>Constraints</h2>
            <ul className="space-y-1">
              {question.constraints.map((line, idx) => (
                <li key={`constraint-${idx}`} className={`${isDark ? "text-white/80" : "text-black/80"}`}>
                  - {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <button
              type="button"
              onClick={() => setShowTopics((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${isDark ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-black/20 bg-black/5 text-black hover:bg-black/10"}`}
            >
              {showTopics ? "Hide Topics" : "Show Topics"}
            </button>
            {showTopics && (
              <div className="mt-2 flex flex-wrap gap-2">
                {question.topic.length === 0 ? (
                  <span className={`text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>No topics available</span>
                ) : (
                  question.topic.map((tag) => (
                    <span key={tag} className={`rounded-full border px-2.5 py-1 text-xs ${isDark ? "border-white/20 bg-white/8 text-white/85" : "border-black/15 bg-black/5 text-black/80"}`}>
                      {tag}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>

          {Array.isArray(similarQuestions) && similarQuestions.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowSimilar((v) => !v)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${isDark ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-black/20 bg-black/5 text-black hover:bg-black/10"}`}
              >
                {showSimilar ? "Hide Similar Questions" : "Similar Questions"}
              </button>
              {showSimilar && (
                <div className="mt-2 space-y-1 text-xs">
                  {similarQuestions.map((q) => (
                    <Link
                      key={q.id}
                      href={`/question/${q.id}`}
                      className={
                        isDark
                          ? "flex items-center justify-between rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-white/85 hover:bg-black/55"
                          : "flex items-center justify-between rounded-lg border border-black/10 bg-black/5 px-3 py-1.5 text-black/85 hover:bg-black/10"
                      }
                    >
                      <span className="truncate pr-2">{q.title}</span>
                      <span
                        className={`ml-2 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          q.difficulty === "Easy"
                            ? isDark
                              ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100"
                              : "border-emerald-400/50 bg-emerald-50 text-emerald-700"
                            : q.difficulty === "Medium"
                            ? isDark
                              ? "border-amber-300/40 bg-amber-300/15 text-amber-100"
                              : "border-amber-400/50 bg-amber-50 text-amber-800"
                            : isDark
                            ? "border-rose-300/40 bg-rose-300/15 text-rose-100"
                            : "border-rose-400/50 bg-rose-50 text-rose-800"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
