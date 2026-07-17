import React from 'react';

export const BulkActionBar: React.FC<{
  selectedCount: number;
  actions: { label: string; onClick: () => void; isDestructive?: boolean }[];
  onClear: () => void;
}> = ({ selectedCount, actions, onClear }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 px-2 sm:px-6 z-50 pointer-events-none">
      <div className="mx-auto max-w-7xl">
        <div className="p-2 rounded-lg bg-indigo-600 shadow-lg sm:p-3 pointer-events-auto flex items-center justify-between flex-wrap">
          <div className="flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-indigo-800 text-white text-sm font-medium">
              {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="mt-2 flex-shrink-0 w-full sm:mt-0 sm:w-auto flex gap-2">
            {actions.map(action => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                  action.isDestructive ? 'text-red-600 bg-white hover:bg-red-50' : 'text-indigo-600 bg-white hover:bg-indigo-50'
                }`}
              >
                {action.label}
              </button>
            ))}
            <button
              onClick={onClear}
              className="flex items-center justify-center px-3 py-2 text-white hover:bg-indigo-500 rounded-md"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
