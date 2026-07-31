export default function BatchRunsPage() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Batch Runs</h1>
          <p className="text-gray-500 mt-2">Manage, monitor, and execute batch jobs for Content Intelligence.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded shadow hover:bg-blue-700 transition">
          + Start New Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Active Workers</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Queued Items</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">4,508</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Failed Jobs (Last 24h)</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">0</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          ⚙️
        </div>
        <h3 className="text-lg font-medium">No Active Batches</h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          The queue is currently empty. Click "Start New Batch" to configure a run with a specific offset and batch size.
        </p>
      </div>
    </div>
  );
}
