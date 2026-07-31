export default function ReviewQueuePage() {
  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Review Queue</h1>
          <p className="text-gray-500 mt-2">Approve, reject, or modify pipeline output before it reaches production.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded shadow hover:bg-blue-700 transition">
            Process Next
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-sm">
              <th className="p-4 font-medium text-gray-500">ID / Title</th>
              <th className="p-4 font-medium text-gray-500">Confidence</th>
              <th className="p-4 font-medium text-gray-500">Pipeline Stage</th>
              <th className="p-4 font-medium text-gray-500">Reason / Notes</th>
              <th className="p-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Mock Item */}
            <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="p-4">
                <div className="font-semibold text-blue-600">Q-1042</div>
                <div className="text-sm text-gray-500">Find Longest Substring</div>
              </td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  82% - Low
                </span>
              </td>
              <td className="p-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">Solution Verification</span>
              </td>
              <td className="p-4 text-sm text-gray-500">
                LLM regenerated optimal solution 3 times before passing hidden tests.
              </td>
              <td className="p-4">
                <button className="text-sm text-blue-600 hover:underline">Review Diff</button>
              </td>
            </tr>
            {/* End Mock Item */}
            {/* Mock Item */}
            <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="p-4">
                <div className="font-semibold text-blue-600">Q-0012</div>
                <div className="text-sm text-gray-500">Untitled Problem</div>
              </td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Metadata AI
                </span>
              </td>
              <td className="p-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">Metadata Classification</span>
              </td>
              <td className="p-4 text-sm text-gray-500">
                Title contained placeholder. LLM renamed to "Integer to Roman". Please verify.
              </td>
              <td className="p-4">
                <button className="text-sm text-blue-600 hover:underline">Review Diff</button>
              </td>
            </tr>
            {/* End Mock Item */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
