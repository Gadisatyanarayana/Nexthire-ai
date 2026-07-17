import React from 'react';
import Link from 'next/link';

interface RecommendationWidgetProps {
  type: 'WEAK_TOPIC' | 'COMPANY_PREP' | 'REVISION' | 'SIMILAR_QUESTIONS';
  title: string;
  reason: string;
}

export const RecommendationWidget: React.FC<RecommendationWidgetProps> = ({ type, title, reason }) => {
  const configs = {
    WEAK_TOPIC: { icon: '🎯', color: 'bg-rose-50 border-rose-100 text-rose-600', badge: 'Focus Area' },
    COMPANY_PREP: { icon: '🏢', color: 'bg-blue-50 border-blue-100 text-blue-600', badge: 'Goal' },
    REVISION: { icon: '🔄', color: 'bg-emerald-50 border-emerald-100 text-emerald-600', badge: 'Spaced Repetition' },
    SIMILAR_QUESTIONS: { icon: '💡', color: 'bg-amber-50 border-amber-100 text-amber-600', badge: 'Practice' }
  };

  const config = configs[type];

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.color} bg-opacity-50 border`}>
          {config.badge}
        </span>
        <span className="text-xl">{config.icon}</span>
      </div>
      <h4 className="font-bold text-gray-900 text-base mb-1">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed mb-4">{reason}</p>
      
      <Link href="#" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
        Start now
        <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </div>
  );
};
