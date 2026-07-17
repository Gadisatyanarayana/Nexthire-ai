import React from 'react';

export const SearchFilter: React.FC<{
  placeholder?: string;
  onSearch: (term: string) => void;
  filters?: { label: string; options: string[]; onSelect: (val: string) => void }[];
}> = ({ placeholder = "Search...", onSearch, filters }) => {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">🔍</span>
          </div>
          <input
            type="text"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
            placeholder={placeholder}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      </div>
      {filters?.map((f, idx) => (
        <select
          key={idx}
          className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
          onChange={e => f.onSelect(e.target.value)}
        >
          <option value="">{f.label}</option>
          {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ))}
    </div>
  );
};
