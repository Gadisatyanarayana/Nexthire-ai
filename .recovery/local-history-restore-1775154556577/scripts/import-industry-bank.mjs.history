#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function main() {
  const shouldReset = process.argv.includes("--reset");

  if (shouldReset) {
    console.log("Step 1/3: Resetting existing question bank...");
    run("node", ["scripts/reset-question-bank.mjs"]);
  }

  console.log("Step 2/3: Importing Codeforces dataset...");
  run("node", ["scripts/import-codeforces.mjs"]);

  console.log("Step 3/3: Importing curated GFG dataset...");
  run("node", ["scripts/import-gfg-curated.mjs"]);

  console.log("Industry question bank import complete.");
}

try {
  main();
} catch (err) {
  console.error("Import pipeline failed:", err.message || err);
  process.exit(1);
}
