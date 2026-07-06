process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");

const fs = require("fs");
const { executeInSandbox } = require("../src/judge/dockerExecutor");

(async () => {
  const result = await executeInSandbox({
    language: "python",
    code: "print(1)",
    stdin: "",
  });

  fs.writeFileSync("tmp_sandbox_result.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
})().catch((error) => {
  const payload = { error: error && error.message ? error.message : String(error) };
  fs.writeFileSync("tmp_sandbox_result.json", JSON.stringify(payload, null, 2));
  console.error(payload.error);
  process.exit(1);
});
