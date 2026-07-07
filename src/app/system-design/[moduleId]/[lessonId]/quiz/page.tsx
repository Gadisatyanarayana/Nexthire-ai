"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { CheckCircle2, ChevronRight, XCircle } from "lucide-react";

export default function LessonQuizPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const lessonId = params.lessonId as string;
  
  const [lessonData, setLessonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [answersRevealed, setAnswersRevealed] = useState<Record<number, boolean>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});

  useEffect(() => {
    fetch(`/api/v1/system-design/lessons/${lessonId}`)
      .then(res => res.json())
      .then(data => {
        setLessonData(data.lesson);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [lessonId]);

  if (loading) {
    return <div className="p-8 text-center opacity-60">Loading quiz...</div>;
  }

  if (!lessonData || !lessonData.sd_questions || lessonData.sd_questions.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-foreground/20 bg-foreground/5 max-w-4xl">
        <h3 className="font-bold">No Questions Found</h3>
        <p className="text-sm opacity-70 mt-1">This quiz is locked or migrating to the V2 architecture.</p>
        <Link href={`/system-design/${moduleId}/${lessonId}`} className="text-cyan-500 mt-4 block text-sm">Back to Theory</Link>
      </div>
    );
  }

  const handleSelect = (qIdx: number, oIdx: number) => {
    setSelectedOptions(prev => ({ ...prev, [qIdx]: oIdx }));
    setAnswersRevealed(prev => ({ ...prev, [qIdx]: true }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl pb-32">
      <div className="flex items-center gap-2 text-sm opacity-60 mb-2">
        <Link href={`/system-design/${moduleId}/${lessonId}`} className="hover:underline text-cyan-500">Back to Theory</Link>
        <ChevronRight className="h-4 w-4" />
        <span>Lesson Quiz</span>
      </div>

      <header className="border-b border-foreground/10 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">{lessonData.title}: Assessment</h1>
        <p className="text-sm opacity-70">
          Test your understanding. This contributes to your EMA (Exponential Moving Average) readiness score.
        </p>
      </header>

      <div className="space-y-12">
        {lessonData.sd_questions.map((q: any, qIdx: number) => {
          const isRevealed = answersRevealed[qIdx];
          const selected = selectedOptions[qIdx];
          const isCorrect = selected === q.correct_index;

          return (
            <div key={q.id} className="space-y-4">
              <h3 className="font-bold text-lg flex gap-3">
                <span className="opacity-50 font-mono">{qIdx + 1}.</span>
                {q.question}
              </h3>

              <div className="space-y-3 pl-8">
                {q.options.map((opt: string, oIdx: number) => {
                  let optStyle = "border-foreground/10 bg-foreground/5 hover:bg-foreground/10";
                  let Icon = null;

                  if (isRevealed) {
                    if (oIdx === q.correct_index) {
                      optStyle = "border-emerald-500/50 bg-emerald-500/10";
                      Icon = <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
                    } else if (oIdx === selected) {
                      optStyle = "border-red-500/50 bg-red-500/10";
                      Icon = <XCircle className="h-5 w-5 text-red-500" />;
                    } else {
                      optStyle = "border-foreground/5 bg-foreground/5 opacity-50";
                    }
                  } else if (selected === oIdx) {
                    optStyle = "border-cyan-500/50 bg-cyan-500/10";
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isRevealed}
                      onClick={() => handleSelect(qIdx, oIdx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span className="text-sm font-medium">{opt}</span>
                      {Icon && Icon}
                    </button>
                  );
                })}
              </div>

              {isRevealed && (
                <div className={`mt-4 pl-8 p-4 rounded-xl text-sm border ${isCorrect ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-100' : 'border-red-500/20 bg-red-500/5 text-red-100'}`}>
                  <strong className="block mb-1">{isCorrect ? 'Correct!' : 'Incorrect'}</strong>
                  <span className="opacity-90">{q.explanation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-8 border-t border-foreground/10">
        <Link 
          href={`/system-design/${moduleId}`}
          className="bg-foreground hover:bg-foreground/90 text-background px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
        >
          Return to Module
        </Link>
      </div>
    </div>
  );
}
