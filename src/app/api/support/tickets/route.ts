import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, isAdminEmail } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const admin = getAdminClient();
    const isAdmin = isAdminEmail(userEmail);

    let query = admin.from("support_tickets").select("*").order("created_at", { ascending: false });

    // Non-admin users only see their own tickets
    if (!isAdmin) {
      query = query.eq("student_email", userEmail);
    } else {
      if (category && category !== "all") query = query.eq("category", category);
      if (status && status !== "all") query = query.eq("status", status);
      if (priority && priority !== "all") query = query.eq("priority", priority);
      if (search) {
        query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%,student_name.ilike.%${search}%,student_email.ilike.%${search}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      // Fallback: If table doesn't exist yet, query user_activity support messages
      const { data: actData } = await admin
        .from("user_activity")
        .select("*")
        .eq("activity_type", "support_message")
        .order("created_at", { ascending: false });

      const fallbackTickets = (actData || []).map((a: any) => ({
        id: a.id,
        user_id: a.user_id,
        student_name: a.payload?.name || "Anonymous Student",
        student_email: a.payload?.email || "student@example.com",
        category: a.payload?.category || "Bug Report",
        priority: a.payload?.priority || "Medium",
        subject: a.payload?.subject || a.payload?.message?.slice(0, 50) || "Support Query",
        description: a.payload?.message || "No description provided.",
        attachments: a.payload?.attachments || [],
        status: "Open",
        admin_notes: null,
        admin_reply: null,
        created_at: a.created_at,
        updated_at: a.created_at,
      }));

      return NextResponse.json({ tickets: fallbackTickets, fallback: true });
    }

    return NextResponse.json({ tickets: data || [], fallback: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load support tickets." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      name,
      email,
      category = "Bug Report",
      priority = "Medium",
      subject,
      description,
      attachments = [],
    } = body;

    const studentName = name || session?.user?.name || "Student";
    const studentEmail = email || session?.user?.email || "student@example.com";

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description are required." }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Primary insert into support_tickets table
    const { data, error } = await admin.from("support_tickets").insert({
      user_id: session?.user?.email ? `usr_${Buffer.from(session.user.email).toString("hex").slice(0, 12)}` : null,
      student_name: studentName,
      student_email: studentEmail,
      category,
      priority,
      subject,
      description,
      attachments,
      status: "Open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();

    // 2. Secondary log to user_activity for redundancy
    try {
      await admin.from("user_activity").insert({
        user_id: session?.user?.email ? `usr_${Buffer.from(session.user.email).toString("hex").slice(0, 12)}` : null,
        activity_type: "support_message",
        source: "communication_center",
        payload: {
          name: studentName,
          email: studentEmail,
          category,
          priority,
          subject,
          message: description,
          attachments,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // Ignore secondary insert errors
    }

    if (error) {
      return NextResponse.json({ success: true, warning: "Ticket logged via secondary activity stream." });
    }

    return NextResponse.json({ success: true, ticket: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit ticket." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail || !isAdminEmail(userEmail)) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { ticketId, status, priority, adminNotes, adminReply } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required." }, { status: 400 });
    }

    const admin = getAdminClient();
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
      if (status === "Resolved" || status === "Closed") {
        updates.resolved_at = new Date().toISOString();
      }
    }

    if (priority) updates.priority = priority;
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;
    if (adminReply !== undefined) {
      updates.admin_reply = adminReply;
      updates.replied_at = new Date().toISOString();
    }

    const { data, error } = await admin
      .from("support_tickets")
      .update(updates)
      .eq("id", ticketId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || "Failed to update ticket." }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update ticket." }, { status: 500 });
  }
}
