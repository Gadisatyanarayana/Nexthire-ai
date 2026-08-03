import { NextRequest } from 'next/server';
import { POST as runPost } from '@/app/api/run/route';

export async function POST(request: Request) {
  const body = await request.json();
  const nextReq = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      problem_id: body.problemId || body.problem_id,
      code: body.code,
      language: body.language,
      stdin: body.customInput || body.stdin
    })
  });

  return runPost(nextReq);
}
