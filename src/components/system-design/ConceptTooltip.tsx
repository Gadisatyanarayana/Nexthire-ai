"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useVisualLearningStore } from '@/lib/store/visualLearningStore';
import { Info, ExternalLink, Activity } from 'lucide-react';

interface ConceptTooltipProps {
  term: string;
  definition: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  interviewImportance: 'High' | 'Medium' | 'Low';
  lessonLink?: string;
  children: React.ReactNode;
}

export default function ConceptTooltip({ 
  term, 
  definition, 
  difficulty, 
  interviewImportance, 
  lessonLink, 
  children 
}: ConceptTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { setHighlightedConcept } = useVisualLearningStore();

  const handleMouseEnter = () => {
    setIsVisible(true);
    setHighlightedConcept(term);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    setHighlightedConcept(null);
  };

  const difficultyColor = 
    difficulty === 'Beginner' ? 'text-emerald-500 bg-emerald-500/10' :
    difficulty === 'Intermediate' ? 'text-amber-500 bg-amber-500/10' :
    'text-rose-500 bg-rose-500/10';

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="cursor-help underline decoration-dashed decoration-cyan-500/50 hover:decoration-cyan-500 transition-colors text-cyan-500 font-medium">
        {children}
      </span>

      {isVisible && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 bg-background border border-foreground/10 shadow-2xl rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-bold text-sm flex items-center gap-1.5">
              <Info className="h-4 w-4 text-cyan-500" />
              {term}
            </h4>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${difficultyColor}`}>
              {difficulty}
            </span>
          </div>
          
          <p className="text-xs opacity-80 leading-relaxed mb-3">
            {definition}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-foreground/10">
            <div className="flex items-center gap-1.5 text-xs opacity-70">
              <Activity className="h-3.5 w-3.5" />
              Interview: <strong className={interviewImportance === 'High' ? 'text-rose-500' : ''}>{interviewImportance}</strong>
            </div>

            {lessonLink && (
              <Link 
                href={lessonLink}
                className="text-xs text-cyan-500 hover:underline flex items-center gap-1"
              >
                Learn More <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
          
          {/* Triangle Pointer */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-8 border-transparent border-t-background" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-[1px] border-8 border-transparent border-t-foreground/10 z-[-1]" />
        </div>
      )}
    </span>
  );
}
