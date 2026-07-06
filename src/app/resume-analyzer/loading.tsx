export default function ResumeAnalyzerLoading() {
  return (
    <main className="min-h-screen px-4 pb-10 pt-4 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="h-10 w-28 animate-pulse rounded-xl bg-black/10 dark:bg-white/10" />
          <div className="h-10 w-44 animate-pulse rounded-xl bg-black/10 dark:bg-white/10" />
        </div>
        <div className="h-36 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="h-72 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5 lg:col-span-4" />
          <div className="h-72 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5 lg:col-span-8" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
          <div className="h-64 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
        </div>
      </div>
    </main>
  );
}