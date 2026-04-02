import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabase = getAdminClient();

    console.log("Checking database tables...");

    // Check if tables exist by querying them
    const results: { [key: string]: { exists: boolean; error?: string; count?: number } } = {};

    // Check users
    try {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id")
        .limit(1);
      results.users = {
        exists: !usersError,
        error: usersError?.message,
        count: users ? users.length : 0,
      };
    } catch (e) {
      results.users = { exists: false, error: String(e) };
    }

    // Check contests
    try {
      const { data: contests, error: contestsError } = await supabase
        .from("contests")
        .select("id")
        .limit(1);
      results.contests = {
        exists: !contestsError,
        error: contestsError?.message,
        count: contests ? contests.length : 0,
      };
    } catch (e) {
      results.contests = { exists: false, error: String(e) };
    }

    // Check contest_participants
    try {
      const { data: participants, error: participantsError } = await supabase
        .from("contest_participants")
        .select("id")
        .limit(1);
      results.contest_participants = {
        exists: !participantsError,
        error: participantsError?.message,
        count: participants ? participants.length : 0,
      };
    } catch (e) {
      results.contest_participants = { exists: false, error: String(e) };
    }

    // Check questions
    try {
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id")
        .limit(1);
      results.questions = {
        exists: !questionsError,
        error: questionsError?.message,
        count: questions ? questions.length : 0,
      };
    } catch (e) {
      results.questions = { exists: false, error: String(e) };
    }

    // Check submissions
    try {
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("id")
        .limit(1);
      results.submissions = {
        exists: !submissionsError,
        error: submissionsError?.message,
        count: submissions ? submissions.length : 0,
      };
    } catch (e) {
      results.submissions = { exists: false, error: String(e) };
    }

    console.log("Database status:", results);

    return NextResponse.json({
      status: "ok",
      tables: results,
      allTablesExist: Object.values(results).every((r) => r.exists),
    });
  } catch (error) {
    console.error("Error checking database status:", error);
    return NextResponse.json(
      { error: "Failed to check database status", details: String(error) },
      { status: 500 }
    );
  }
}
