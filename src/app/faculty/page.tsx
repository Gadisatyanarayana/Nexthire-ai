'use client';
import React from 'react';

export default function FacultyDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Faculty Command Center</h1>
        
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-semibold text-gray-500 mb-1">Active Students</p>
            <p className="text-3xl font-bold text-indigo-600">1,245</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-semibold text-gray-500 mb-1">Batch Average Accuracy</p>
            <p className="text-3xl font-bold text-emerald-600">68%</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-semibold text-gray-500 mb-1">Pending Approvals</p>
            <p className="text-3xl font-bold text-amber-600">12 Questions</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Batch Performance</h2>
          <p className="text-gray-600">Analytics visualization and assignment tracking tools will be mounted here.</p>
        </div>
      </div>
    </div>
  );
}
