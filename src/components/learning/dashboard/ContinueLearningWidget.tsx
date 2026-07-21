"use client";

import React from 'react';
import Link from 'next/link';
import { PlayCircle, CheckCircle, Brain, ArrowRight, Clock, Sparkles } from 'lucide-react';

interface ContinueLearningWidgetProps {
  recommendationPayload: any;
}

export default function ContinueLearningWidget({ recommendationPayload }: ContinueLearningWidgetProps) {
  if (!recommendationPayload) return null;

  // Destructure the new contract format
  const { recommendation, reason, generatedBy } = recommendationPayload;
  
  if (!recommendation) return null;

  const { type, data, resumeUrl, estimatedTimeRemaining } = recommendation;
  
  let Icon = PlayCircle;
  let title = "Resume Lesson";
  let description = data?.title || "Continue where you left off.";
  
  if (type === 'ASSESSMENT') {
    Icon = Brain;
    title = "Complete Assessment";
  } else if (type === 'RECOMMENDATION') {
    Icon = CheckCircle;
    title = "Next Recommended Lesson";
  }

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-indigo-900/20">
      <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10 flex gap-4 md:gap-6 items-start md:items-center">
        <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
          <Icon className="w-6 h-6 md:w-8 md:h-8" />
        </div>
        
        <div>
          <h2 className="text-sm font-bold tracking-widest uppercase text-indigo-400 mb-1 flex items-center gap-2">
            {title}
            {generatedBy === 'ai' && <Sparkles className="w-4 h-4 text-purple-400" />}
          </h2>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{description}</h3>
          
          {reason && (
            <p className="text-sm text-indigo-200/90 mb-3 italic">"{reason}"</p>
          )}

          <div className="flex items-center gap-2 text-sm text-indigo-200/70">
            <Clock className="w-4 h-4" />
            <span>Estimated time: {estimatedTimeRemaining} min</span>
          </div>
        </div>
      </div>
      
      <Link 
        href={resumeUrl}
        className="relative z-10 whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-colors flex items-center gap-2"
      >
        Continue Now
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}
