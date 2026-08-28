import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("user_progress")
      .select("resume_data")
      .eq("email", session.user.email)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }
    
    return NextResponse.json({ resume_data: data?.resume_data || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load progress" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resume_data } = await req.json();
    
    const { error } = await supabaseAdmin
      .from("user_progress")
      .upsert(
        { email: session.user.email, resume_data },
        { onConflict: "email" }
      );

    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save progress" }, { status: 500 });
  }
}
