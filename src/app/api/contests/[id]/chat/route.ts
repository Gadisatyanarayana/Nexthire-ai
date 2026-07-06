import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Chat has been disabled on this platform.' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Chat has been disabled on this platform.' }, { status: 404 });
}
