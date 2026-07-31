import Link from "next/link";
import { ReactNode } from "react";

export default function ContentIntelligenceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Content Intelligence
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pipeline Command Center</p>
        </div>

        <nav className="flex flex-col gap-2">
          <Link href="/cms/content-intelligence/quality-dashboard" className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            📊 Quality Dashboard
          </Link>
          <Link href="/cms/content-intelligence/review-queue" className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            ⚖️ Review Queue
          </Link>
          <Link href="/cms/content-intelligence/batch-runs" className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            ⚙️ Batch Runs
          </Link>
          
          <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
          <span className="text-xs text-gray-500 font-semibold px-3 uppercase tracking-wider">Coming Soon</span>
          <span className="px-3 py-2 text-gray-400 text-sm cursor-not-allowed">❌ Failed Questions</span>
          <span className="px-3 py-2 text-gray-400 text-sm cursor-not-allowed">🔄 Duplicate Detection</span>
          <span className="px-3 py-2 text-gray-400 text-sm cursor-not-allowed">🕰️ Version History</span>
          <span className="px-3 py-2 text-gray-400 text-sm cursor-not-allowed">🧠 AI Providers</span>
          <span className="px-3 py-2 text-gray-400 text-sm cursor-not-allowed">📝 Prompt Management</span>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
