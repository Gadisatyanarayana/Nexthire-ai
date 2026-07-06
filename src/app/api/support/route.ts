import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, email, category, message } = body;

    if (!message || !category) {
      return NextResponse.json({ error: "Message and category are required." }, { status: 400 });
    }

    const admin = getAdminClient();
    
    // Find user ID if logged in
    let userId = null;
    if (session?.user?.email) {
      const { data: userData } = await admin
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();
      if (userData) {
        userId = userData.id;
      }
    }

    const { error } = await admin.from("user_activity").insert({
      user_id: userId,
      activity_type: "support_message",
      source: "landing_page",
      payload: {
        name: name || session?.user?.name || "Anonymous",
        email: email || session?.user?.email || "anonymous@example.com",
        category,
        message,
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit message." }, { status: 500 });
  }
}
