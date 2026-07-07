"use client";

import { useVisualLearningStore, VisualMode } from '@/lib/store/visualLearningStore';
import { BookOpen, MousePointer2, PlayCircle, Presentation, Network } from 'lucide-react';
import InteractiveDiagram from './visuals/InteractiveDiagram';
import AnimationEngine from './visuals/AnimationEngine';
import KnowledgeGraph from './KnowledgeGraph';

interface LessonVisualsSwitcherProps {
  children: React.ReactNode; // The standard text-based theory content
  diagrams?: Array<{ id: string; type: 'react_flow' | 'mermaid' | 'svg'; content: string; title?: string; isInteractive?: boolean }>;
  animationSteps?: Array<any>;
}

export default function LessonVisualsSwitcher({ children, diagrams, animationSteps }: LessonVisualsSwitcherProps) {
  const { visualMode, setVisualMode } = useVisualLearningStore();

  const modes: { id: VisualMode; label: string; icon: React.ReactNode }[] = [
    { id: 'reading', label: 'Reading Mode', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'visual', label: 'Visual Mode', icon: <Network className="h-4 w-4" /> },
  ];

  if (animationSteps && animationSteps.length > 0) {
    modes.push({ id: 'animation', label: 'Animation', icon: <PlayCircle className="h-4 w-4" /> });
  }

  // Phase 3 Foundation capabilities ready for Phase 4 extensions
  modes.push({ id: 'interview', label: 'Interview Mode', icon: <Presentation className="h-4 w-4" /> });

  return (
    <div className="space-y-6">
      {/* Mode Toggle Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-foreground/5 rounded-xl border border-foreground/10 w-fit">
        {modes.map(mode => (
          <button
            key={mode.id}
            onClick={() => setVisualMode(mode.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              visualMode === mode.id 
                ? 'bg-background shadow-sm text-cyan-500' 
                : 'text-foreground/60 hover:text-foreground/90 hover:bg-foreground/5'
            }`}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      {/* Render Content Based on Mode */}
      <div className="relative">
        {visualMode === 'reading' && (
          <div className="animate-in fade-in duration-300">
            {children}
          </div>
        )}

        {(visualMode === 'visual' || visualMode === 'interview') && diagrams && diagrams.length > 0 && (
          <div className="animate-in fade-in duration-300 space-y-6">
            {visualMode === 'interview' && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-mono flex items-center gap-2">
                <Presentation className="h-4 w-4" />
                Interview Practice Mode Active: Labels are obfuscated. Explain the architecture aloud.
              </div>
            )}
            
            {diagrams.map(diagram => (
              <InteractiveDiagram 
                key={diagram.id}
                id={diagram.id}
                type={diagram.type}
                content={diagram.content}
                title={diagram.title}
                isInteractive={diagram.isInteractive}
              />
            ))}
            
            {/* Fallback theory content below diagrams in visual mode */}
            <div className="opacity-70 mt-8 pt-8 border-t border-dashed border-foreground/20">
              {children}
            </div>
          </div>
        )}

        {visualMode === 'animation' && animationSteps && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <AnimationEngine steps={animationSteps} />
            <div className="opacity-70 mt-8 pt-8 border-t border-dashed border-foreground/20">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
