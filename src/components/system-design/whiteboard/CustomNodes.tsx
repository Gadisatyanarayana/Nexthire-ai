import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const ServerNode = ({ data }: { data: any }) => {
  return (
    <div className="bg-gray-800 border-2 border-indigo-500 p-4 rounded-lg shadow-lg w-40 text-center text-white">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-indigo-500" />
      <div className="text-2xl mb-1">💻</div>
      <div className="font-bold text-sm">{data.label || 'App Server'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-indigo-500" />
    </div>
  );
};

export const DatabaseNode = ({ data }: { data: any }) => {
  return (
    <div className="bg-gray-800 border-2 border-orange-500 p-4 rounded-xl shadow-lg w-40 text-center text-white">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-orange-500" />
      <div className="text-2xl mb-1">💽</div>
      <div className="font-bold text-sm">{data.label || 'Database'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-orange-500" />
    </div>
  );
};

export const LoadBalancerNode = ({ data }: { data: any }) => {
  return (
    <div className="bg-gray-800 border-2 border-purple-500 p-4 rounded shadow-[0_0_15px_rgba(168,85,247,0.3)] w-48 text-center text-white">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-purple-500" />
      <div className="text-2xl mb-1">⚖️</div>
      <div className="font-bold text-sm">{data.label || 'Load Balancer'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-purple-500" />
    </div>
  );
};
