import { notFound } from 'next/navigation';
import WorkspaceClient from './WorkspaceClient';

export default async function CodingWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // Note: in a real application, we would use the CodingWorkspaceService server-side here 
  // or fetch via API route from the client. For this step, we'll let the client component
  // fetch the state to keep the workspace interactive and decoupled.
  
  return (
    <div className="h-screen w-full bg-slate-900 text-slate-100 flex flex-col overflow-hidden">
      {/* Minimal Top Bar (ONLY Back button) */}
      <header className="h-10 border-b border-slate-700 bg-slate-800 flex items-center px-4 shrink-0">
        <a href="/coding" className="text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors">
          &larr; Back to Problems
        </a>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-hidden">
        <WorkspaceClient problemId={resolvedParams.id} />
      </main>
    </div>
  );
}
