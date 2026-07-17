import React from 'react';

export type Status = 'Draft' | 'AwaitingApproval' | 'Valid' | 'Invalid' | 'Published' | 'Archived' | 'Failed';

export const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const styles: Record<Status, string> = {
    Draft: 'bg-gray-100 text-gray-800',
    AwaitingApproval: 'bg-yellow-100 text-yellow-800',
    Valid: 'bg-blue-100 text-blue-800',
    Invalid: 'bg-red-100 text-red-800',
    Published: 'bg-green-100 text-green-800',
    Archived: 'bg-gray-200 text-gray-600',
    Failed: 'bg-red-200 text-red-900',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.Draft}`}>
      {status}
    </span>
  );
};
