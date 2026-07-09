import React from 'react';
import { SimulationPlugin } from '../SimulationEngine';

export const LoadBalancerPlugin: SimulationPlugin = {
  id: 'load-balancer',
  name: 'Load Balancing',
  description: 'Visualize how requests are distributed across multiple server nodes based on traffic volume.',
  defaultState: {
    traffic: 100,
    nodes: 3,
  },
  renderVisuals: (state) => {
    const activeNodes = state.nodes;
    const trafficPerNode = Math.floor(state.traffic / activeNodes);
    const overloadThreshold = 800;

    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/50 relative z-10">
          Client Requests ({state.traffic} req/s)
        </div>

        <div className="w-1 bg-blue-500 h-16 opacity-50 relative overflow-hidden">
            <div className="absolute top-0 w-full h-1/2 bg-white blur-[2px] animate-pulse"></div>
        </div>

        <div className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold border-2 border-indigo-400 shadow-[0_0_30px_rgba(79,70,229,0.3)] z-10">
          API Gateway / Load Balancer
        </div>

        <div className="flex justify-around w-full max-w-3xl mt-12 relative h-16">
          {Array.from({ length: activeNodes }).map((_, i) => (
            <div 
              key={`line-${i}`} 
              className="w-1 bg-indigo-500 h-16 opacity-30 origin-top transform -translate-y-12" 
              style={{ rotate: ((i - (activeNodes - 1)/2) * 15) + 'deg' }} 
            ></div>
          ))}
        </div>

        <div className="flex justify-center gap-6 flex-wrap max-w-4xl w-full">
          {Array.from({ length: activeNodes }).map((_, i) => {
            const isOverloaded = trafficPerNode > overloadThreshold;
            const utilization = Math.min(100, Math.max(0, (trafficPerNode / overloadThreshold) * 100));
            const bgClass = isOverloaded ? 'bg-red-900/50 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-gray-800 border-gray-600';
            const barClass = isOverloaded ? 'bg-red-500' : 'bg-emerald-500';
            
            return (
              <div key={i} className={`flex flex-col items-center p-4 rounded-xl border transition-all duration-300 w-32 ${bgClass}`}>
                <div className="text-2xl mb-2">{isOverloaded ? '🔥' : '💻'}</div>
                <div className="text-xs text-gray-400 font-mono mb-2">Node-{i+1}</div>
                <div className="w-full bg-gray-900 rounded-full h-2 mb-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${barClass}`} style={{ width: utilization + '%' }}></div>
                </div>
                <div className="text-xs font-mono font-bold text-gray-300">{trafficPerNode} r/s</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
};
