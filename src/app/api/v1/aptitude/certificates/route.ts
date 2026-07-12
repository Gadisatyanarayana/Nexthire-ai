import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { CertificationEngine } from '@/lib/aptitude/CertificationEngine';

const issueSchema = z.object({
  moduleId: z.string().uuid(),
  moduleName: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { moduleId, moduleName } = issueSchema.parse(body);

    const certificate = await CertificationEngine.issueCertificate(session.user.id, moduleId, moduleName);

    return NextResponse.json({ success: true, certificate });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
