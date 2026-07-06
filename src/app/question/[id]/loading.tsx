export default function QuestionLoading() {
  return (
    <main
      className="flex flex-col overflow-hidden"
      style={{ height: "100vh", background: "var(--bg-primary)" }}
    >
      {/* Navbar skeleton */}
      <div className="flex items-center justify-between px-3 flex-shrink-0" style={{ height: "48px", borderBottom: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}>
        <div className="w-32 h-6 skeleton rounded" />
        <div className="flex gap-2">
          <div className="w-16 h-6 skeleton rounded" />
          <div className="w-16 h-6 skeleton rounded" />
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative p-2 gap-2">
        {/* Left Panel (Description) */}
        <div className="flex-1 rounded-xl flex flex-col overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
          <div className="h-10 skeleton border-b border-[var(--border-primary)]" />
          <div className="p-5 space-y-4">
            <div className="w-3/4 h-8 skeleton rounded" />
            <div className="w-1/4 h-5 skeleton rounded" />
            <div className="space-y-2 mt-8">
              <div className="w-full h-4 skeleton rounded" />
              <div className="w-full h-4 skeleton rounded" />
              <div className="w-5/6 h-4 skeleton rounded" />
            </div>
            <div className="mt-8 h-32 skeleton rounded-xl" />
          </div>
        </div>

        {/* Right Section (Editor + Console) */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex-1 rounded-xl flex flex-col overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
            <div className="h-10 skeleton border-b border-[var(--border-primary)] flex items-center px-3 gap-2">
              <div className="w-20 h-5 skeleton rounded" />
            </div>
            <div className="flex-1 p-4 space-y-2">
               <div className="w-1/2 h-4 skeleton rounded opacity-50" />
               <div className="w-1/3 h-4 skeleton rounded opacity-50" />
            </div>
          </div>
          
          <div className="h-[250px] rounded-xl flex flex-col overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
            <div className="h-10 skeleton border-b border-[var(--border-primary)] flex items-center px-3 gap-2">
              <div className="w-24 h-5 skeleton rounded" />
              <div className="w-24 h-5 skeleton rounded" />
            </div>
            <div className="flex-1 p-4">
               <div className="w-full h-12 skeleton rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}