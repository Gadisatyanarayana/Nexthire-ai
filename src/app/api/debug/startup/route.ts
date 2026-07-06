import { NextResponse } from "next/server";
import { getStartupDiagnosticsSnapshot } from "@/lib/startupDiagnostics";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const diagnostics = getStartupDiagnosticsSnapshot();
  const memory = process.memoryUsage();

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryMb: {
          rss: Math.round(memory.rss / 1024 / 1024),
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        },
      },
      diagnostics,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
