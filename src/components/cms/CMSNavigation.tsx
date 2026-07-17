import React from 'react';
import Link from 'next/link';

export const CMSNavigation: React.FC = () => {
  return (
    <nav className="bg-indigo-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-4 border-b border-indigo-700">
        <h1 className="text-xl font-bold tracking-tight">NextHire AI CMS</h1>
        <p className="text-xs text-indigo-300 mt-1">v2.0 Authoring</p>
      </div>
      
      <div className="flex-1 py-4 overflow-y-auto space-y-1">
        <Link href="/cms" className="block px-4 py-2 text-sm hover:bg-indigo-700">
          Dashboard
        </Link>
        <Link href="/cms/curriculum" className="block px-4 py-2 text-sm hover:bg-indigo-700">
          Curriculum
        </Link>
        <Link href="/cms/questions" className="block px-4 py-2 text-sm hover:bg-indigo-700">
          Question Bank
        </Link>
        <Link href="/cms/import" className="block px-4 py-2 text-sm hover:bg-indigo-700">
          Import Center
        </Link>
        <Link href="/cms/editorial" className="block px-4 py-2 text-sm hover:bg-indigo-700 flex justify-between items-center">
          <span>Editorial Queue</span>
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
        </Link>
        <Link href="/cms/admin" className="block px-4 py-2 text-sm hover:bg-indigo-700">
          Administration
        </Link>
        <Link href="/cms/audit" className="block px-4 py-2 text-sm hover:bg-indigo-700">
          Audit Logs
        </Link>
      </div>

      <div className="p-4 border-t border-indigo-700 text-xs text-indigo-300">
        Signed in as Admin
      </div>
    </nav>
  );
};
