import React, { useState } from 'react';
import { Undo, Redo, ZoomIn, ZoomOut, Download, Printer, Share2, Loader2, Target, CheckCircle2, FileText, Compass } from 'lucide-react';
import { ResumeDocument } from '../types';
import ResumeAnalytics from './ResumeAnalytics';

interface ToolbarProps {
  saving: boolean;
  lastSaved: Date | null;
  error: string;
  form: ResumeDocument;
  onSave: () => void;
  onPrint: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function Toolbar({ saving, lastSaved, error, form, onSave, onPrint, onZoomIn, onZoomOut }: ToolbarProps) {
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [scoring, setScoring] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [generatingCoach, setGeneratingCoach] = useState(false);

  const handleATSAnalyze = async () => {
    setScoring(true);
    try {
      const res = await fetch('/api/resume/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: form })
      });
      const result = await res.json();
      if (result.success && result.data?.overallScore) {
        setAtsScore(result.data.overallScore);
        form.intelligence = {
          ...form.intelligence,
          atsAnalysis: result.data
        } as any;
        setShowAnalytics(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScoring(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setGeneratingLetter(true);
    try {
      const res = await fetch('/api/resume/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: form, style: 'Modern' })
      });
      const result = await res.json();
      if (result.success) {
        alert("Cover Letter Generated (Check console for raw markdown)");
        console.log(result.data.coverLetter);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleCoach = async () => {
    setGeneratingCoach(true);
    try {
      const res = await fetch('/api/resume/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: form })
      });
      const result = await res.json();
      if (result.success) {
        alert("AI Coaching Plan Generated (Check console for raw JSON)");
        console.log(result.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingCoach(false);
    }
  };

  return (
    <>
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

      {/* ATS Score & Export Controls */}
      <div className="flex items-center gap-2 pl-4 border-l border-white/10">
        <button 
          onClick={handleCoach}
          disabled={generatingCoach}
          className="flex items-center gap-1.5 p-1.5 px-3 rounded hover:bg-white/10 transition text-sm text-gray-400"
        >
          {generatingCoach ? <Loader2 className="h-4 w-4 animate-spin"/> : <Compass className="h-4 w-4" />}
          Coach
        </button>
        <button 
          onClick={handleGenerateCoverLetter}
          disabled={generatingLetter}
          className="flex items-center gap-1.5 p-1.5 px-3 rounded hover:bg-white/10 transition text-sm text-gray-400"
        >
          {generatingLetter ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileText className="h-4 w-4" />}
          Cover Letter
        </button>
        <button 
          onClick={() => { if (atsScore) setShowAnalytics(true); else handleATSAnalyze(); }}
          disabled={scoring}
          className={`flex items-center gap-1.5 p-1.5 px-3 rounded transition text-sm font-medium border ${atsScore ? (atsScore > 80 ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400') : 'border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'}`}
        >
          {scoring ? <Loader2 className="h-4 w-4 animate-spin"/> : atsScore ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />}
          {scoring ? "Analyzing..." : atsScore ? `ATS Score: ${atsScore}` : "Check ATS Score"}
        </button>
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
      
      {showAnalytics && <ResumeAnalytics document={form} onClose={() => setShowAnalytics(false)} />}
    </>
  );
}
