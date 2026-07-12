import { NextRequest, NextResponse } from "next/server";
import { SafeLLMClient } from "@/lib/llm/SafeLLMClient";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ success: false, error: "Missing query" }, { status: 400 });
    }

    const systemPrompt = `
      You are an NLP to SQL/Filter converter for an Aptitude Preparation platform.
      Convert the user's natural language query into a structured JSON filter object.
      
      Available topics include: percentages, ratio, profit and loss, time and work, etc.
      Available difficulties: easy, medium, hard.
      Available types: questions, revision, lessons, mocks.

      Output JSON strictly in this format:
      {
        "intent": "questions" | "revision" | "lessons" | "mocks" | "weak_topics",
        "topic": string | null,
        "difficulty": "easy" | "medium" | "hard" | null,
        "company": string | null,
        "timeframe": string | null
      }
    `;

    const resultStr = await SafeLLMClient.generateStructuredJSON([{ role: 'system', content: systemPrompt }, { role: 'user', content: query }], z.any());
    
    let structuredFilter;
    try {
      structuredFilter = typeof resultStr === 'string' ? JSON.parse(resultStr) : resultStr;
    } catch (e) {
      structuredFilter = { intent: "lessons", topic: query, difficulty: null, company: null, timeframe: null };
    }

    return NextResponse.json({
      success: true,
      filter: structuredFilter
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
