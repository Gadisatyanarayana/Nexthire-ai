export default function Loading() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-black dark:bg-black dark:text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="h-12 w-44 rounded-2xl bg-black/10 dark:bg-white/10" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5">
              <div className="h-4 w-24 rounded-full bg-black/10 dark:bg-white/10" />
              <div className="mt-4 h-8 w-2/3 rounded-xl bg-black/10 dark:bg-white/10" />
              <div className="mt-3 h-3 w-full rounded-full bg-black/10 dark:bg-white/10" />
              <div className="mt-2 h-3 w-5/6 rounded-full bg-black/10 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
