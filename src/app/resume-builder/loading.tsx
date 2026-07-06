export default function ResumeBuilderLoading() {
  return (
    <main className="min-h-screen px-4 pb-10 pt-4 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-16 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-[34rem] animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
          <div className="space-y-6">
            <div className="h-52 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
            <div className="h-52 animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
          </div>
        </div>
      </div>
    </main>
  );
}