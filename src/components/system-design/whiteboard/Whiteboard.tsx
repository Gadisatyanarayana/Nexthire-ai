"use client";

import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DatabaseNode, ServerNode, LoadBalancerNode } from './CustomNodes';

const nodeTypes = {
  database: DatabaseNode,
  server: ServerNode,
  loadbalancer: LoadBalancerNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Collaborative foundations: mock presence
const useCollaborativePresence = () => {
  const [users] = useState([{ id: 1, name: 'Alice', color: '#ff0000' }]);
  return users;
};

export default function Whiteboard() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[]; timestamp: Date }[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const activeUsers = useCollaborativePresence();

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      if (!reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
      
      // Save history snapshot on drop
      setHistory(h => [...h, { nodes: [...nodes, newNode], edges, timestamp: new Date() }]);
    },
    [reactFlowInstance, nodes, edges, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleReview = async () => {
    // Send to API Route for AI Review (Phase 6 implementation)
    const payload = { nodes, edges };
    alert('Sending to AI Reviewer 2.0...\n' + JSON.stringify(payload).substring(0, 100) + '...');
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 text-white">
      {/* Sidebar Library */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-4">
        <h3 className="text-xl font-bold mb-4">Components</h3>
        
        <div 
          className="bg-indigo-900/40 border border-indigo-500 p-3 rounded cursor-grab"
          onDragStart={(e) => onDragStart(e, 'server')} draggable
        >
          💻 Server
        </div>
        <div 
          className="bg-orange-900/40 border border-orange-500 p-3 rounded cursor-grab"
          onDragStart={(e) => onDragStart(e, 'database')} draggable
        >
          💽 Database
        </div>
        <div 
          className="bg-purple-900/40 border border-purple-500 p-3 rounded cursor-grab"
          onDragStart={(e) => onDragStart(e, 'loadbalancer')} draggable
        >
          ⚖️ Load Balancer
        </div>

        <div className="mt-auto">
          <h4 className="font-bold text-sm text-gray-400 mb-2">History Versions ({history.length})</h4>
          <button 
             className="w-full bg-gray-800 hover:bg-gray-700 py-2 rounded text-sm transition-colors mb-2"
             onClick={() => setNodes([])}
          >
            Clear Canvas
          </button>
          <button 
             onClick={handleReview}
             className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded text-sm font-bold transition-colors"
          >
            AI Review Design
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-950"
        >
          <Background color="#333" gap={16} />
          <Controls className="bg-gray-800 fill-white" />
          <MiniMap className="bg-gray-900 border-gray-700" nodeColor="#4f46e5" />
          
          <Panel position="top-right" className="bg-gray-900/80 p-2 rounded flex gap-2 backdrop-blur">
             <div className="text-xs text-gray-400 flex items-center">
                Collaboration: {activeUsers.map(u => (
                   <div key={u.id} className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white ml-2" title={u.name}>
                      {u.name[0]}
                   </div>
                ))}
             </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export function WhiteboardProvider() {
  return (
    <ReactFlowProvider>
      <Whiteboard />
    </ReactFlowProvider>
  );
}
