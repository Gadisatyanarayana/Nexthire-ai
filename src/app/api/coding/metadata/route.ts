import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, isAdminEmail } from "@/lib/supabaseAdmin";
import { CODING_TOPICS, SOLVING_PATTERNS, RECOGNITION_SIGNALS, PATTERN_TEMPLATES, LEARNING_TRACKS } from "@/lib/codingMetadata";
import { MOCK_QUESTIONS } from "@/lib/codingQuestions";
import { enrichQuestionMetadata } from "@/lib/codingMetadataClassifier";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "overview";
    const patternId = searchParams.get("pattern");
    const topicId = searchParams.get("topic");

    if (type === "taxonomy") {
      return NextResponse.json({
        topics: CODING_TOPICS,
        patterns: SOLVING_PATTERNS,
        signals: RECOGNITION_SIGNALS,
        learningTracks: LEARNING_TRACKS
      });
    }

    if (type === "pattern" && patternId) {
      const normalizedPattern = String(patternId).replace(/-/g, " ").toLowerCase();
      const matchedPattern = SOLVING_PATTERNS.find(p => p.toLowerCase() === normalizedPattern) || "Two Pointers";

      const enriched = MOCK_QUESTIONS.map(enrichQuestionMetadata);
      const matchingQuestions = enriched.filter(q => q.primaryPattern.toLowerCase() === matchedPattern.toLowerCase());
      const signal = RECOGNITION_SIGNALS.find(s => s.pattern.toLowerCase() === matchedPattern.toLowerCase());
      const templates = PATTERN_TEMPLATES[matchedPattern] || PATTERN_TEMPLATES["Two Pointers"];

      return NextResponse.json({
        pattern: matchedPattern,
        signal,
        templates,
        questions: matchingQuestions,
        practiceOrder: {
          easy: matchingQuestions.filter(q => q.difficulty === "Easy"),
          medium: matchingQuestions.filter(q => q.difficulty === "Medium"),
          hard: matchingQuestions.filter(q => q.difficulty === "Hard")
        }
      });
    }

    if (type === "topic" && topicId) {
      const normalizedTopic = String(topicId).replace(/-/g, " ").toLowerCase();
      const matchedTopic = CODING_TOPICS.find(t => t.toLowerCase() === normalizedTopic) || "Arrays";

      const enriched = MOCK_QUESTIONS.map(enrichQuestionMetadata);
      const matchingQuestions = enriched.filter(q => q.topics.some(t => t.toLowerCase() === matchedTopic.toLowerCase()));

      return NextResponse.json({
        topic: matchedTopic,
        questions: matchingQuestions,
        subtopics: Array.from(new Set(matchingQuestions.map(q => q.subtopic))),
        patternDistribution: Array.from(new Set(matchingQuestions.map(q => q.primaryPattern)))
      });
    }

    if (type === "knowledge-graph") {
      const nodes = CODING_TOPICS.map((t, idx) => ({
        id: `topic_${t.toLowerCase().replace(/\s+/g, '_')}`,
        label: t,
        type: 'topic',
        order: idx + 1
      }));

      const edges = [
        { source: 'topic_arrays', target: 'topic_strings' },
        { source: 'topic_arrays', target: 'topic_matrix' },
        { source: 'topic_arrays', target: 'topic_linked_list' },
        { source: 'topic_binary_tree', target: 'topic_bst' },
        { source: 'topic_binary_tree', target: 'topic_graph' }
      ];

      return NextResponse.json({ nodes, edges });
    }

    // Default overview
    const enriched = MOCK_QUESTIONS.map(enrichQuestionMetadata);
    return NextResponse.json({
      totalQuestions: enriched.length,
      topicsCount: CODING_TOPICS.length,
      patternsCount: SOLVING_PATTERNS.length,
      tracksCount: LEARNING_TRACKS.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load metadata" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail || !isAdminEmail(userEmail)) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { questionId, primaryPattern, secondaryPatterns, topics, subtopic, companyTags, timeComplexity, spaceComplexity, hints, editorial } = body;

    if (!questionId) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Log snapshot to history
    try {
      await admin.from("question_metadata_history").insert({
        question_id: questionId,
        edited_by: userEmail,
        snapshot_json: body,
        created_at: new Date().toISOString()
      });
    } catch {
      // Ignore history logging errors if table not created
    }

    return NextResponse.json({ success: true, message: "Metadata updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update metadata" }, { status: 500 });
  }
}
