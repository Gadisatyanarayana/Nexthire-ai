import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import { useVisualLearningStore } from '@/lib/store/visualLearningStore';

export interface AnimationStep {
  id: string;
  label: string;
  description: string;
  componentType: 'client' | 'gateway' | 'loadbalancer' | 'server' | 'cache' | 'database' | 'queue';
}

interface AnimationEngineProps {
  steps: AnimationStep[];
}

export default function AnimationEngine({ steps }: AnimationEngineProps) {
  const { 
    currentStep, 
    playbackState, 
    setCurrentStep, 
    setPlaybackState, 
    nextStep, 
    prevStep, 
    resetPlayback,
    animationSpeed
  } = useVisualLearningStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (playbackState === 'playing') {
      timerRef.current = setInterval(() => {
        if (currentStep < steps.length - 1) {
          nextStep();
        } else {
          setPlaybackState('completed');
        }
      }, 2000 / animationSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playbackState, currentStep, steps.length, nextStep, setPlaybackState, animationSpeed]);

  const handlePlayPause = () => {
    if (playbackState === 'completed') {
      resetPlayback();
      setPlaybackState('playing');
    } else {
      setPlaybackState(playbackState === 'playing' ? 'paused' : 'playing');
    }
  };

  const activeStepObj = steps[currentStep];

  return (
    <div className="w-full bg-foreground/5 rounded-2xl border border-foreground/10 overflow-hidden flex flex-col h-[400px]">
      
      {/* Visualization Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isPassed = idx < currentStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ 
                  opacity: isActive || isPassed ? 1 : 0.3, 
                  x: 0, 
                  scale: isActive ? 1.1 : 1,
                  filter: isActive ? 'blur(0px)' : 'blur(2px)'
                }}
                transition={{ duration: 0.5 }}
                className={`absolute flex flex-col items-center gap-3 transition-colors ${
                  isActive ? 'text-cyan-500 z-10' : 'text-foreground/50 z-0'
                }`}
                style={{
                  left: `${(idx / (steps.length - 1)) * 80 + 10}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className={`p-4 rounded-xl border-2 ${
                  isActive ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 
                  isPassed ? 'border-emerald-500/50 bg-emerald-500/5' : 
                  'border-foreground/10 bg-foreground/5'
                }`}>
                  <div className="font-mono font-bold text-sm">{step.label}</div>
                </div>
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-4 bg-background border border-foreground/10 p-3 rounded-xl text-xs w-48 text-center shadow-xl"
                  >
                    {step.description}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Animated Paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[-1]">
          {steps.map((_, idx) => {
            if (idx === steps.length - 1) return null;
            const isPassed = idx < currentStep;
            return (
              <motion.line
                key={`line-${idx}`}
                x1={`${(idx / (steps.length - 1)) * 80 + 10}%`}
                y1="50%"
                x2={`${((idx + 1) / (steps.length - 1)) * 80 + 10}%`}
                y2="50%"
                stroke={isPassed ? '#06b6d4' : 'rgba(255,255,255,0.1)'}
                strokeWidth="2"
                strokeDasharray={isPassed ? "0" : "4 4"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: isPassed ? 1 : 0 }}
                transition={{ duration: 1 }}
              />
            );
          })}
        </svg>
      </div>

      {/* Playback Controls */}
      <div className="h-16 border-t border-foreground/10 bg-background/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button onClick={resetPlayback} className="p-2 hover:bg-foreground/10 rounded-full transition-colors opacity-70 hover:opacity-100">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={prevStep} disabled={currentStep === 0} className="p-2 hover:bg-foreground/10 rounded-full transition-colors disabled:opacity-30">
            <SkipBack className="h-4 w-4" />
          </button>
          <button onClick={handlePlayPause} className="p-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full transition-colors shadow-lg shadow-cyan-500/20">
            {playbackState === 'playing' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <button onClick={nextStep} disabled={currentStep === steps.length - 1} className="p-2 hover:bg-foreground/10 rounded-full transition-colors disabled:opacity-30">
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono opacity-60">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <div className="h-1.5 w-32 bg-foreground/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-cyan-500" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
