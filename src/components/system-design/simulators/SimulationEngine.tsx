"use client";

import React, { useState, useEffect } from 'react';

export interface SimulationState {
  traffic: number;
  nodes: number;
  cacheHitRatio: number;
  latency: number;
  failureRate: number;
}

export interface SimulationPlugin {
  id: string;
  name: string;
  description: string;
  renderVisuals: (state: SimulationState) => React.ReactNode;
  defaultState: Partial<SimulationState>;
}

interface SimulationEngineProps {
  plugins: SimulationPlugin[];
}

export default function SimulationEngine({ plugins }: SimulationEngineProps) {
  const [activePluginId, setActivePluginId] = useState<string>(plugins[0]?.id || "");
  const [state, setState] = useState<SimulationState>({
    traffic: 100,
    nodes: 3,
    cacheHitRatio: 80,
    latency: 50,
    failureRate: 0,
  });

  const activePlugin = plugins.find(p => p.id === activePluginId);

  useEffect(() => {
    if (activePlugin) {
      setState(prev => ({ ...prev, ...activePlugin.defaultState }));
    }
  }, [activePlugin]);

  if (!activePlugin) return <div>No plugins available.</div>;

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
      {/* Header */}
      <div className="flex border-b border-gray-800 bg-gray-950 p-2">
        {plugins.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePluginId(p.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePluginId === p.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Controls Sidebar */}
        <div className="w-80 border-r border-gray-800 bg-gray-900 p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{activePlugin.name}</h3>
            <p className="text-sm text-gray-400">{activePlugin.description}</p>
          </div>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label className="text-gray-300">Traffic (req/s)</label>
                <span className="text-indigo-400 font-mono">{state.traffic}</span>
              </div>
              <input
                type="range"
                min="10"
                max="10000"
                step="10"
                value={state.traffic}
                onChange={(e) => setState(s => ({ ...s, traffic: parseInt(e.target.value) }))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label className="text-gray-300">Active Nodes</label>
                <span className="text-indigo-400 font-mono">{state.nodes}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={state.nodes}
                onChange={(e) => setState(s => ({ ...s, nodes: parseInt(e.target.value) }))}
                className="w-full accent-indigo-500"
              />
            </div>

            {activePlugin.id === 'cache' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="text-gray-300">Cache Hit Ratio (%)</label>
                  <span className="text-emerald-400 font-mono">{state.cacheHitRatio}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={state.cacheHitRatio}
                  onChange={(e) => setState(s => ({ ...s, cacheHitRatio: parseInt(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-6 border-t border-gray-800">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-3 rounded-lg">
                   <div className="text-xs text-gray-400 mb-1">Avg Latency</div>
                   <div className="text-lg font-mono font-bold text-emerald-400">{state.latency}ms</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                   <div className="text-xs text-gray-400 mb-1">Error Rate</div>
                   <div className="text-lg font-mono font-bold text-red-400">{state.failureRate}%</div>
                </div>
             </div>
          </div>
        </div>

        {/* Visualization Canvas */}
        <div className="flex-1 bg-gray-950 p-8 relative overflow-hidden flex items-center justify-center">
          {activePlugin.renderVisuals(state)}
        </div>
      </div>
    </div>
  );
}
