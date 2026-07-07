"use client";

import dynamic from "next/dynamic";
import { useVisualLearningStore } from "@/lib/store/visualLearningStore";
import { Maximize, Minimize, MousePointer2 } from "lucide-react";

// Lazy load heavy rendering engines
const ReactFlowEngine = dynamic(() => import("./ReactFlowEngine"), { 
  ssr: false, 
  loading: () => <DiagramSkeleton /> 
});
const MermaidEngine = dynamic(() => import("./MermaidEngine"), { 
  ssr: false, 
  loading: () => <DiagramSkeleton /> 
});

interface InteractiveDiagramProps {
  id: string;
  type: "react_flow" | "mermaid" | "svg";
  content: string; // JSON string for React Flow, Mermaid string for Mermaid
  title?: string;
  isInteractive?: boolean;
}

export default function InteractiveDiagram({ id, type, content, title, isInteractive = true }: InteractiveDiagramProps) {
  const { fullscreen, toggleFullscreen, selectedDiagram, setSelectedDiagram, visualMode } = useVisualLearningStore();
  
  const isSelected = selectedDiagram === id;
  const isFullscreen = fullscreen && isSelected;

  const handleSelect = () => {
    setSelectedDiagram(id);
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-background flex flex-col p-6 animate-in fade-in" 
    : "relative w-full rounded-2xl border border-foreground/10 bg-foreground/5 overflow-hidden transition-all group";

  return (
    <div 
      className={`${containerClasses} ${visualMode === 'interview' ? 'grayscale opacity-90' : ''}`}
      onClick={!isSelected ? handleSelect : undefined}
    >
      {/* Diagram Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isInteractive && (
          <div className="bg-background/80 backdrop-blur border border-foreground/10 px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-2">
            <MousePointer2 className="h-3 w-3" />
            Interactive
          </div>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); handleSelect(); toggleFullscreen(); }}
          className="p-2 rounded-xl bg-background/80 backdrop-blur border border-foreground/10 hover:bg-foreground/5 transition-colors"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>

      {title && !isFullscreen && (
        <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur border border-foreground/10 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
          {title}
        </div>
      )}

      {/* Render Appropriate Engine */}
      <div className={`w-full ${isFullscreen ? 'flex-1 h-full' : 'h-[400px] md:h-[500px]'}`}>
        {type === "react_flow" && <ReactFlowEngine content={content} isInteractive={isInteractive} />}
        {type === "mermaid" && <MermaidEngine content={content} />}
        {type === "svg" && (
          <div className="w-full h-full flex items-center justify-center p-8">
            {/* Safe SVG injection goes here, or just img tag */}
            <img src={content} alt={title || "Architecture Diagram"} className="max-w-full max-h-full object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}

function DiagramSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center animate-pulse bg-foreground/5">
      <div className="text-sm opacity-50 font-mono">Loading Visual Engine...</div>
    </div>
  );
}
