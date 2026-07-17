'use client';
import React, { useState } from 'react';

export default function CodingPlatform() {
  const [activeTab, setActiveTab] = useState<'Description' | 'Editorial' | 'Solutions' | 'Submissions'>('Description');

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-2 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 p-2 bg-gray-900 text-gray-300 font-mono">
      {/* LEFT PANE: Problem Description */}
      <div className="w-1/2 flex flex-col bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <div className="flex border-b border-gray-700 bg-gray-800/80">
          {['Description', 'Editorial', 'Solutions', 'Submissions'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-xs font-semibold border-t-2 transition-colors ${activeTab === tab ? 'border-blue-500 text-white bg-gray-700' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 font-sans text-sm">
          {activeTab === 'Description' && (
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-xl font-bold text-white">1. Two Sum</h1>
              </div>
              <div className="flex gap-2 mb-6">
                <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded-md">Easy</span>
                <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-md">Amazon</span>
                <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-md">Google</span>
              </div>
              <div className="text-gray-300 leading-relaxed mb-8">
                <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
                <p className="mt-4">You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>
                <p className="mt-4">You can return the answer in any order.</p>
              </div>
              
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 mb-4">
                <p className="font-semibold text-white mb-2">Example 1:</p>
                <p><span className="text-gray-400">Input:</span> nums = [2,7,11,15], target = 9</p>
                <p><span className="text-gray-400">Output:</span> [0,1]</p>
                <p><span className="text-gray-400">Explanation:</span> Because nums[0] + nums[1] == 9, we return [0, 1].</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Code Editor & Test Cases */}
      <div className="w-1/2 flex flex-col gap-2">
        {/* Editor Area */}
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex flex-col">
          <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
            <select className="bg-gray-700 text-xs text-white border-none rounded py-1 px-2 focus:ring-0 cursor-pointer">
              <option>Python 3</option>
              <option>Java</option>
              <option>C++</option>
              <option>JavaScript</option>
            </select>
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-white p-1" title="Format Code">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </button>
              <button className="text-gray-400 hover:text-white p-1" title="Reset to Default">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-[#1e1e1e] p-4 text-sm relative">
            <pre className="text-[#d4d4d4] font-mono leading-relaxed">
<span className="text-[#569cd6]">class</span> <span className="text-[#4ec9b0]">Solution</span>:<br/>
    <span className="text-[#569cd6]">def</span> <span className="text-[#dcdcaa]">twoSum</span>(<span className="text-[#9cdcfe]">self</span>, <span className="text-[#9cdcfe]">nums</span>: <span className="text-[#4ec9b0]">List</span>[<span className="text-[#4ec9b0]">int</span>], <span className="text-[#9cdcfe]">target</span>: <span className="text-[#4ec9b0]">int</span>) -&gt; <span className="text-[#4ec9b0]">List</span>[<span className="text-[#4ec9b0]">int</span>]:<br/>
        <span className="text-[#6a9955]"># Write your code here</span><br/>
        <span className="text-[#569cd6]">pass</span>
            </pre>
            <div className="absolute top-2 right-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/50 text-xs flex items-center gap-1 cursor-pointer hover:bg-indigo-500/30 transition-colors">
              <span>✨</span> Ask AI Tutor
            </div>
          </div>
        </div>

        {/* Test Cases Area */}
        <div className="h-64 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex flex-col">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex gap-4">
              <button className="text-xs font-semibold text-white border-b-2 border-blue-500 pb-1">Test Cases</button>
              <button className="text-xs font-semibold text-gray-500 hover:text-gray-300 pb-1">Test Result</button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex gap-2 mb-4">
              <button className="px-3 py-1 text-xs bg-gray-700 text-white rounded">Case 1</button>
              <button className="px-3 py-1 text-xs bg-gray-900 text-gray-400 rounded hover:bg-gray-700">Case 2</button>
              <button className="px-3 py-1 text-xs bg-gray-900 text-gray-400 rounded hover:bg-gray-700">+</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">nums =</label>
                <div className="bg-gray-900 p-2 rounded text-sm text-gray-300">[2,7,11,15]</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">target =</label>
                <div className="bg-gray-900 p-2 rounded text-sm text-gray-300">9</div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
            <button className="px-4 py-1.5 text-xs font-semibold text-gray-300 bg-gray-700 rounded hover:bg-gray-600 transition-colors">Run Custom</button>
            <div className="flex gap-2">
              <button className="px-6 py-1.5 text-xs font-semibold text-gray-800 bg-gray-300 rounded hover:bg-white transition-colors">Run Code</button>
              <button className="px-6 py-1.5 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-500 transition-colors">Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
