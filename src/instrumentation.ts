import { getStartupDiagnosticsSnapshot } from "@/lib/startupDiagnostics";

const LOG_PREFIX = "[startup-diag]";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const snapshot = getStartupDiagnosticsSnapshot();
  console.info(`${LOG_PREFIX} boot at=${snapshot.bootIso}`);
}
