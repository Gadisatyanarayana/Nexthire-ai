import React from 'react';
import { CMSNavigation } from '../../components/cms/CMSNavigation';

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <CMSNavigation />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm h-16 flex items-center px-8 justify-between">
          <h2 className="text-lg font-medium text-gray-900">Workspace</h2>
          <button className="text-sm text-gray-500 hover:text-gray-900">Sign out</button>
        </header>
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
