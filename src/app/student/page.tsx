'use client';
import React from 'react';
import { ContinueLearningCard } from '../../components/student/ContinueLearningCard';
import { DomainCard } from '../../components/student/DomainCard';
import { RecommendationWidget } from '../../components/student/RecommendationWidget';

export default function StudentDashboard() {
  return (
    <div className="space-y-10">
      {/* Header & Streaks */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back, Alex! 👋</h1>
          <p className="mt-2 text-gray-500 max-w-2xl text-lg">You're doing great. You've solved 14 questions this week. Let's keep the momentum going.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-orange-500">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none">12</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Day Streak</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Continue Learning */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Jump Back In
            </h2>
            <ContinueLearningCard 
              title="Time and Work - Advanced Concepts"
              domain="Quantitative Aptitude"
              progress={65}
              totalQuestions={24}
              completedQuestions={15}
            />
          </section>

          {/* Explore Domains */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Explore Curriculum</h2>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">View All Domains &rarr;</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DomainCard title="Quantitative Aptitude" progress={32} icon="📊" color="bg-blue-50 text-blue-700" />
              <DomainCard title="Logical Reasoning" progress={12} icon="🧩" color="bg-purple-50 text-purple-700" />
              <DomainCard title="Verbal Ability" progress={0} icon="📝" color="bg-green-50 text-green-700" />
              <DomainCard title="Data Structures" progress={45} icon="💻" color="bg-orange-50 text-orange-700" />
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* AI Recommendations */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span> Smart Recommendations
            </h2>
            <div className="space-y-4">
              <RecommendationWidget 
                type="WEAK_TOPIC" 
                title="Review: Probability" 
                reason="Your accuracy dropped to 42% in recent mocks." 
              />
              <RecommendationWidget 
                type="COMPANY_PREP" 
                title="TCS NQT Simulation" 
                reason="You have 3 days left to reach the 80% readiness threshold." 
              />
              <RecommendationWidget 
                type="REVISION" 
                title="Formula: Compound Interest" 
                reason="Due for spaced repetition today." 
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
