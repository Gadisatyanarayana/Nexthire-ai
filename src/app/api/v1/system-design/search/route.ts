import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/systemDesignV2';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // Since we don't have pgvector installed, we'll simulate a unified semantic search 
    // by using ilike across the major tables and normalizing the results.
    const searchPattern = `*%${query}%*`;

    // 1. Search Lessons
    const { data: lessons } = await supabaseAdmin
      .from("sd_lessons")
      .select("id, title, content")
      .ilike("title", searchPattern)
      .limit(5);

    // 2. Search Case Studies
    const { data: cases } = await supabaseAdmin
      .from("sd_case_studies")
      .select("id, title, content")
      .ilike("title", searchPattern)
      .limit(5);

    // 3. Search Companies
    const { data: companies } = await supabaseAdmin
      .from("sd_company_profiles")
      .select("id, name, focus")
      .ilike("name", searchPattern)
      .limit(5);

    const results = [
      ...(lessons?.map(l => ({ type: 'lesson', id: l.id, title: l.title })) || []),
      ...(cases?.map(c => ({ type: 'case_study', id: c.id, title: c.title })) || []),
      ...(companies?.map(c => ({ type: 'company', id: c.id, title: c.name })) || []),
    ];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Semantic Search Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
