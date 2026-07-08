"use client";

import { useEffect } from "react";
import { logError } from "@/lib/observability/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("GlobalError", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
          <h2 className="text-3xl font-bold mb-4">Critical System Failure</h2>
          <p className="mb-8">We've been notified and are working on it.</p>
          <button onClick={() => reset()} className="px-4 py-2 bg-blue-600 rounded">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
