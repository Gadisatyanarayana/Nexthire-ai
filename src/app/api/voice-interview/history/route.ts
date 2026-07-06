import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabaseAdmin";

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: userRow } = await admin
      .from("users")
      .select("id")
      .eq("email", normalizeEmail(session.user.email))
      .maybeSingle();

    if (!userRow?.id) {
      return NextResponse.json({ history: [] });
    }

    const { data: historyData, error } = await admin
      .from("voice_interview_history")
      .select("*")
      .eq("user_id", userRow.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch history failed:", error);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    return NextResponse.json({ history: historyData || [] });
  } catch (error) {
    console.error("GET history error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: userRow } = await admin
      .from("users")
      .select("id")
      .eq("email", normalizeEmail(session.user.email))
      .maybeSingle();

    if (!userRow?.id) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    const { error } = await admin
      .from("voice_interview_history")
      .delete()
      .eq("id", id)
      .eq("user_id", userRow.id);

    if (error) {
      console.error("Delete history record failed:", error);
      return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE history error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
