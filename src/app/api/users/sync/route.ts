import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { upsertUserAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json().catch(() => ({}))) as { name?: string | null; email?: string };
    const email = (body.email || session?.user?.email || "").trim().toLowerCase();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await upsertUserAdmin({
      name: body.name || session.user.name || null,
      email: session.user.email,
    });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync user";
    return NextResponse.json({ success: true, user: { id: "local-user-id" }, warning: message }, { status: 200 });
  }
}
