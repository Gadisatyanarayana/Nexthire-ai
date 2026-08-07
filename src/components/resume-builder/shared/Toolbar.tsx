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
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur-xl z-50 print:hidden text-gray-300 shadow-sm relative">
        
        {/* Subtle top highlight for glass effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        
      {/* Undo/Redo & Zoom Group */}
      <div className="flex items-center gap-1.5 border-r border-white/10 pr-6">
        <button className="p-2 rounded-lg hover:bg-white/5 transition-all duration-200 text-gray-500 cursor-not-allowed hover:text-gray-400">
          <Undo className="h-4 w-4" />
        </button>
        <button className="p-2 rounded-lg hover:bg-white/5 transition-all duration-200 text-gray-500 cursor-not-allowed hover:text-gray-400">
          <Redo className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-white/5 mx-2"></div>
        
        <button onClick={onZoomOut} className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={onZoomIn} className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white">
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
      
      {/* Autosave Status */}
      <div className="text-xs flex items-center gap-2 font-medium tracking-wide">
        {error ? (
          <span className="text-red-400/90 flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">{error}</span>
        ) : saving ? (
          <span className="flex items-center gap-2 text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-blue"/> Saving securely...
          </span>
        ) : lastSaved ? (
          <span className="text-gray-400 flex items-center gap-2 bg-green-500/5 px-3 py-1.5 rounded-full border border-green-500/10 transition-all duration-500">
            <span className="w-2 h-2 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span> 
            Saved to Cloud
          </span>
        ) : null}
      </div>

      {/* ATS Score & Export Controls */}
      <div className="flex items-center gap-3 pl-6 border-l border-white/10">
        <button 
          onClick={handleCoach}
          disabled={generatingCoach}
          className="group flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-300 text-sm font-medium text-gray-300 hover:text-white"
        >
          {generatingCoach ? <Loader2 className="h-4 w-4 animate-spin text-purple-400"/> : <Compass className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />}
          AI Coach
        </button>
        <button 
          onClick={handleGenerateCoverLetter}
          disabled={generatingLetter}
          className="group flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-300 text-sm font-medium text-gray-300 hover:text-white"
        >
          {generatingLetter ? <Loader2 className="h-4 w-4 animate-spin text-blue-400"/> : <FileText className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />}
          Cover Letter
        </button>
        
        <div className="w-px h-6 bg-white/5 mx-1"></div>

        <button 
          onClick={() => { if (atsScore) setShowAnalytics(true); else handleATSAnalyze(); }}
          disabled={scoring}
          className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 text-sm font-semibold shadow-lg ${
            atsScore 
              ? (atsScore > 80 
                  ? 'border border-green-500/40 bg-green-500/15 text-green-300 hover:bg-green-500/25' 
                  : 'border border-yellow-500/40 bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500/25') 
              : 'border border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-brand-blue/20 text-purple-300 hover:from-purple-600/30 hover:to-brand-blue/30 hover:border-purple-500/50'
          }`}
        >
          {scoring ? <Loader2 className="h-4 w-4 animate-spin"/> : atsScore ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />}
          {scoring ? "Analyzing..." : atsScore ? `ATS Score: ${atsScore}` : "Check ATS Score"}
        </button>
        
        <button className="flex items-center gap-2 p-2 rounded-full hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white" title="Share Resume">
          <Share2 className="h-4 w-4" />
        </button>
        <button onClick={onPrint} className="flex items-center gap-2 p-2 rounded-full hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white" title="Print Resume">
          <Printer className="h-4 w-4" />
        </button>
        <button 
          onClick={onPrint} 
          className="flex items-center gap-2 px-6 py-2 ml-2 rounded-full bg-white text-black hover:bg-gray-100 transition-all duration-300 text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 active:translate-y-0"
        >
          <Download className="h-4 w-4" /> Export PDF
        </button>
      </div>

    </div>
      
      {showAnalytics && <ResumeAnalytics document={form} onClose={() => setShowAnalytics(false)} />}
    </>
  );
}
