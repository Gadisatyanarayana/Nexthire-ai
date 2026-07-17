'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function QuestionExperience() {
  const [activeTab, setActiveTab] = useState<'Description' | 'Hints' | 'Notes' | 'Discussion'>('Description');
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4">
      {/* LEFT PANE: Question & Metadata */}
      <div className="w-1/2 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {['Description', 'Hints', 'Notes', 'Discussion'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'Description' && (
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold text-gray-900">412. Time and Work Complex</h1>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-md">Hard</span>
                  <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Metadata Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">TCS</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">Infosys</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">Bloom: Evaluate</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">Accuracy: 42%</span>
              </div>

              {/* Content */}
              <div className="prose prose-indigo max-w-none text-gray-800">
                <p>If A can do a piece of work in 10 days, B can do the same work in 15 days, and C can do it in 20 days. They all begin together, but A leaves after 2 days and B leaves 3 days before the work is finished.</p>
                <p>How many days did it take to complete the total work?</p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                <button className="hover:text-indigo-600">Report Issue</button>
                <span>Avg Solve Time: 2m 45s</span>
              </div>
            </div>
          )}

          {activeTab === 'Hints' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <h4 className="font-semibold text-amber-800 mb-2">Hint 1</h4>
                <p className="text-amber-900 text-sm">Find the total units of work by calculating the LCM of 10, 15, and 20.</p>
              </div>
              <button className="w-full py-3 bg-gray-50 border border-dashed border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                Reveal Hint 2
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Options & Explanations */}
      <div className="w-1/2 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Select an Option</h3>
          <div className="space-y-3 mb-8">
            {['8.5 days', '9.2 days', '10.5 days', '12 days'].map((opt, idx) => (
              <button key={idx} className="w-full p-4 text-left bg-white border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 font-medium text-gray-800">
                <span className="inline-block w-8 h-8 rounded bg-gray-100 text-gray-600 text-center leading-8 mr-3 font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowExplanation(true)}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-colors"
          >
            Submit Answer
          </button>

          {/* Post-submission Explanation */}
          {showExplanation && (
            <div className="mt-8 animate-fade-in-up">
              <div className="p-6 bg-white border border-green-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">✓</div>
                  <h3 className="text-lg font-bold text-gray-900">Correct!</h3>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2">Step-by-Step Explanation:</h4>
                <div className="prose prose-sm prose-indigo text-gray-700 mb-6">
                  <ol>
                    <li>Total Work = LCM(10, 15, 20) = 60 units.</li>
                    <li>A's 1-day work = 6 units. B = 4 units. C = 3 units.</li>
                    <li>A worked for 2 days. Work done by A = 12 units. Remaining = 48 units.</li>
                    <li>Let total time = $x$ days. B leaves 3 days before end, so B worked for $(x-3)$ days. C worked for $x$ days.</li>
                    <li>$4(x-3) + 3x = 48 \Rightarrow 7x - 12 = 48 \Rightarrow 7x = 60 \Rightarrow x = 60/7 = 8.57$ days.</li>
                  </ol>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6">
                  <h4 className="font-semibold text-indigo-900 mb-1 flex items-center gap-2">
                    <span>💡</span> Formula Reference
                  </h4>
                  <p className="text-indigo-800 text-sm font-mono">Work = Rate × Time</p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800">Ask AI Tutor</button>
                  <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800">Next Question &rarr;</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
