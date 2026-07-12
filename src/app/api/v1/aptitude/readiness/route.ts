import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PlacementReadinessEngine } from '@/lib/aptitude/PlacementReadinessEngine';

const readinessSchema = z.object({
  companyId: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { companyId } = readinessSchema.parse(body);

    const readiness = await PlacementReadinessEngine.calculateCompanyReadiness(session.user.id, companyId);

    return NextResponse.json({ success: true, readiness });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
