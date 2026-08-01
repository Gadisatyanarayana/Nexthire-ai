import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LearningDashboardService } from '@/lib/learning/services/LearningDashboardService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    let userId = "11111111-1111-1111-1111-111111111111"; 
    let tenantId = "11111111-1111-1111-1111-111111111111";
    
    if (!email) {
      userId = "00000000-0000-0000-0000-000000000000";
      tenantId = "00000000-0000-0000-0000-000000000000";
    }

    const orchestrationData = await LearningDashboardService.getDashboardOrchestration(userId, tenantId);
    
    return NextResponse.json({ success: true, data: orchestrationData });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error || "Learning workspace error");
    return NextResponse.json({ 
      success: true, 
      data: {
        continueLearning: [],
        todayProgress: { xp: 0, dailyGoal: 500, currentStreak: 0, studyTimeMinutes: 0 },
        recentActivity: []
      },
      warning: message 
    }, { status: 200 });
  }
}
