import React from "react";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowLeft, Lightbulb } from "lucide-react";
import { LearningService } from "@/lib/learning/services/LearningService";

export const revalidate = 0;

export default async function MockResultsPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  
  const session = await LearningService.queries.getMockSession(testId);

  if (!session) {
    return <div className="p-8 text-center text-white">Session not found.</div>;
  }

  // Get the submitted responses which contains user answers
  const submissions = session.session_data.submissions || [];
  const qIds = session.session_data.paper_ids || [];
  
  // Fetch questions
  const questions = await LearningService.queries.getQuestionsByIds(qIds);

  const qMap = new Map(questions?.map(q => [q.id, q]));

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="max-w-4xl mx-auto px-4 py-12 md:px-8">
        <header className="mb-12">
          <Link href="/reasoning/mock-tests" className="text-zinc-400 hover:text-white mb-6 block text-sm transition-colors">
            &larr; Back to Mock Tests
          </Link>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Test Results</h1>
            <p className="text-zinc-400 mb-6">{session.session_data.config.title}</p>
            
            <div className="text-6xl font-extrabold text-emerald-500 mb-4">
              {Math.round(session.score)}%
            </div>
            <p className="text-zinc-400">Overall Accuracy</p>
          </div>
        </header>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold">Detailed Review & Explanations</h2>
          
          {submissions.map((sub: any, idx: number) => {
            const q = qMap.get(sub.question_id);
            if (!q) return null;
            
            const isCorrect = sub.is_correct;
            const notAnswered = sub.selected_option === null;

            return (
              <div key={idx} className={`bg-zinc-900 border rounded-2xl p-6 ${isCorrect ? 'border-emerald-500/30' : (notAnswered ? 'border-zinc-800' : 'border-red-500/30')}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-zinc-800 px-3 py-1 rounded text-sm font-semibold text-zinc-300">
                    Q{idx + 1}
                  </span>
                  {isCorrect ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-sm font-bold"><CheckCircle className="w-4 h-4" /> Correct</span>
                  ) : notAnswered ? (
                    <span className="text-zinc-500 flex items-center gap-1 text-sm font-bold">Not Answered</span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 text-sm font-bold"><XCircle className="w-4 h-4" /> Incorrect</span>
                  )}
                </div>

                <p className="text-lg font-medium mb-6 leading-relaxed">
                  {q.question}
                </p>

                <div className="grid gap-3 mb-6">
                  {q.options?.map((opt: string, oIdx: number) => {
                    const isUserSelection = sub.selected_option === oIdx;
                    const isActualCorrect = q.correct_index === oIdx;
                    
                    let borderClass = "border-zinc-800 bg-zinc-900/50 text-zinc-500";
                    
                    if (isActualCorrect) {
                      borderClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold";
                    } else if (isUserSelection) {
                      borderClass = "border-red-500 bg-red-500/10 text-red-400 font-bold";
                    }

                    return (
                      <div key={oIdx} className={`p-4 rounded-xl border ${borderClass}`}>
                        <span className="mr-3 font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                        {opt}
                        {isUserSelection && <span className="ml-2 text-xs uppercase tracking-wider">(Your Answer)</span>}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="mt-6 p-5 bg-zinc-800/50 rounded-xl border border-zinc-700">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-emerald-400">
                      <Lightbulb className="w-4 h-4" /> Explanation
                    </h4>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
