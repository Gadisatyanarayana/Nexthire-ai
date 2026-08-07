import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { X, Target, Briefcase, Zap, Trophy, MessageSquare, AlertTriangle, Info } from 'lucide-react';
import { ResumeDocument, ATSAnalysis } from '../types';

interface ResumeAnalyticsProps {
  document: ResumeDocument;
  onClose: () => void;
}

export default function ResumeAnalytics({ document, onClose }: ResumeAnalyticsProps) {
  const ats = document.intelligence?.atsAnalysis;

  if (!ats) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
        <div className="bg-[#111] border border-white/10 rounded-xl p-8 max-w-md w-full relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <div className="text-center space-y-4">
            <Target className="h-12 w-12 text-brand-blue mx-auto opacity-50" />
            <h2 className="text-xl font-bold text-white">No Analytics Available</h2>
            <p className="text-sm text-gray-400">Run the ATS Analyzer from the toolbar to generate your Resume Health Profile.</p>
          </div>
        </div>
      </div>
    );
  }

  const data = [
    { subject: 'Content', A: ats.dimensionScores.content, fullMark: 100 },
    { subject: 'Formatting', A: ats.dimensionScores.formatting, fullMark: 100 },
    { subject: 'Readability', A: ats.dimensionScores.readability, fullMark: 100 },
    { subject: 'Keywords', A: ats.dimensionScores.keywords, fullMark: 100 },
    { subject: 'Impact', A: ats.dimensionScores.impact, fullMark: 100 },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10">
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-blue" />
            Resume Health Profile
          </h2>
          <p className="text-sm text-gray-400 mt-1">Enterprise Applicant Tracking System Analysis</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Radar Chart */}
          <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 w-full text-left uppercase tracking-wider">Dimension Mapping</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="#0070f3" fill="#0070f3" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="text-3xl font-black text-white mt-2 flex items-center gap-2">
              {ats.overallScore} <span className="text-sm font-normal text-gray-500">/ 100 Overall</span>
            </div>
          </div>

          {/* Review Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Trophy className="h-4 w-4" /> Strengths
              </h3>
              <ul className="space-y-2">
                {ats.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Zap className="h-4 w-4" /> Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {ats.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span> {w}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-white/5">
              <h3 className="text-sm font-semibold text-brand-blue mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Briefcase className="h-4 w-4" /> Recommendations
              </h3>
              <div className="space-y-3">
                {ats.recommendations.map((r, i) => (
                <div key={i} className="flex gap-2">
                  {r.priority === 'HIGH' ? (
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-300">{r.text}</span>
                </div>
              ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
