"use client";

import React, { useState } from 'react';

export default function ArchitectureGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/system-design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode: 'full_architecture' })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      alert('Failed to generate architecture');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4">AI Architecture Generator</h2>
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="e.g., Design WhatsApp with 100M DAU..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Design'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-400 mb-2">{result.title}</h1>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div>
                <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">Requirements</h3>
                <ul className="list-disc pl-5 text-gray-300 space-y-2">
                  {result.requirements.map((req: string, i: number) => <li key={i}>{req}</li>)}
                </ul>
             </div>
             
             <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-emerald-400 mb-4 border-b border-gray-700 pb-2">Capacity & Cost Estimation</h3>
                <div className="space-y-2 text-sm text-gray-300">
                   <p><span className="font-bold text-white">Storage:</span> {result.capacity_estimation.storage}</p>
                   <p><span className="font-bold text-white">Bandwidth:</span> {result.capacity_estimation.bandwidth}</p>
                   <p><span className="font-bold text-white">Requests/s:</span> {result.capacity_estimation.requests_per_sec}</p>
                   <div className="mt-4 pt-2 border-t border-gray-700">
                      <span className="font-bold text-white">Est. Cost:</span> {result.cost_estimation}
                   </div>
                </div>
             </div>
          </div>

          <div>
             <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">API Design</h3>
             <div className="space-y-4">
                {result.api_design.map((api: any, i: number) => (
                   <div key={i} className="flex bg-gray-800 rounded overflow-hidden">
                      <div className="bg-indigo-900/50 text-indigo-400 font-bold px-4 py-2 border-r border-gray-700 w-24 text-center">
                         {api.method}
                      </div>
                      <div className="px-4 py-2 font-mono text-gray-300 border-r border-gray-700 flex-1">
                         {api.endpoint}
                      </div>
                      <div className="px-4 py-2 text-gray-400 text-sm flex-1">
                         {api.description}
                      </div>
                   </div>
                ))}
             </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">High Level Design (Mermaid)</h3>
            <pre className="bg-gray-950 p-4 rounded text-sm text-gray-300 overflow-x-auto border border-gray-800">
              <code>{result.hld}</code>
            </pre>
          </div>
          
          <div>
             <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">Database Schema</h3>
             <div className="prose prose-invert max-w-none text-gray-300">
                <pre className="bg-transparent whitespace-pre-wrap font-sans">{result.database_schema}</pre>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div>
                <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">Tradeoffs</h3>
                <ul className="list-disc pl-5 text-orange-300 space-y-2">
                  {result.tradeoffs.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
             </div>
             <div>
                <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">Scaling Strategy</h3>
                <ul className="list-disc pl-5 text-blue-300 space-y-2">
                  {result.scaling.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
