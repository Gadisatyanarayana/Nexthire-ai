import React, { useState, useRef, useEffect } from 'react';
import { Undo, Redo, ZoomIn, ZoomOut, Download, Share2, Loader2, Target, CheckCircle2, FileText, Compass, ChevronDown, Sparkles, Sun, Moon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  
  const aiDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (aiDropdownRef.current && !aiDropdownRef.current.contains(event.target as Node)) {
        setShowAiDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleATSAnalyze = async () => {
    setScoring(true);
    setShowAiDropdown(false);
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
    setShowAiDropdown(false);
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
    setShowAiDropdown(false);
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

  const btnHover = "hover:bg-[var(--studio-border)]";
  const iconColor = "text-[var(--studio-muted)]";
  const iconHoverColor = "hover:text-[var(--studio-text)]";

  return (
    <>
      <div className="h-16 border-b border-[var(--studio-border)] flex items-center justify-between px-6 bg-[var(--studio-surface)] z-50 print:hidden shadow-sm transition-colors duration-300">
        
        {/* Left Section: Back, Resume Name, Status */}
        <div className="flex items-center gap-4">
          <Link href="/resume-builder" className={`flex items-center gap-1.5 text-sm font-medium ${iconColor} ${iconHoverColor} transition-colors`}>
            <ArrowLeft className="h-4 w-4" /> My Resumes
          </Link>
          
          <div className="w-px h-6 bg-[var(--studio-border)] mx-2"></div>
          
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--studio-text)]">
              {form.metadata?.targetRole ? `${form.metadata.targetRole} Resume` : "Untitled Resume"}
            </span>
            <div className="text-[10px] font-medium tracking-wide flex items-center gap-1.5 h-4">
              {error ? (
                <span className="text-red-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{error}</span>
              ) : saving ? (
                <span className="text-gray-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Saving...</span>
              ) : lastSaved ? (
                <span className="text-gray-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Saved ✓</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Center: Tools (Undo, Redo, Zoom) */}
        <div className="flex items-center gap-1">
          <button className={`p-2 rounded-md transition-colors cursor-not-allowed ${iconColor}`}>
            <Undo className="h-4 w-4" />
          </button>
          <button className={`p-2 rounded-md transition-colors cursor-not-allowed ${iconColor}`}>
            <Redo className="h-4 w-4" />
          </button>
          
          <div className="w-px h-5 bg-[var(--studio-border)] mx-2"></div>
          
          <button onClick={onZoomOut} className={`p-2 rounded-md transition-colors ${iconColor} ${btnHover}`}>
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-[var(--studio-muted)] min-w-[36px] text-center">100%</span>
          <button onClick={onZoomIn} className={`p-2 rounded-md transition-colors ${iconColor} ${btnHover}`}>
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Right Section: AI, Share, Export */}
        <div className="flex items-center gap-3">
          
          <div className="w-px h-5 bg-[var(--studio-border)] mx-1"></div>

          {/* AI Tools Dropdown */}
          <div className="relative" ref={aiDropdownRef}>
            <button 
              onClick={() => setShowAiDropdown(!showAiDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showAiDropdown ? 'bg-[var(--studio-border)] text-[var(--studio-accent)]' : `${iconColor} ${btnHover}`}`}
            >
              <Sparkles className="h-4 w-4 text-[var(--studio-accent)]" />
              AI Tools
              <ChevronDown className={`h-3 w-3 transition-transform ${showAiDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showAiDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--studio-surface)] border border-[var(--studio-border)] rounded-lg shadow-lg py-1.5 z-50">
                <button 
                  onClick={handleCoach} 
                  disabled={generatingCoach}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-[var(--studio-text)] hover:bg-[var(--studio-border)] disabled:opacity-50"
                >
                  {generatingCoach ? <Loader2 className="h-4 w-4 animate-spin"/> : <Compass className="h-4 w-4 text-purple-500"/>}
                  AI Coach
                </button>
                <button 
                  onClick={handleGenerateCoverLetter} 
                  disabled={generatingLetter}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-[var(--studio-text)] hover:bg-[var(--studio-border)] disabled:opacity-50"
                >
                  {generatingLetter ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileText className="h-4 w-4 text-[var(--studio-accent)]"/>}
                  Generate Cover Letter
                </button>
                <button 
                  onClick={() => { if (atsScore) setShowAnalytics(true); else handleATSAnalyze(); }}
                  disabled={scoring}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-[var(--studio-text)] hover:bg-[var(--studio-border)] disabled:opacity-50"
                >
                  {scoring ? <Loader2 className="h-4 w-4 animate-spin"/> : atsScore ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Target className="h-4 w-4 text-[var(--studio-accent)]" />}
                  {atsScore ? "View ATS Analysis" : "Analyze ATS Score"}
                </button>
              </div>
            )}
          </div>
          
          <button className={`p-2 rounded-md transition-colors ${iconColor} ${btnHover}`} title="Share Resume">
            <Share2 className="h-4 w-4" />
          </button>
          <button 
            onClick={onPrint} 
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-white text-black hover:bg-gray-200 transition-colors text-sm font-medium shadow-sm ml-1"
          >
            <Download className="h-4 w-4" /> Export PDF
          </button>
        </div>

      </div>
      
      {showAnalytics && <ResumeAnalytics document={form} onClose={() => setShowAnalytics(false)} />}
    </>
  );
}
