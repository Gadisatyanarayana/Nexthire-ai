import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

// Simple GraphQL schema parser
type GraphQLQuery = {
  query: string;
  variables?: Record<string, any>;
};

interface QueryParams {
  userId?: string;
  limit?: number;
  offset?: number;
  questionId?: string;
}

async function resolveQuery(
  query: string,
  variables: Record<string, any> = {}
): Promise<any> {
  // Query: submissions { id, userId, questionId, language, result, createdAt }
  if (query.includes('submissions')) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error('Unauthorized');
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle();

    if (!userData?.id) {
      return { submissions: [] };
    }

    const limit = variables.limit || 50;
    const offset = variables.offset || 0;

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

    return {
      submissions: (data || []).map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        questionId: s.question_id,
        language: s.language,
        code: s.code,
        output: s.output,
        result: s.result,
        feedback: s.feedback,
        difficulty: s.difficulty,
        createdAt: s.created_at,
      })),
    };
  }

  if (query.includes('submissionStats')) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error('Unauthorized');
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle();

    if (!userData?.id) {
      return { stats: null };
    }

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('result,difficulty,language')
      .eq('user_id', userData.id);

    if (error) throw error;

    const total = submissions?.length || 0;
    const passed = submissions?.filter((s: any) => s.result === 'All Tests Passed ✓').length || 0;
    const byDifficulty: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};

    submissions?.forEach((s: any) => {
      byDifficulty[s.difficulty || 'unknown'] = (byDifficulty[s.difficulty || 'unknown'] || 0) + 1;
      byLanguage[s.language || 'unknown'] = (byLanguage[s.language || 'unknown'] || 0) + 1;
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
    const { query, variables } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const result = await resolveQuery(query, variables);

    return NextResponse.json({
      data: result,
    });
  } catch (error: any) {
    console.error('GraphQL error:', error);
    return NextResponse.json(
      {
        errors: [
          {
            message: error.message || 'GraphQL query failed',
          },
        ],
      },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// GET endpoint for exploration
export async function GET() {
  return NextResponse.json({
    schema: {
      queries: {
        submissions: {
          description: 'Get user submissions',
          args: { limit: 'int', offset: 'int' },
          fields: [
            'id',
            'userId',
            'questionId',
            'language',
            'code',
            'output',
            'result',
            'feedback',
            'difficulty',
            'createdAt',
          ],
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
