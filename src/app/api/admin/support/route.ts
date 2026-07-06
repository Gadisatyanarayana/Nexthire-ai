import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, isAdminEmail } from "@/lib/supabaseAdmin";

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);

    if (!sessionEmail || !isAdminEmail(sessionEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data, error } = await admin
      .from("user_activity")
      .select("id, user_id, payload, created_at")
      .eq("activity_type", "support_message")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const messages = (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.payload?.name || "Anonymous",
      email: row.payload?.email || "",
      category: row.payload?.category || "general",
      message: row.payload?.message || "",
      createdAt: row.created_at,
    }));

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch messages." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);

    if (!sessionEmail || !isAdminEmail(sessionEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Message ID is required." }, { status: 400 });
    }

    const admin = getAdminClient();
    const { error } = await admin
      .from("user_activity")
      .delete()
      .eq("id", id)
      .eq("activity_type", "support_message");

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete message." }, { status: 500 });
  }
}
