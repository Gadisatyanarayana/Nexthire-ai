import { Metadata } from 'next';
import WorkspaceClient from './WorkspaceClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Problem ${id} - Coding Workspace | NextHire AI`,
    description: `Solve algorithm challenge ${id} with live testcases, AI editorial solutions, and execution engine on NextHire AI.`
  };
}

export default async function CodingWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  return (
    <main className="h-screen w-screen bg-[#181818] text-zinc-100 flex flex-col overflow-hidden">
      <WorkspaceClient problemId={resolvedParams.id} />
    </main>
  );
}

