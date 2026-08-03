import { NextRequest } from 'next/server';
import { POST as submitPost } from '@/app/api/submit/route';

export async function POST(request: Request) {
  const body = await request.json();
  const nextReq = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      problem_id: body.problemId || body.problem_id,
      code: body.code,
      language_id: body.language || body.language_id
    })
  });

  return submitPost(nextReq);
}
