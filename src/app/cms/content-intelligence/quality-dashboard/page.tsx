export default function QualityDashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Quality Dashboard</h1>
        <p className="text-gray-500 mt-2">Real-time metrics for the Content Intelligence Pipeline.</p>
      </div>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Questions" value="4,508" subtitle="In Database" />
        <MetricCard title="Published" value="0" subtitle="100% Quality Gates Passed" />
        <MetricCard title="Pending Review" value="0" subtitle="In Review Queue" />
        <MetricCard title="Failed Verification" value="0" subtitle="Exceeded Max Retries" />
      </div>

      {/* AI & Pipeline Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricCard title="Average Confidence" value="0%" subtitle="Across all pipeline runs" />
        <MetricCard title="Compile Success Rate" value="0%" subtitle="First-pass compilation" />
        <MetricCard title="Hidden Test Pass Rate" value="0%" subtitle="First-pass logic verification" />
      </div>

      {/* Cost & Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard title="Tokens Used" value="0" subtitle="Estimated LLM Token Count" />
        <MetricCard title="Estimated API Cost" value="$0.00" subtitle="Based on provider pricing" />
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle }: { title: string, value: string, subtitle: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}
