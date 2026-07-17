import React from 'react';

interface EntityEditorProps {
  title: string;
  description?: string;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  children: React.ReactNode;
}

export const EntityEditor: React.FC<EntityEditorProps> = ({
  title,
  description,
  onSubmit,
  onCancel,
  isSubmitting = false,
  children
}) => {
  return (
    <div className="bg-white shadow sm:rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
        {description && (
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>{description}</p>
          </div>
        )}
        
        <form onSubmit={onSubmit} className="mt-5 space-y-6">
          {/* Form Fields Injected Here */}
          {children}
          
          <div className="pt-5 flex justify-end gap-3 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
