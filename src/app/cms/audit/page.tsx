'use client';
import React from 'react';
import { AuditTimeline } from '../../../components/cms/AuditTimeline';

export default function AuditLogs() {
  const mockLogs = [
    {
      id: '1',
      action: 'APPROVED_IMPORT',
      entityType: 'ImportBatch',
      entityId: 'batch-4092',
      userId: 'Admin (user_88x92)',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      details: 'Approved 482 rows for staging promotion.'
    },
    {
      id: '2',
      action: 'PUBLISHED_VERSION',
      entityType: 'Question',
      entityId: 'q-9912',
      userId: 'Editor (user_12v44)',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      details: 'Published Version 4 of "Two Sum".'
    },
    {
      id: '3',
      action: 'REVERTED_VERSION',
      entityType: 'Question',
      entityId: 'q-4122',
      userId: 'Admin (user_88x92)',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      details: 'Reverted to Version 1 due to malformed options.'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">Immutable trail of all content and administrative actions.</p>
      </div>

      <AuditTimeline logs={mockLogs} />
    </div>
  );
}
