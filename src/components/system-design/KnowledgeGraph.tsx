"use client";

import { useMemo, useState, useEffect } from 'react';
import { ReactFlow, Controls, Background, MiniMap, Node, Edge, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Search, Filter, Maximize2, Minimize2, Loader2, ExternalLink, Zap } from 'lucide-react';
import { useVisualLearningStore } from '@/lib/store/visualLearningStore';
import { useRouter } from 'next/navigation';

// Interactive Nodes with direct lesson navigation URLs
const fallbackNodes: Node[] = [
  { 
    id: '1', 
    position: { x: 250, y: 20 }, 
    data: { label: 'Distributed Systems Intro', url: '/system-design/mod-foundations/distributed-systems-intro' }, 
    type: 'input',
    style: { background: '#0e7490', color: '#fff', border: '2px solid #22d3ee', borderRadius: '12px', padding: '10px 18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(34, 211, 238, 0.25)' }
  },
  { 
    id: '2', 
    position: { x: 80, y: 140 }, 
    data: { label: 'Load Balancing & L4/L7', url: '/system-design/mod-foundations/load-balancing' },
    style: { background: '#1e293b', color: '#38bdf8', border: '1px solid #38bdf8', borderRadius: '12px', padding: '10px 18px', fontWeight: 'bold', cursor: 'pointer' }
  },
  { 
    id: '3', 
    position: { x: 420, y: 140 }, 
    data: { label: 'Caching Strategies', url: '/system-design/mod-caching/caching-strategies' },
    style: { background: '#1e293b', color: '#a855f7', border: '1px solid #a855f7', borderRadius: '12px', padding: '10px 18px', fontWeight: 'bold', cursor: 'pointer' }
  },
  { 
    id: '4', 
    position: { x: 80, y: 260 }, 
    data: { label: 'Consistent Hashing', url: '/system-design/mod-partitioning/consistent-hashing' },
    style: { background: '#1e293b', color: '#10b981', border: '1px solid #10b981', borderRadius: '12px', padding: '10px 18px', fontWeight: 'bold', cursor: 'pointer' }
  },
  { 
    id: '5', 
    position: { x: 420, y: 260 }, 
    data: { label: 'Redis & Distributed Cache', url: '/system-design/mod-caching/redis-architecture' },
    style: { background: '#1e293b', color: '#f97316', border: '1px solid #f97316', borderRadius: '12px', padding: '10px 18px', fontWeight: 'bold', cursor: 'pointer' }
  },
  { 
    id: '6', 
    position: { x: 250, y: 380 }, 
    data: { label: 'Database Scaling & Sharding', url: '/system-design/mod-storage/database-scaling' }, 
    type: 'output',
    style: { background: '#3b0764', color: '#e9d5ff', border: '2px solid #c084fc', borderRadius: '12px', padding: '10px 18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(192, 132, 252, 0.25)' }
  },
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
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>(fallbackNodes);
  const [edges, setEdges] = useState<Edge[]>(fallbackEdges);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { fullscreen, toggleFullscreen, setHighlightedConcept } = useVisualLearningStore();

  useEffect(() => {
    async function loadGraphData() {
      try {
        const response = await fetch('/api/v1/system-design/graph');
        if (response.ok) {
          const data = await response.json();
          if (data.nodes && data.edges && data.nodes.length > 0) {
            setNodes(data.nodes);
            setEdges(data.edges);
          }
        }
      } catch (e) {
        console.error("Using interactive fallback nodes:", e);
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

  const handleNodeClick = (_e: any, node: Node) => {
    setHighlightedConcept(node.id);
    const url = (node.data as any)?.url;
    const label = String(node.data.label || '').toLowerCase();

    if (url) {
      router.push(url);
    } else if (label.includes('load balanc')) {
      router.push('/system-design/mod-foundations/load-balancing');
    } else if (label.includes('cach')) {
      router.push('/system-design/mod-caching/caching-strategies');
    } else if (label.includes('hash')) {
      router.push('/system-design/mod-partitioning/consistent-hashing');
    } else if (label.includes('redis')) {
      router.push('/system-design/mod-caching/redis-architecture');
    } else if (label.includes('database') || label.includes('scal') || label.includes('shard')) {
      router.push('/system-design/mod-storage/database-scaling');
    } else {
      router.push('/system-design/mod-foundations/distributed-systems-intro');
    }
  };

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
        onNodeClick={handleNodeClick}
      >
        <Background gap={24} size={1.5} color="var(--tw-colors-foreground)" className="opacity-10" />
        <Controls />
        <MiniMap zoomable pannable nodeBorderRadius={4} />

        {/* Interactive instructions banner */}
        <Panel position="bottom-center" className="bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 px-4 py-2 rounded-xl backdrop-blur text-xs font-semibold flex items-center gap-2 shadow-lg">
          <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Interactive Topic Map — Click any node above to jump directly into its lesson & architecture diagrams!</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </Panel>

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
