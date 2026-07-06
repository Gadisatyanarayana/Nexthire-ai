export default function EditorLoading() {
  return (
    <main className="min-h-screen px-4 pb-10 pt-4 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-black/10 dark:bg-white/10" />
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="h-144 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
          <div className="space-y-6">
            <div className="h-60 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
            <div className="h-60 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
          </div>
        </div>
      </div>
    </main>
  );
}