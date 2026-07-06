process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");

const { getJudgeQueue } = require("../src/judge/queue");

(async () => {
  const q = getJudgeQueue();
  const jobs = await q.getJobs(["failed"], 0, 10, true);
  const out = jobs.map((j) => ({
    id: j.id,
    name: j.name,
    failedReason: j.failedReason,
    attemptsMade: j.attemptsMade,
    stacktrace: j.stacktrace,
    data: j.data,
  }));
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
})().catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});
