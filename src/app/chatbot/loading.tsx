export default function ChatbotLoading() {
  return (
    <main className="min-h-screen px-4 pb-10 pt-6 md:px-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-12 w-72 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="h-[34rem] animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
          <div className="h-[34rem] animate-pulse rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />
        </div>
      </div>
    </main>
  );
}