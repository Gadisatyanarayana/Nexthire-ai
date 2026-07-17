import React from 'react';

export interface VersionNode {
  id: string;
  versionNumber: number;
  createdBy: string;
  timestamp: Date;
  changeSummary: string;
  isCurrent: boolean;
}

export const VersionTimeline: React.FC<{ versions: VersionNode[]; onRevert?: (id: string) => void }> = ({ versions, onRevert }) => {
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {versions.map((version, idx) => (
          <li key={version.id}>
            <div className="relative pb-8">
              {idx !== versions.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${version.isCurrent ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                    <span className="text-white text-xs font-bold">v{version.versionNumber}</span>
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Modified by <span className="font-medium text-gray-900">{version.createdBy}</span>
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{version.changeSummary}</p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500 flex flex-col items-end">
                    <time dateTime={version.timestamp.toISOString()}>{version.timestamp.toLocaleDateString()}</time>
                    {!version.isCurrent && onRevert && (
                      <button onClick={() => onRevert(version.id)} className="mt-2 text-indigo-600 hover:text-indigo-900 font-medium">
                        Revert to v{version.versionNumber}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
