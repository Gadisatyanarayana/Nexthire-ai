import React, { useState } from 'react';
import { StatusBadge, Status } from './StatusBadge';

interface ApprovalCardProps {
  title: string;
  subtitle: string;
  status: Status;
  requestedBy: string;
  timestamp: Date;
  onApprove: (comments: string) => Promise<void>;
  onReject: (comments: string) => Promise<void>;
  children?: React.ReactNode; // For preview pane integration
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  title,
  subtitle,
  status,
  requestedBy,
  timestamp,
  onApprove,
  onReject,
  children
}) => {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsSubmitting(true);
    try {
      if (action === 'approve') await onApprove(comments);
      else await onReject(comments);
      setComments('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      
      <div className="p-6">
        <div className="mb-6 text-sm text-gray-600 flex justify-between">
          <span>Requested by: <span className="font-medium text-gray-900">{requestedBy}</span></span>
          <span>{timestamp.toLocaleString()}</span>
        </div>
        
        {children && <div className="mb-6">{children}</div>}

        <div className="mt-6 border-t border-gray-200 pt-6">
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
            Reviewer Comments
          </label>
          <textarea
            id="comments"
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            placeholder="Add feedback for the author..."
            value={comments}
            onChange={e => setComments(e.target.value)}
          />
          
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => handleAction('reject')}
              disabled={isSubmitting || comments.trim().length === 0}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Reject (Needs Work)
            </button>
            <button
              onClick={() => handleAction('approve')}
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Approve & Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
