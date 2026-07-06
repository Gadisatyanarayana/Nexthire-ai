process.env.TS_NODE_PROJECT = 'tsconfig.worker.json';
require('ts-node/register/transpile-only');

const { buildBatchWrappedCode } = require('../src/judge/batchWrappers');
const { executeInSandbox } = require('../src/judge/dockerExecutor');

(async () => {
  const code = 'class Solution { public: int add(int a, int b) { return a + b; } };';
  const wrapped = buildBatchWrappedCode('cpp', code, 'add', [{ input: '2,3', expectedOutput: '5', isHidden: false }], 'int,int');
  const result = await executeInSandbox({ language: 'cpp', code: wrapped, stdin: '' });
  console.log(JSON.stringify(result, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
