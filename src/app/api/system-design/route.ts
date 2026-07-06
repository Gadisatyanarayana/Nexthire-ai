import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { jsonOk, jsonUnauthorized, jsonBadRequest, jsonError } from "@/lib/apiResponses";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return jsonUnauthorized();
    }

    const supabase = getAdminClient();
    const userRow = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: session.user.email.trim().toLowerCase(),
    });

    if (!userRow?.id) {
      return jsonError("User synchronization failure", 500);
    }

    const userId = userRow.id;

    // Parallel query progress, bookmarks, and notes
    const [progressRes, bookmarksRes, notesRes] = await Promise.all([
      supabase
        .from("system_design_progress")
        .select("lesson_id, completed, completed_at")
        .eq("user_id", userId),
      supabase
        .from("system_design_bookmarks")
        .select("lesson_id")
        .eq("user_id", userId),
      supabase
        .from("system_design_notes")
        .select("lesson_id, content, updated_at")
        .eq("user_id", userId)
    ]);

    return jsonOk({
      progress: progressRes.data || [],
      bookmarks: (bookmarksRes.data || []).map(b => b.lesson_id),
      notes: notesRes.data || []
    });
  } catch (error) {
    console.error("GET /api/system-design error:", error);
    return jsonError("Internal Server Error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return jsonUnauthorized();
    }

    const supabase = getAdminClient();
    const userRow = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: session.user.email.trim().toLowerCase(),
    });

    if (!userRow?.id) {
      return jsonError("User synchronization failure", 500);
    }

    const userId = userRow.id;
    const body = await req.json().catch(() => ({}));
    const { action, lessonId } = body;

    if (!lessonId) {
      return jsonBadRequest("lessonId is required");
    }

    if (action === "toggle-progress") {
      const { completed } = body;
      
      // Upsert progress
      const { data, error } = await supabase
        .from("system_design_progress")
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          completed: Boolean(completed),
          completed_at: completed ? new Date().toISOString() : null
        }, { onConflict: "user_id,lesson_id" })
        .select()
        .single();

      if (error) {
        console.error("Progress save error:", error);
        return jsonError(error.message, 500);
      }

      return jsonOk({ success: true, progress: data });
    }

    if (action === "toggle-bookmark") {
      const { bookmarked } = body;

      if (bookmarked) {
        // Insert bookmark
        const { error } = await supabase
          .from("system_design_bookmarks")
          .upsert({
            user_id: userId,
            lesson_id: lessonId
          }, { onConflict: "user_id,lesson_id" });

        if (error) {
          console.error("Bookmark save error:", error);
          return jsonError(error.message, 500);
        }
      } else {
        // Delete bookmark
        const { error } = await supabase
          .from("system_design_bookmarks")
          .delete()
          .eq("user_id", userId)
          .eq("lesson_id", lessonId);

        if (error) {
          console.error("Bookmark delete error:", error);
          return jsonError(error.message, 500);
        }
      }

      return jsonOk({ success: true, bookmarked });
    }

    if (action === "save-note") {
      const { content } = body;

      const { data, error } = await supabase
        .from("system_design_notes")
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          content: String(content || "").trim(),
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id,lesson_id" })
        .select()
        .single();

      if (error) {
        console.error("Note save error:", error);
        return jsonError(error.message, 500);
      }

      return jsonOk({ success: true, note: data });
    }

    return jsonBadRequest("Invalid action");
  } catch (error) {
    console.error("POST /api/system-design error:", error);
    return jsonError("Internal Server Error", 500);
  }
}
