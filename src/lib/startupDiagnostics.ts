type PathDiagnostic = {
  path: string;
  firstSeenAt: number;
  firstSeenIso: string;
  firstDurationMs: number;
  lastSeenAt: number;
  lastSeenIso: string;
  lastDurationMs: number;
  hits: number;
};

type StartupDiagnosticsStore = {
  bootAt: number;
  bootIso: string;
  firstRequestAt: number | null;
  requestCount: number;
  paths: Record<string, PathDiagnostic>;
};

type StartupDiagnosticsSnapshot = {
  bootAt: number;
  bootIso: string;
  uptimeMs: number;
  firstRequestAt: number | null;
  firstRequestIso: string | null;
  requestCount: number;
  paths: PathDiagnostic[];
};

const MAX_TRACKED_PATHS = 80;
const LOG_PREFIX = "[startup-diag]";

declare global {
  var __nextHireStartupDiagnostics: StartupDiagnosticsStore | undefined;
}

function createStore(): StartupDiagnosticsStore {
  const now = Date.now();
  return {
    bootAt: now,
    bootIso: new Date(now).toISOString(),
    firstRequestAt: null,
    requestCount: 0,
    paths: {},
  };
}

function getStore(): StartupDiagnosticsStore {
  if (!globalThis.__nextHireStartupDiagnostics) {
    globalThis.__nextHireStartupDiagnostics = createStore();
  }
  return globalThis.__nextHireStartupDiagnostics;
}

export function recordStartupRequest(pathname: string, durationMs: number): StartupDiagnosticsStore {
  const store = getStore();
  const now = Date.now();
  const key = pathname || "/";

  store.requestCount += 1;
  if (store.firstRequestAt === null) {
    store.firstRequestAt = now;
  }

  const existing = store.paths[key];
  if (existing) {
    existing.hits += 1;
    existing.lastSeenAt = now;
    existing.lastSeenIso = new Date(now).toISOString();
    existing.lastDurationMs = durationMs;
    return store;
  }

  if (Object.keys(store.paths).length >= MAX_TRACKED_PATHS) {
    return store;
  }

  store.paths[key] = {
    path: key,
    firstSeenAt: now,
    firstSeenIso: new Date(now).toISOString(),
    firstDurationMs: durationMs,
    lastSeenAt: now,
    lastSeenIso: new Date(now).toISOString(),
    lastDurationMs: durationMs,
    hits: 1,
  };

  if (process.env.NODE_ENV !== "production") {
    console.info(`${LOG_PREFIX} first-hit path=${key} durationMs=${durationMs}`);
  }

  return store;
}

export function getStartupDiagnosticsSnapshot(): StartupDiagnosticsSnapshot {
  const store = getStore();

  return {
    bootAt: store.bootAt,
    bootIso: store.bootIso,
    uptimeMs: Math.max(0, Date.now() - store.bootAt),
    firstRequestAt: store.firstRequestAt,
    firstRequestIso: store.firstRequestAt ? new Date(store.firstRequestAt).toISOString() : null,
    requestCount: store.requestCount,
    paths: Object.values(store.paths).sort((a, b) => a.firstSeenAt - b.firstSeenAt),
  };
}
