import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { upsertUserAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json()) as { name?: string | null; email?: string };
    const email = (body.email || "").trim().toLowerCase();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionEmail = String(session.user.email).trim().toLowerCase();
    if (!email || email !== sessionEmail) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 403 });
    }

    const user = await upsertUserAdmin({
      name: body.name ?? null,
      email,
    });

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
