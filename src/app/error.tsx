"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route Error:", error);
  }, [error]);

  return (
    <div className="p-8 border border-red-500 bg-red-950/20 text-red-500 rounded-xl my-4">
      <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
      <button onClick={() => reset()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
        Try again
      </button>
    </div>
  );
}
