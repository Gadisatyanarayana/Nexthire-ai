import React from 'react';
import ArchitectureGenerator from '@/components/system-design/ai/ArchitectureGenerator';

export default function GeneratorPage() {
  return (
    <div className="min-h-screen bg-black font-sans">
      <header className="p-6 border-b border-gray-900 bg-black">
        <h1 className="text-2xl font-bold text-white">AI Architecture Generator</h1>
        <p className="text-sm text-gray-400">Generate full system designs instantly with capacity estimation and APIs.</p>
      </header>
      <div className="p-8">
        <ArchitectureGenerator />
      </div>
    </div>
  );
}
