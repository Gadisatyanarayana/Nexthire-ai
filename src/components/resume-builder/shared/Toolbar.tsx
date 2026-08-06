import React from 'react';
import { Undo, Redo, ZoomIn, ZoomOut, Download, Printer, Save, Share2, Loader2 } from 'lucide-react';

interface ToolbarProps {
  saving: boolean;
  lastSaved: Date | null;
  error: string;
  onSave: () => void;
  onPrint: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function Toolbar({ saving, lastSaved, error, onSave, onPrint, onZoomIn, onZoomOut }: ToolbarProps) {
  return (
    <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0a0a0a] z-50 print:hidden text-gray-300">
      
      {/* Undo/Redo & Zoom Group */}
      <div className="flex items-center gap-2 border-r border-white/10 pr-4">
        <button className="p-1.5 rounded hover:bg-white/10 transition text-gray-500 cursor-not-allowed">
          <Undo className="h-4 w-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-white/10 transition text-gray-500 cursor-not-allowed">
          <Redo className="h-4 w-4" />
        </button>
        
        <div className="w-px h-4 bg-white/10 mx-2"></div>
        
        <button onClick={onZoomOut} className="p-1.5 rounded hover:bg-white/10 transition">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={onZoomIn} className="p-1.5 rounded hover:bg-white/10 transition">
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
      
      {/* Autosave Status */}
      <div className="text-xs flex items-center gap-2">
        {error ? (
          <span className="text-red-400 font-medium">{error}</span>
        ) : saving ? (
          <span className="flex items-center gap-1.5 text-gray-400">
            <Loader2 className="h-3 w-3 animate-spin"/> Saving changes...
          </span>
        ) : lastSaved ? (
          <span className="text-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 
            All changes saved
          </span>
        ) : null}
      </div>

      {/* Export Controls */}
      <div className="flex items-center gap-2 pl-4 border-l border-white/10">
        <button className="flex items-center gap-1.5 p-1.5 px-3 rounded hover:bg-white/10 transition text-sm">
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
        <button onClick={onPrint} className="flex items-center gap-1.5 p-1.5 px-3 rounded hover:bg-white/10 transition text-sm">
          <Printer className="h-3.5 w-3.5" /> Print
        </button>
        <button onClick={onPrint} className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-brand-blue text-white hover:bg-blue-600 transition text-sm font-medium">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </button>
      </div>

    </div>
  );
}
