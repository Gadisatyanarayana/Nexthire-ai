export default function PlacementHubLoading() {
  return (
    <main className="min-h-screen px-4 pb-10 pt-4 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-44 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
          <div className="h-72 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
          <div className="h-72 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
        </div>
        <div className="h-80 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
      </div>
    </main>
  );
}