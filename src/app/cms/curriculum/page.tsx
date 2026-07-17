'use client';
import React, { useState } from 'react';
import { DataTable, Column } from '../../../components/cms/DataTable';
import { SearchFilter } from '../../../components/cms/SearchFilter';

type Domain = { id: string; name: string; moduleCount: number; status: string };

const mockDomains: Domain[] = [
  { id: '1', name: 'Quantitative Aptitude', moduleCount: 14, status: 'Active' },
  { id: '2', name: 'Logical Reasoning', moduleCount: 8, status: 'Active' },
  { id: '3', name: 'Verbal Ability', moduleCount: 12, status: 'Draft' },
];

export default function CurriculumManager() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const columns: Column<Domain>[] = [
    { key: 'name', label: 'Domain Name' },
    { key: 'moduleCount', label: 'Modules' },
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {row.status}
      </span>
    )}
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Curriculum Manager</h1>
          <p className="mt-1 text-sm text-gray-500">Manage Domains, Modules, Lessons, and Concepts.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium text-sm">
          + Add Domain
        </button>
      </div>

      <SearchFilter 
        placeholder="Search domains..." 
        onSearch={setSearchTerm} 
        filters={[
          { label: 'All Statuses', options: ['Active', 'Draft', 'Archived'], onSelect: () => {} }
        ]} 
      />

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <DataTable 
          data={mockDomains.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))} 
          columns={columns} 
          onRowClick={(row) => console.log('Clicked', row)}
        />
      </div>
    </div>
  );
}
