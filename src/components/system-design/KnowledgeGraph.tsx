"use client";

import { useMemo, useState, useEffect } from 'react';
import { ReactFlow, Controls, Background, MiniMap, Node, Edge, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Search, Filter, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { useVisualLearningStore } from '@/lib/store/visualLearningStore';

// Static Fallback Graph Data
const fallbackNodes: Node[] = [
  { id: '1', position: { x: 250, y: 0 }, data: { label: 'Distributed Systems' }, type: 'input' },
  { id: '2', position: { x: 100, y: 100 }, data: { label: 'Load Balancing' } },
  { id: '3', position: { x: 400, y: 100 }, data: { label: 'Caching' } },
  { id: '4', position: { x: 100, y: 200 }, data: { label: 'Consistent Hashing' } },
  { id: '5', position: { x: 400, y: 200 }, data: { label: 'Redis' } },
  { id: '6', position: { x: 250, y: 300 }, data: { label: 'Database Scaling' }, type: 'output' },
];

const fallbackEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, label: 'requires' },
  { id: 'e1-3', source: '1', target: '3', animated: true, label: 'optimizes' },
  { id: 'e2-4', source: '2', target: '4', label: 'implements' },
  { id: 'e3-5', source: '3', target: '5', label: 'uses' },
  { id: 'e4-6', source: '4', target: '6' },
  { id: 'e5-6', source: '5', target: '6', label: 'reduces load on' },
];

export default function KnowledgeGraph() {
  const [nodes, setNodes] = useState<Node[]>(fallbackNodes);
  const [edges, setEdges] = useState<Edge[]>(fallbackEdges);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { fullscreen, toggleFullscreen, setHighlightedConcept } = useVisualLearningStore();

  useEffect(() => {
    async function loadGraphData() {
      try {
        const response = await fetch('/api/v1/system-design/graph');
        if (!response.ok) throw new Error("Failed to fetch graph data");
        const data = await response.json();
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
        }
      } catch (e) {
        console.error("Error loading knowledge graph data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadGraphData();
  }, []);

  const filteredNodes = useMemo(() => {
    if (!searchTerm) return nodes.map(n => ({ ...n, style: { ...n.style, opacity: 1 } }));
    return nodes.map(n => {
      const label = typeof n.data.label === 'string' ? n.data.label : String(n.data.label || '');
      const matches = label.toLowerCase().includes(searchTerm.toLowerCase());
      return {
        ...n,
        style: { ...n.style, opacity: matches ? 1 : 0.15 }
      };
    });
  }, [nodes, searchTerm]);

  if (loading) {
    return (
      <div className="w-full h-[600px] rounded-2xl border border-foreground/10 flex flex-col items-center justify-center bg-foreground/[0.02] gap-3">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
        <span className="text-sm opacity-70 font-mono">Building Dynamic Knowledge Graph...</span>
      </div>
    );
  }

  return (
    <div className={`w-full transition-all duration-500 bg-background/5 ${fullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-[600px] rounded-2xl border border-foreground/10 overflow-hidden'}`}>
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        fitView
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
        onNodeClick={(e, node) => setHighlightedConcept(node.id)}
      >
        <Background gap={24} size={1.5} color="var(--tw-colors-foreground)" className="opacity-10" />
        <Controls />
        <MiniMap zoomable pannable nodeBorderRadius={4} />

        <Panel position="top-left" className="bg-background/80 backdrop-blur border border-foreground/10 p-3 rounded-xl flex items-center gap-4 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
            <input 
              type="text" 
              placeholder="Search concepts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button className="p-2 hover:bg-foreground/5 rounded-lg opacity-70 hover:opacity-100 transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </Panel>

        <Panel position="top-right">
          <button 
            onClick={toggleFullscreen}
            className="bg-background/80 backdrop-blur border border-foreground/10 p-2.5 rounded-xl hover:bg-foreground/5 transition-colors shadow-sm"
          >
            {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
