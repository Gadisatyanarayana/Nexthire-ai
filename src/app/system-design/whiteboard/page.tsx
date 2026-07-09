import React from 'react';
import { WhiteboardProvider } from '@/components/system-design/whiteboard/Whiteboard';

export default function WhiteboardPage() {
  return (
    <div className="h-screen w-full flex flex-col bg-gray-950">
      <header className="p-4 border-b border-gray-800 bg-black flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Architecture Whiteboard</h1>
          <p className="text-sm text-gray-400">Design, review, and collaborate on system architectures</p>
        </div>
      </header>
      <div className="flex-1">
        <WhiteboardProvider />
      </div>
    </div>
  );
}
