import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export async function POST(_req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(context.params);
    const contestId = String(resolvedParams?.id || "").trim();
    if (!contestId || !isUuid(contestId)) {
      return NextResponse.json({ error: "Invalid contest id" }, { status: 400 });
    }

    const supabase = getAdminClient();
    const userRow = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: normalizeEmail(session.user.email),
    });

    const { data: existingContest, error: existingError } = await supabase
      .from("contests")
      .select("id, owner_user_id")
      .eq("id", contestId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Failed to read contest ownership." }, { status: 500 });
    }
    if (!existingContest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const currentOwner = String(existingContest.owner_user_id || "").trim();
    if (currentOwner && currentOwner !== String(userRow.id || "")) {
      return NextResponse.json({ error: "Contest already belongs to another owner." }, { status: 403 });
    }
    if (currentOwner === String(userRow.id || "")) {
      return NextResponse.json({ success: true, alreadyOwner: true });
    }

    const { error: updateError } = await supabase
      .from("contests")
      .update({ owner_user_id: userRow.id })
      .eq("id", contestId)
      .is("owner_user_id", null);

    if (updateError) {
      return NextResponse.json({ error: "Failed to claim contest ownership." }, { status: 500 });
    }

    return NextResponse.json({ success: true, ownerUserId: userRow.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
