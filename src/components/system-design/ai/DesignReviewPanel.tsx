"use client";

import { useState } from 'react';
import { Bot, CheckCircle, AlertTriangle, CloudRain, Cpu, Info } from 'lucide-react';
import { useVisualLearningStore } from '@/lib/store/visualLearningStore';

interface ReviewFeedback {
  scores: {
    correctness: number;
    scalability: number;
    faultTolerance: number;
    costEfficiency: number;
  };
  feedback: {
    strengths: string[];
    weaknesses: string[];
    criticalFlaws?: string[];
  };
  overallSummary: string;
  suggestedResources: string[];
}

export default function DesignReviewPanel() {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [review, setReview] = useState<ReviewFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { activeLesson, selectedDiagram } = useVisualLearningStore();

  const handleSubmit = async () => {
    setIsEvaluating(true);
    setError(null);
    setReview(null);

    try {
      // In a full implementation, this grabs the actual React Flow JSON or Mermaid string
      const mockPayload = {
        type: "react_flow",
        nodes: [{ id: "1", type: "cache", label: "Redis" }],
        edges: []
      };

      const res = await fetch('/api/v1/system-design/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionPayload: mockPayload,
          lessonTitle: activeLesson || 'General System Design'
        })
      });

      if (!res.ok) throw new Error("Failed to evaluate design");

      const data = await res.json();
      setReview(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-500";
    if (score >= 5) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="w-full bg-background border border-foreground/10 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            AI Architecture Review
          </h3>
          <p className="text-sm opacity-70 mt-1">Submit your design for FAANG-level critique.</p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={isEvaluating}
          className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
        >
          {isEvaluating ? (
            <span className="animate-pulse">Evaluating...</span>
          ) : (
            <>
              <Bot className="h-4 w-4" />
              Submit Design
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-sm mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {review && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
            <p className="text-sm leading-relaxed">{review.overallSummary}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Correctness', score: review.scores.correctness, icon: <CheckCircle className="h-4 w-4" /> },
              { label: 'Scalability', score: review.scores.scalability, icon: <CloudRain className="h-4 w-4" /> },
              { label: 'Fault Tolerance', score: review.scores.faultTolerance, icon: <AlertTriangle className="h-4 w-4" /> },
              { label: 'Cost Efficiency', score: review.scores.costEfficiency, icon: <Info className="h-4 w-4" /> }
            ].map(metric => (
              <div key={metric.label} className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs opacity-70 font-mono mb-2 uppercase tracking-wider">
                  {metric.icon} {metric.label}
                </div>
                <div className={`text-3xl font-black ${getScoreColor(metric.score)}`}>
                  {metric.score}/10
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold text-emerald-500 flex items-center gap-2">Strengths</h4>
              <ul className="space-y-2">
                {review.feedback.strengths.map((str, i) => (
                  <li key={i} className="text-sm flex items-start gap-2 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span className="opacity-90">{str}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-bold text-amber-500 flex items-center gap-2">Areas for Improvement</h4>
              <ul className="space-y-2">
                {review.feedback.weaknesses.map((weak, i) => (
                  <li key={i} className="text-sm flex items-start gap-2 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span className="opacity-90">{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {review.feedback.criticalFlaws && review.feedback.criticalFlaws.length > 0 && (
            <div className="space-y-3 p-5 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <h4 className="font-bold text-rose-500 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Flaws Detected
              </h4>
              <ul className="space-y-2">
                {review.feedback.criticalFlaws.map((flaw, i) => (
                  <li key={i} className="text-sm flex items-start gap-2 text-rose-400">
                    <span className="mt-0.5">⚠️</span>
                    <span>{flaw}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
