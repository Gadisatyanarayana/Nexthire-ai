'use client';
import React, { useState } from 'react';
import { DataTable, Column } from '../../../components/cms/DataTable';
import { SearchFilter } from '../../../components/cms/SearchFilter';
import { StatusBadge, Status } from '../../../components/cms/StatusBadge';

type Question = { id: string; title: string; domain: string; difficulty: string; status: Status; v: number };

const mockQuestions: Question[] = [
  { id: 'q1', title: 'Two Sum', domain: 'Programming', difficulty: 'Easy', status: 'Published', v: 4 },
  { id: 'q2', title: 'Average Speed', domain: 'Quant', difficulty: 'Medium', status: 'AwaitingApproval', v: 1 },
  { id: 'q3', title: 'Syllogisms', domain: 'Logical', difficulty: 'Hard', status: 'Draft', v: 2 },
];

export default function QuestionManager() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const columns: Column<Question>[] = [
    { key: 'title', label: 'Title', render: (row) => (
      <div className="font-medium text-indigo-600 hover:text-indigo-900">{row.title}</div>
    )},
    { key: 'domain', label: 'Domain' },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'v', label: 'Version', render: (row) => `v${row.v}` },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="mt-1 text-sm text-gray-500">Author, edit, and version control platform questions.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium text-sm">
          + Draft Question
        </button>
      </div>

      <SearchFilter 
        placeholder="Search by title, ID, or content..." 
        onSearch={setSearchTerm} 
        filters={[
          { label: 'Domain', options: ['Quant', 'Logical', 'Programming'], onSelect: () => {} },
          { label: 'Status', options: ['Draft', 'AwaitingApproval', 'Published'], onSelect: () => {} }
        ]} 
      />

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <DataTable 
          data={mockQuestions.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase()))} 
          columns={columns} 
          selectable={true}
          onSelectionChange={(selected) => console.log(selected.length, 'selected')}
        />
      </div>
    </div>
  );
}
