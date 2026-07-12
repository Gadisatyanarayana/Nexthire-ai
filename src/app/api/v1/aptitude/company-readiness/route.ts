import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { LearningService } from "@/lib/learning/services/LearningService";
const { CompanyEngine, CompanyReadinessEngine } = LearningService;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    const email = session?.user?.email;

    if (!userId && email) {
      const { data: userRecord } = await supabase.from("users").select("id").eq("email", email).single();
      if (userRecord?.id) userId = userRecord.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");

    if (!companyId) {
      return NextResponse.json({ success: false, error: "company_id is required" }, { status: 400 });
    }

    const company = CompanyEngine.getCompany(companyId);
    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    // 1. Fetch Mastery
    const { data: rawMastery } = await supabase
      .from("apt_topic_mastery")
      .select("mastery_score, apt_lessons:topic_id(title)")
      .eq("user_id", userId);

    const topicMastery = (rawMastery || []).map(m => ({
      topic_name: (m.apt_lessons as any)?.title || (m.apt_lessons as any)?.[0]?.title || "Unknown",
      mastery_score: m.mastery_score
    }));

    // 2. Fetch Recent Mocks for this company
    const { data: recentMocks } = await supabase
      .from("apt_mock_sessions")
      .select("session_data->analytics")
      .eq("user_id", userId)
      .not("end_time", "is", null)
      .order("end_time", { ascending: false })
      .limit(5);

    // Filter mocks where config.company_id === companyId (doing in memory since it's deep inside jsonb)
    // Actually the query above just fetched all. To be precise, we need to filter. Let's fetch the config too.
    const { data: recentMocksFull } = await supabase
      .from("apt_mock_sessions")
      .select("session_data")
      .eq("user_id", userId)
      .not("end_time", "is", null)
      .order("end_time", { ascending: false });

    const companyMocks = (recentMocksFull || [])
      .filter(m => m.session_data?.config?.company_id === companyId)
      .map(m => m.session_data.analytics)
      .filter(Boolean)
      .slice(0, 5);

    // 3. Compute Readiness
    const readiness = CompanyReadinessEngine.calculateReadiness(company, topicMastery, companyMocks);

    // 4. Upsert Readiness (so it can be queried globally for dashboards)
    await supabase
      .from("apt_company_readiness")
      .upsert({
        user_id: userId,
        company_id: companyId,
        readiness_score: readiness.readiness_percentage,
        interview_probability: readiness.interview_probability,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,company_id" });

    return NextResponse.json({ success: true, data: readiness });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
