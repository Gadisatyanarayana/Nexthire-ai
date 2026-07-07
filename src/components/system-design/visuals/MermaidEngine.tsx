import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useVisualLearningStore } from '@/lib/store/visualLearningStore';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface MermaidEngineProps {
  content: string; // Raw Mermaid syntax
}

export default function MermaidEngine({ content }: MermaidEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const { visualMode } = useVisualLearningStore();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        darkMode: true, // We can sync this with global theme later
        background: 'transparent',
        primaryColor: '#06b6d4', // cyan-500
        secondaryColor: '#3b82f6', // blue-500
        tertiaryColor: '#1e293b', // slate-800
        lineColor: '#475569',
      },
      fontFamily: 'inherit',
    });

    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, content);
        setSvgContent(svg);
      } catch (e) {
        console.error("Failed to render Mermaid diagram", e);
        setSvgContent(`<div class="text-red-500 p-4 border border-red-500/20 rounded bg-red-500/10">Failed to render diagram syntax.</div>`);
      }
    };

    renderDiagram();
  }, [content]);

  // Handle Zoom Pan in a simple way for Mermaid SVGs
  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const handleReset = () => setScale(1);

  return (
    <div className="w-full h-full relative flex flex-col bg-background/50 rounded-xl overflow-hidden group">
      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleZoomIn} className="p-2 rounded-lg bg-background/80 border border-foreground/10 hover:bg-foreground/5">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={handleZoomOut} className="p-2 rounded-lg bg-background/80 border border-foreground/10 hover:bg-foreground/5">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={handleReset} className="p-2 rounded-lg bg-background/80 border border-foreground/10 hover:bg-foreground/5">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 w-full h-full flex items-center justify-center overflow-auto p-4 cursor-move"
      >
        {svgContent ? (
          <div 
            dangerouslySetInnerHTML={{ __html: svgContent }} 
            className={`transition-transform duration-200 ${visualMode === 'interview' ? 'blur-sm hover:blur-none' : ''}`}
            style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
          />
        ) : (
          <div className="animate-pulse opacity-50 font-mono text-sm">Rendering Mermaid...</div>
        )}
      </div>
    </div>
  );
}
