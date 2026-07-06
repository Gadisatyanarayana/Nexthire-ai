"use client";

import { useState } from "react";
import Link from "next/link";
import type { CodingQuestion } from "@/lib/codingQuestions";
import { buildLearningBlueprint } from "@/lib/studentLearning";
import { Tag, Building2, ChevronDown, ChevronUp, BookOpen, Lightbulb } from "lucide-react";

type Props = {
  question: CodingQuestion;
  isDark: boolean;
  similarQuestions?: Array<Pick<CodingQuestion, "id" | "title" | "difficulty" | "topic">>;
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const d = difficulty.toLowerCase();
  if (d === "easy") {
    return (
      <span className="badge-easy inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
        Easy
      </span>
    );
  }
  if (d === "medium") {
    return (
      <span className="badge-medium inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
        Medium
      </span>
    );
  }
  return (
    <span className="badge-hard inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
      Hard
    </span>
  );
}

function Section({ title, icon, children, defaultOpen = true }: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 mb-2 w-full text-left"
        style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
      >
        {icon}
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</span>
        {open ? (
          <ChevronUp style={{ width: 14, height: 14, color: "var(--text-muted)", marginLeft: "auto" }} />
        ) : (
          <ChevronDown style={{ width: 14, height: 14, color: "var(--text-muted)", marginLeft: "auto" }} />
        )}
      </button>
      {open && children}
    </div>
  );
}

export function QuestionPanel({ question, isDark, similarQuestions }: Props) {
  const blueprint = buildLearningBlueprint(question);

  const diffColor = question.difficulty.toLowerCase() === "easy"
    ? "var(--color-easy)"
    : question.difficulty.toLowerCase() === "medium"
    ? "var(--color-medium)"
    : "var(--color-hard)";

  return (
    <div
      className="h-full min-h-0 flex flex-col overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)" }}
    >
      {/* Sticky Header Section */}
      <div 
        className="shrink-0 z-10" 
        style={{ 
          background: "var(--bg-card)", 
          borderBottom: "1px solid var(--border-primary)", 
          padding: "16px 18px 12px 18px",
          borderTopLeftRadius: "inherit",
          borderTopRightRadius: "inherit",
        }}
      >
        <div className="flex items-start gap-3 flex-wrap mb-2">
          <h1 className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)", flex: 1 }}>
            {question.title}
          </h1>
          <DifficultyBadge difficulty={question.difficulty} />
        </div>

        {/* Meta info row */}
        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          {question.acceptance_rate > 0 && (
            <span>Acceptance: <span style={{ color: "var(--text-secondary)" }}>{question.acceptance_rate.toFixed(1)}%</span></span>
          )}
          {question.section && (
            <span>Section: <span style={{ color: "var(--text-secondary)" }}>{question.section}</span></span>
          )}
          {question.testcases?.length > 0 && (
            <span style={{ color: "var(--text-muted)" }}>
              {question.testcases.length} test cases
            </span>
          )}
        </div>

        {/* Company tags */}
        {(question.company_tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(question.company_tags || []).slice(0, 8).map((tag) => (
              <span
                key={`co-${tag}`}
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium"
                style={{ background: "rgba(88,166,255,0.08)", color: "var(--brand-blue)", border: "1px solid rgba(88,166,255,0.15)" }}
              >
                <Building2 style={{ width: 10, height: 10 }} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable Content Section */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar" 
        style={{ 
          padding: "16px 18px",
          borderBottomLeftRadius: "inherit",
          borderBottomRightRadius: "inherit",
        }}
      >
        {/* Description */}
        <div className="mb-5">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
            {question.description}
          </p>
        </div>

        {/* Examples */}
        {question.examples.length > 0 && (
          <Section title="Examples" defaultOpen={true}>
            <div className="space-y-3">
              {question.examples.map((ex, idx) => (
                <div
                  key={`ex-${question.id}-${idx}`}
                  className="rounded-lg overflow-hidden"
                  style={{ border: "1px solid var(--border-primary)" }}
                >
                  <div className="px-3 py-1.5" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      Example {idx + 1}
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Input</p>
                      <pre
                        className="text-xs rounded px-3 py-2 overflow-x-auto"
                        style={{ background: "var(--surface-inset)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}
                      >
                        {ex.input}
                      </pre>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Output</p>
                      <pre
                        className="text-xs rounded px-3 py-2 overflow-x-auto"
                        style={{ background: "var(--surface-inset)", color: "var(--color-accepted)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}
                      >
                        {ex.output}
                      </pre>
                    </div>
                    {ex.explanation && (
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>Explanation:</span>{" "}
                        {ex.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Constraints */}
        {Array.isArray(question.constraints) && question.constraints.length > 0 && (
          <Section title="Constraints" defaultOpen={true}>
            <ul className="space-y-1">
              {question.constraints.map((line, idx) => (
                <li
                  key={`c-${idx}`}
                  className="flex items-start gap-2 text-xs font-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span style={{ color: "var(--brand-blue)", flexShrink: 0 }}>•</span>
                  <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Topics */}
        {question.topic.length > 0 && (
          <Section title="Topics" icon={<Tag style={{ width: 14, height: 14, color: "var(--text-muted)" }} />} defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {question.topic.map((tag) => (
                <span
                  key={`tag-${tag}`}
                  className="rounded-md px-2.5 py-1 text-xs font-medium"
                  style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Similar questions */}
        {Array.isArray(similarQuestions) && similarQuestions.length > 0 && (
          <Section title="Similar Questions" icon={<BookOpen style={{ width: 14, height: 14, color: "var(--text-muted)" }} />} defaultOpen={false}>
            <div className="space-y-1.5">
              {similarQuestions.slice(0, 6).map((q) => {
                const qDiff = q.difficulty.toLowerCase();
                const qColor = qDiff === "easy" ? "var(--color-easy)" : qDiff === "medium" ? "var(--color-medium)" : "var(--color-hard)";
                return (
                  <Link
                    key={q.id}
                    href={`/question/${q.id}`}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-xs transition-all"
                    style={{ background: "var(--bg-hover)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-active)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  >
                    <span className="truncate pr-3">{q.title}</span>
                    <span className="text-[11px] font-semibold shrink-0" style={{ color: qColor }}>
                      {q.difficulty}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* Learning Blueprint (collapsible) */}
        <Section
          title="Learning Guide"
          icon={<Lightbulb style={{ width: 14, height: 14, color: "var(--text-muted)" }} />}
          defaultOpen={false}
        >
          <div
            className="rounded-lg p-3 space-y-3 text-xs"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
          >
            <div>
              <p className="font-semibold mb-1.5" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "10px" }}>
                Core Concepts
              </p>
              <div className="flex flex-wrap gap-1.5">
                {blueprint.concepts.map((item) => (
                  <span
                    key={`concept-${item}`}
                    className="rounded px-2 py-0.5"
                    style={{ background: "rgba(163,113,247,0.1)", color: "var(--brand-purple)", border: "1px solid rgba(163,113,247,0.2)" }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1.5" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "10px" }}>
                Solve Steps
              </p>
              <ol className="space-y-1">
                {blueprint.solvePlan.map((step, idx) => (
                  <li key={`step-${idx}`} className="flex gap-2" style={{ color: "var(--text-secondary)" }}>
                    <span className="font-bold shrink-0" style={{ color: "var(--brand-blue)", minWidth: "16px" }}>{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-semibold mb-1" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "10px" }}>
                  Prerequisites
                </p>
                <ul className="space-y-0.5">
                  {blueprint.prerequisites.map((item) => (
                    <li key={`pre-${item}`} style={{ color: "var(--text-secondary)" }}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "10px" }}>
                  Common Mistakes
                </p>
                <ul className="space-y-0.5">
                  {blueprint.commonMistakes.map((item) => (
                    <li key={`mistake-${item}`} style={{ color: "var(--text-secondary)" }}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {blueprint.interviewSignals.length > 0 && (
              <div>
                <p className="font-semibold mb-1" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "10px" }}>
                  Interview Signals
                </p>
                <ul className="space-y-0.5">
                  {blueprint.interviewSignals.map((item) => (
                    <li key={`signal-${item}`} style={{ color: "var(--text-secondary)" }}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>

        {/* Follow-up */}
        {question.followUp && (
          <div
            className="rounded-lg px-4 py-3 mb-4"
            style={{ background: "rgba(255,161,22,0.06)", border: "1px solid rgba(255,161,22,0.15)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-tle)" }}>Follow-up</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{question.followUp}</p>
          </div>
        )}

      </div>
    </div>
  );
}
