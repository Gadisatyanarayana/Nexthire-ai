import React from 'react';

interface PreviewPaneProps {
  title: string;
  metadata: { label: string; value: string }[];
  content: React.ReactNode;
  footer?: React.ReactNode;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ title, metadata, content, footer }) => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      
      {metadata.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-200 bg-white grid grid-cols-2 md:grid-cols-4 gap-4">
          {metadata.map((meta, idx) => (
            <div key={idx}>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{meta.label}</dt>
              <dd className="mt-1 text-sm text-gray-900 font-medium">{meta.value}</dd>
            </div>
          ))}
        </div>
      )}
      
      <div className="p-6 bg-white prose max-w-none">
        {content}
      </div>

      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};
