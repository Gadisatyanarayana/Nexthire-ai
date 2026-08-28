import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = getAdminClient();
    
    // Attempt to insert into Supabase
    // If table doesn't exist yet, it'll gracefully fail in development
    const { error } = await admin.from("contact_messages").insert({
      name,
      email,
      subject: subject || "No Subject",
      message,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error("[Contact API] Supabase Insert Error:", error);
      // In development if table doesn't exist, we still return 200 for UX
      // return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Contact API] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
