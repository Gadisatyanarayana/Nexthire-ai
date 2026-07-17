import React from 'react';

interface EntitySelectorProps {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (id: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export const EntitySelector: React.FC<EntitySelectorProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Select an option'
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white disabled:bg-gray-50 disabled:text-gray-500"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
};
