import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type GraphQLQuery = {
  query: string;
  variables?: {
    limit?: number;
    offset?: number;
    [key: string]: unknown;
  };
};

type SubmissionRow = {
  id: string;
  user_id: string;
  question_id: string | null;
  language: string | null;
  code: string | null;
  output: string | null;
  result: string | null;
  feedback: string | null;
  difficulty: string | null;
  created_at: string;
};

type SubmissionStatsRow = {
  result: string | null;
  difficulty: string | null;
  language: string | null;
};

type GraphQLResult =
  | {
      submissions: Array<{
        id: string;
        userId: string;
        questionId: string | null;
        language: string | null;
        code: string | null;
        output: string | null;
        result: string | null;
        feedback: string | null;
        difficulty: string | null;
        createdAt: string;
      }>;
    }
  | {
      stats: {
        totalSubmissions: number;
        passedSubmissions: number;
        successRate: number;
        byDifficulty: Record<string, number>;
        byLanguage: Record<string, number>;
      };
    }
  | { stats: null };

async function resolveQuery(query: string, variables: GraphQLQuery['variables'] = {}): Promise<GraphQLResult> {
  if (query.includes('submissions')) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle();

    if (!userData?.id) return { submissions: [] };

    const limit = Number(variables?.limit || 50);
    const offset = Number(variables?.offset || 0);

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id,
        user_id,
        question_id,
        language,
        code,
        output,
        result,
        feedback,
        difficulty,
        created_at
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const rows = Array.isArray(data) ? (data as SubmissionRow[]) : [];
    return {
      submissions: rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        questionId: row.question_id,
        language: row.language,
        code: row.code,
        output: row.output,
        result: row.result,
        feedback: row.feedback,
        difficulty: row.difficulty,
        createdAt: row.created_at,
      })),
    };
  }

  if (query.includes('submissionStats')) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle();

    if (!userData?.id) return { stats: null };

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('result,difficulty,language')
      .eq('user_id', userData.id);

    if (error) throw error;

    const rows = Array.isArray(submissions) ? (submissions as SubmissionStatsRow[]) : [];
    const total = rows.length;
    const passed = rows.filter((row) => row.result === 'All Tests Passed ✓').length;
    const byDifficulty: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};

    rows.forEach((row) => {
      const difficulty = row.difficulty || 'unknown';
      const language = row.language || 'unknown';
      byDifficulty[difficulty] = (byDifficulty[difficulty] || 0) + 1;
      byLanguage[language] = (byLanguage[language] || 0) + 1;
    });

    return {
      stats: {
        totalSubmissions: total,
        passedSubmissions: passed,
        successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        byDifficulty,
        byLanguage,
      },
    };
  }

  throw new Error('Unknown query');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GraphQLQuery;
    if (!body.query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const result = await resolveQuery(body.query, body.variables);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'GraphQL query failed';
    console.error('GraphQL error:', error);
    return NextResponse.json({ errors: [{ message }] }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    schema: {
      queries: {
        submissions: {
          description: 'Get user submissions',
          args: { limit: 'int', offset: 'int' },
          fields: ['id', 'userId', 'questionId', 'language', 'code', 'output', 'result', 'feedback', 'difficulty', 'createdAt'],
        },
        submissionStats: {
          description: 'Get submission statistics for current user',
          fields: ['totalSubmissions', 'passedSubmissions', 'successRate', 'byDifficulty', 'byLanguage'],
        },
      },
    },
    examples: {
      getSubmissions: {
        query: `{ submissions { id questionId language result createdAt } }`,
        variables: {},
      },
      getStats: {
        query: `{ submissionStats { totalSubmissions passedSubmissions successRate } }`,
        variables: {},
      },
    },
  });
}
