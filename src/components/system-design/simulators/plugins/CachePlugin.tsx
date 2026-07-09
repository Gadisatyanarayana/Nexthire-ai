import React from 'react';
import { SimulationPlugin } from '../SimulationEngine';

export const CachePlugin: SimulationPlugin = {
  id: 'cache',
  name: 'Caching & Database',
  description: 'Simulate cache hits vs misses, and observe the impact on the database load.',
  defaultState: {
    traffic: 500,
    cacheHitRatio: 80,
    nodes: 1 // Single DB node for simplicity
  },
  renderVisuals: (state) => {
    const hits = Math.floor(state.traffic * (state.cacheHitRatio / 100));
    const misses = state.traffic - hits;
    const dbOverloaded = misses > 300;

    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-8">
        
        {/* App Server */}
        <div className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg z-10 w-64 text-center">
          Application Server<br/>
          <span className="text-sm font-normal text-blue-200">({state.traffic} req/s)</span>
        </div>

        <div className="flex justify-center gap-16 w-full max-w-2xl relative">
          {/* Cache Node */}
          <div className="flex flex-col items-center z-10">
            <div className="text-emerald-400 text-sm font-bold mb-2">Cache Hits: {hits} r/s</div>
            <div className="bg-emerald-900/60 border-2 border-emerald-500 rounded-xl p-6 w-48 text-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <div className="text-4xl mb-2">⚡</div>
              <div className="font-bold text-white">Redis Cache</div>
              <div className="text-xs text-emerald-300 mt-2">In-Memory</div>
            </div>
          </div>

          {/* DB Node */}
          <div className="flex flex-col items-center z-10">
            <div className="text-orange-400 text-sm font-bold mb-2">Cache Misses: {misses} r/s</div>
            <div className={`border-2 rounded-xl p-6 w-48 text-center transition-all ${
              dbOverloaded 
              ? 'bg-red-900/60 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
              : 'bg-orange-900/40 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]'
            }`}>
              <div className="text-4xl mb-2">{dbOverloaded ? '🔥' : '💽'}</div>
              <div className="font-bold text-white">Primary DB</div>
              <div className="text-xs text-orange-300 mt-2">Disk I/O</div>
              {dbOverloaded && <div className="text-xs text-red-400 mt-2 font-bold animate-pulse">OVERLOADED</div>}
            </div>
          </div>
        </div>

      </div>
    );
  }
};
