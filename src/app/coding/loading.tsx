export default function CodingLoading() {
  return (
    <main
      className="min-h-screen pt-8 pb-12"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl skeleton" />
          <div className="space-y-2">
            <div className="w-48 h-6 skeleton rounded" />
            <div className="w-32 h-4 skeleton rounded" />
          </div>
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="h-14 skeleton rounded-xl mb-5" />

        {/* Table Skeleton */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-primary)" }}>
          <div className="h-10 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]" />
          <div className="space-y-[1px] bg-[var(--border-primary)]">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-14 skeleton bg-[var(--bg-card)]" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
