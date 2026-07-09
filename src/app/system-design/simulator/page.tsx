import React from 'react';
import SimulationEngine from '@/components/system-design/simulators/SimulationEngine';
import { LoadBalancerPlugin } from '@/components/system-design/simulators/plugins/LoadBalancerPlugin';
import { CachePlugin } from '@/components/system-design/simulators/plugins/CachePlugin';

export default function SimulatorPage() {
  return (
    <div className="min-h-screen bg-black p-8 font-sans">
      <div className="max-w-7xl mx-auto h-[800px] flex flex-col">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Architecture Simulation Lab</h1>
          <p className="text-gray-400">Interact with live simulations to understand distributed systems tradeoffs.</p>
        </header>
        
        <div className="flex-1 min-h-0">
          <SimulationEngine 
            plugins={[
              LoadBalancerPlugin,
              CachePlugin
            ]} 
          />
        </div>
      </div>
    </div>
  );
}
