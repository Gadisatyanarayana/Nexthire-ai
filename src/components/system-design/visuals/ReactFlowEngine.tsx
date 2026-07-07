import { useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Panel,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useVisualLearningStore } from '@/lib/store/visualLearningStore';

interface ReactFlowEngineProps {
  content: string; // JSON payload of nodes and edges
  isInteractive?: boolean;
}

export default function ReactFlowEngine({ content, isInteractive = true }: ReactFlowEngineProps) {
  const { setSelectedNode, visualMode } = useVisualLearningStore();

  // Parse initial data
  const initialData = useMemo(() => {
    try {
      return JSON.parse(content) as { nodes: Node[]; edges: Edge[] };
    } catch (e) {
      console.error("Failed to parse React Flow JSON", e);
      return { nodes: [], edges: [] };
    }
  }, [content]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (!isInteractive) return;
    setSelectedNode(node.id);
  }, [isInteractive, setSelectedNode]);

  // Adjust theme dynamically based on visual mode if necessary
  const isInterviewMode = visualMode === 'interview';

  return (
    <div className="w-full h-full relative bg-background/50 rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodes.map(n => ({
          ...n,
          // If interview mode, hide labels
          data: { ...n.data, label: isInterviewMode ? '???' : n.data.label }
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
        nodesDraggable={isInteractive}
        nodesConnectable={false}
        elementsSelectable={isInteractive}
        proOptions={{ hideAttribution: true }} // Optional, cleans up UI
      >
        <Background gap={16} size={1} />
        {isInteractive && (
          <>
            <Controls />
            <MiniMap 
              nodeStrokeColor={(n) => {
                if (n.type === 'input') return '#0041d0';
                if (n.type === 'output') return '#ff0072';
                if (n.type === 'default') return '#1a192b';
                return '#eee';
              }}
              nodeColor={(n) => {
                if (n.type === 'selectorNode') return '#00fff0';
                return '#fff';
              }}
              nodeBorderRadius={2}
            />
          </>
        )}
        
        {/* Placeholder for future specific visual mode overlays */}
        {visualMode === 'animation' && (
          <Panel position="top-center" className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 px-4 py-2 rounded-full text-xs font-bold font-mono">
            Animation Mode Active
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
