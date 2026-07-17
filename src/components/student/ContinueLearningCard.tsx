import React from 'react';

interface ContinueLearningCardProps {
  title: string;
  domain: string;
  progress: number;
  totalQuestions: number;
  completedQuestions: number;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  title,
  domain,
  progress,
  totalQuestions,
  completedQuestions
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
        <div className="h-1 bg-indigo-600 rounded-r-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600 mb-1">{domain}</p>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{title}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-gray-900">{completedQuestions}</span> / {totalQuestions} completed
          </div>
          <span className="text-gray-300">•</span>
          <span className="font-medium text-gray-900">{progress}%</span>
        </div>
      </div>
    </div>
  );
};
