import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LearningService } from "@/lib/learning/services/LearningService";
const { ReportingEngine } = LearningService;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    // In production, ensure user has admin or appropriate role to view system reports
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'metrics';
    const format = (searchParams.get('format') as 'json' | 'markdown') || 'json';

    let report = null;
    if (type === 'metrics') {
      report = await ReportingEngine.generateReleaseMetrics(format);
    } else if (type === 'audit') {
      report = await ReportingEngine.generateEngineeringAudit(format);
    } else {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (!report) {
       return NextResponse.json({ error: 'Reports are currently disabled' }, { status: 403 });
    }

    return NextResponse.json({ success: true, type, format, report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
