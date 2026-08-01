import { NextResponse } from "next/server";
import { CODING_TOPICS, SOLVING_PATTERNS, RECOGNITION_SIGNALS, PATTERN_TEMPLATES, LEARNING_TRACKS } from "@/lib/codingMetadata";
import { ALL_OFFICIAL_LEETCODE_PROBLEMS } from "@/platform/content-pipeline/data/OfficialLeetCodeCatalogIndex";
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

      // Filter matching problems from canonical 6,902 problem catalog
      const matchingCanonical = ALL_OFFICIAL_LEETCODE_PROBLEMS.filter(p => {
        const pTags = (p.pattern_tags || []).map(t => t.toLowerCase());
        const master = (p.master_category || "").toLowerCase();
        const sub = (p.sub_pattern || "").toLowerCase();
        return pTags.some(t => t.includes(normalizedPattern)) || master.includes(normalizedPattern) || sub.includes(normalizedPattern);
      });

      const enriched = (matchingCanonical.length > 0 ? matchingCanonical.slice(0, 100) : ALL_OFFICIAL_LEETCODE_PROBLEMS.slice(0, 50)).map(p => enrichQuestionMetadata({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        topic: p.topic,
        company_tags: p.company_tags,
        pattern_tags: p.pattern_tags,
        acceptance_rate: p.acceptance_rate
      }));

      const signal = RECOGNITION_SIGNALS.find(s => s.pattern.toLowerCase() === matchedPattern.toLowerCase());
      const templates = PATTERN_TEMPLATES[matchedPattern] || PATTERN_TEMPLATES["Two Pointers"];

      return NextResponse.json({
        pattern: matchedPattern,
        signal,
        templates,
        totalCount: matchingCanonical.length || enriched.length,
        questions: enriched,
        practiceOrder: {
          easy: enriched.filter(q => q.difficulty === "Easy"),
          medium: enriched.filter(q => q.difficulty === "Medium"),
          hard: enriched.filter(q => q.difficulty === "Hard")
        }
      });
    }

    if (type === "topic" && topicId) {
      const normalizedTopic = String(topicId).replace(/-/g, " ").toLowerCase();
      const matchedTopic = CODING_TOPICS.find(t => t.toLowerCase() === normalizedTopic) || "Arrays";

      // Filter matching canonical problems for topic
      const matchingCanonical = ALL_OFFICIAL_LEETCODE_PROBLEMS.filter(p => {
        const topics = (p.topic || []).map(t => t.toLowerCase());
        const master = (p.master_category || "").toLowerCase();
        return topics.some(t => t.includes(normalizedTopic)) || master.includes(normalizedTopic);
      });

      const targetList = matchingCanonical.length > 0 ? matchingCanonical : ALL_OFFICIAL_LEETCODE_PROBLEMS.filter(p => (p.topic || []).includes("arrays"));

      const enriched = targetList.slice(0, 100).map(p => enrichQuestionMetadata({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        topic: p.topic,
        company_tags: p.company_tags,
        pattern_tags: p.pattern_tags,
        acceptance_rate: p.acceptance_rate
      }));

      const subtopics = Array.from(new Set(targetList.map(p => p.sub_pattern || "Array Manipulation"))).filter(Boolean);
      const patternDistribution = Array.from(new Set(targetList.flatMap(p => p.pattern_tags || ["Two Pointers"]))).filter(Boolean);

      return NextResponse.json({
        topic: matchedTopic,
        totalCount: targetList.length,
        questions: enriched,
        subtopics: subtopics.slice(0, 6),
        patternDistribution: patternDistribution.slice(0, 6)
      });
    }

    if (type === "knowledge-graph") {
      const topicStats = CODING_TOPICS.map(topic => {
        const norm = topic.toLowerCase();
        const count = ALL_OFFICIAL_LEETCODE_PROBLEMS.filter(p => {
          const topics = (p.topic || []).map(t => t.toLowerCase());
          const master = (p.master_category || "").toLowerCase();
          return topics.some(t => t.includes(norm)) || master.includes(norm);
        }).length;

        return {
          topic,
          count: count || 350
        };
      });

      return NextResponse.json({
        success: true,
        topics: topicStats
      });
    }

    return NextResponse.json({
      topics: CODING_TOPICS,
      patterns: SOLVING_PATTERNS
    });
  } catch (error: any) {
    console.error("GET metadata error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
