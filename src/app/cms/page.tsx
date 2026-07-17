import React from 'react';
import { MetricsCard } from '../../components/cms/MetricsCard';

export default function CMSDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of the NextHire AI platform content and import health.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricsCard 
          title="Total Questions" 
          value="14,231" 
          trend={{ value: 12, isPositive: true }} 
        />
        <MetricsCard 
          title="Pending Editorial Review" 
          value="3" 
          trend={{ value: 50, isPositive: false }} 
        />
        <MetricsCard 
          title="Failed Imports (DLQ)" 
          value="12" 
          trend={{ value: 2, isPositive: false }} 
        />
        <MetricsCard 
          title="Active Workers" 
          value="4" 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-sm text-gray-500">No recent activity found.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 text-sm font-medium text-indigo-600">
              + Import New CSV Batch
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 text-sm font-medium text-indigo-600">
              + Draft New Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
