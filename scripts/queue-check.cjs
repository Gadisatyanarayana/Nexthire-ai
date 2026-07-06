process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");

const { getJudgeQueue } = require("../src/judge/queue");

(async () => {
  const q = getJudgeQueue();
  const counts = await q.getJobCounts("waiting", "active", "completed", "failed", "delayed", "paused");
  console.log(JSON.stringify(counts, null, 2));
  process.exit(0);
})().catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});
