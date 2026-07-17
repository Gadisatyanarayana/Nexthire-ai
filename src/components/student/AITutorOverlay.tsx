import React from 'react';

export const AITutorOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-[100] flex flex-col animate-slide-in-right">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h2 className="font-bold text-lg">NextHire AI Tutor</h2>
        </div>
        <button onClick={onClose} className="text-indigo-200 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-sm text-gray-700 self-start max-w-[85%] rounded-tl-none">
          Hi Alex! I see you're stuck on the "Time and Work Complex" problem. Would you like a small hint, or should we review the core concept first?
        </div>
        
        <div className="bg-indigo-600 p-4 rounded-xl shadow-sm text-sm text-white self-end max-w-[85%] rounded-tr-none">
          I'm not sure how to handle A and B leaving at different times.
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-sm text-gray-700 self-start max-w-[85%] rounded-tl-none">
          <p className="mb-2">Great question. When people leave at different times, it's easier to frame the equation around the total days the work took (let's call it $x$).</p>
          <p>If the work took $x$ days to finish, and B left 3 days before the end, how many days did B work in terms of $x$?</p>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <button className="whitespace-nowrap px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium border border-indigo-100 hover:bg-indigo-100">Explain Step-by-Step</button>
          <button className="whitespace-nowrap px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium border border-indigo-100 hover:bg-indigo-100">Give me a Hint</button>
          <button className="whitespace-nowrap px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium border border-indigo-100 hover:bg-indigo-100">Review Formula</button>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask the AI Tutor..." 
            className="w-full pl-4 pr-10 py-3 bg-gray-100 border-transparent rounded-xl text-sm focus:border-indigo-500 focus:bg-white focus:ring-0 transition-colors"
          />
          <button className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
