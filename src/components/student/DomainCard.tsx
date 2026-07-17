import React from 'react';
import Link from 'next/link';

interface DomainCardProps {
  title: string;
  progress: number;
  icon: string;
  color: string;
}

export const DomainCard: React.FC<DomainCardProps> = ({ title, progress, icon, color }) => {
  return (
    <Link href={`/student/domain/${title.toLowerCase().replace(/ /g, '-')}`} className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${color}`}>
          {icon}
        </div>
        <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-xs font-semibold text-gray-500">{progress}%</span>
      </div>
    </Link>
  );
};
