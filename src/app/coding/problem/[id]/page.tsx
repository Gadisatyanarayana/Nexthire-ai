import { notFound } from 'next/navigation';
import WorkspaceClient from './WorkspaceClient';

export default async function CodingWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // Note: in a real application, we would use the CodingWorkspaceService server-side here 
  // or fetch via API route from the client. For this step, we'll let the client component
  // fetch the state to keep the workspace interactive and decoupled.
  
  return (
    <div className="h-screen w-full bg-slate-900 text-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-700 bg-slate-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <a href="/coding" className="text-slate-400 hover:text-white transition-colors">
            &larr; Back
          </a>
          <h1 className="font-semibold text-lg">Coding Workspace</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-slate-700 rounded text-sm text-slate-300">
            Auto-saving...
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-hidden">
        <WorkspaceClient problemId={resolvedParams.id} />
      </main>
    </div>
  );
}
