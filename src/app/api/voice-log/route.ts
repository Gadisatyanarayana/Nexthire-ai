import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { msg } = await req.json();
    const logPath = path.join(process.cwd(), 'voice-debug.log');
    fs.appendFileSync(logPath, msg + '\n');
    console.log(`[CLIENT LOG] ${msg}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false });
  }
}
