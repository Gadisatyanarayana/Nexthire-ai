import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { readJsonCache, writeJsonCache, getCacheTtlSeconds } from "@/lib/appCache";

const SIMILAR_CACHE_TTL_SECONDS = getCacheTtlSeconds(120);

async function loadQuestionsVersion(): Promise<string | null> {
  try {
    const admin = getAdminClient();
    const { data } = await admin
      .from("app_meta")
      .select("value")
      .eq("key", "questions_last_sync_at")
      .maybeSingle();

    return typeof data?.value === "string" && data.value.trim() ? data.value : null;
  } catch {
    return null;
  }
}

function buildSimilarCacheKey(id: string, version: string | null): string {
  return `questions:similar:${version || "none"}:${id}`;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = decodeURIComponent(String(rawId || "")).trim();

  if (!id) {
    return NextResponse.json({ similar: [] }, { status: 200 });
  }

  try {
    const supabase = getAdminClient();
    const cacheVersion = await loadQuestionsVersion();
    const cacheKey = buildSimilarCacheKey(id, cacheVersion);
    const cached = await readJsonCache<{ similar: Array<{ id: string; title: string; difficulty: string; topic: string[] }> }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      });
    }

    const { data: question, error: qError } = await supabase
      .from("questions")
      .select("id, topic, difficulty, title")
      .eq("id", id)
      .single();

    if (qError || !question) {
      console.warn(`[similar-api] Question ${id} not found:`, qError);
      return NextResponse.json({ similar: [] }, { status: 200 });
    }

    const topics = Array.isArray(question.topic) ? question.topic : [];
    const currentDifficulty = String(question.difficulty || "").trim();
    const titleWord = String(question.title || "").trim().split(/\s+/).filter((w) => w.length >= 4)[0] || "";

    let similar: Array<{ id: string; title: string; difficulty: string; topic: string[] }> = [];

    // Tier 1: Topic overlap - fetch all and filter client-side for reliability
    if (topics.length > 0) {
      const { data } = await supabase
        .from("questions")
        .select("id, title, difficulty, topic")
        .neq("id", id)
        .order("acceptance_rate", { ascending: false })
        .limit(50);
      
      if (Array.isArray(data)) {
        const topicSet = new Set(topics);
        const withOverlap = data.filter((q) => {
          const qTopics = Array.isArray(q.topic) ? q.topic : [];
          return qTopics.some((t) => topicSet.has(t));
        });
        similar = withOverlap.slice(0, 8);
      }
    }

    // Tier 2: Same difficulty
    if (similar.length < 4 && currentDifficulty) {
      const { data } = await supabase
        .from("questions")
        .select("id, title, difficulty, topic")
        .neq("id", id)
        .eq("difficulty", currentDifficulty)
        .order("acceptance_rate", { ascending: false })
        .limit(50);

      if (Array.isArray(data)) {
        const seen = new Set(similar.map((q) => q.id));
        for (const row of data) {
          if (!seen.has(row.id)) {
            similar.push(row);
            seen.add(row.id);
            if (similar.length >= 8) break;
          }
        }
      }
    }

    // Tier 3: Title keyword match
    if (similar.length < 4 && titleWord) {
      const { data } = await supabase
        .from("questions")
        .select("id, title, difficulty, topic")
        .neq("id", id)
        .ilike("title", `%${titleWord}%`)
        .order("acceptance_rate", { ascending: false })
        .limit(50);
      
      if (Array.isArray(data)) {
        const seen = new Set(similar.map((q) => q.id));
        for (const row of data) {
          if (!seen.has(row.id)) {
            similar.push(row);
            seen.add(row.id);
            if (similar.length >= 8) break;
          }
        }
      }
    }

    // Tier 4: Unfiltered - get top-accepted questions as fallback
    if (similar.length < 4) {
      const { data } = await supabase
        .from("questions")
        .select("id, title, difficulty, topic")
        .neq("id", id)
        .order("acceptance_rate", { ascending: false })
        .limit(50);

      if (Array.isArray(data)) {
        const seen = new Set(similar.map((q) => q.id));
        for (const row of data) {
          if (!seen.has(row.id)) {
            similar.push(row);
            seen.add(row.id);
            if (similar.length >= 8) break;
          }
        }
      }
    }

    const payload = { similar: similar.slice(0, 8) };
    await writeJsonCache(cacheKey, payload, SIMILAR_CACHE_TTL_SECONDS);

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error(`[similar-api] Error fetching similar for ${id}:`, error);
    return NextResponse.json({ similar: [] }, { status: 200 });
  }
}
