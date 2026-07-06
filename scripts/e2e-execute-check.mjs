import fs from 'node:fs';

const endpoint = 'http://localhost:3000/api/execute';

async function post(body) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

const cases = [
  {
    name: 'JAVA SCALAR',
    payload: {
      code: 'class Solution { public int add(int a, int b) { return a + b; } }',
      language: 'java',
      functionName: 'add',
      inputType: 'int,int',
      outputType: 'int',
      testcases: [{ input: '2,3', expectedOutput: '5' }],
    },
  },
  {
    name: 'CPP SCALAR',
    payload: {
      code: 'class Solution { public: int add(int a, int b) { return a + b; } };',
      language: 'cpp',
      functionName: 'add',
      inputType: 'int,int',
      outputType: 'int',
      testcases: [{ input: '2,3', expectedOutput: '5' }],
    },
  },
  {
    name: 'JAVA ARRAY',
    payload: {
      code: 'class Solution { public int[] identity(int[] nums) { return nums; } }',
      language: 'java',
      functionName: 'identity',
      inputType: 'int[]',
      outputType: 'int[]',
      testcases: [{ input: '[1,2,3,4]', expectedOutput: '[1,2,3,4]' }],
    },
  },
  {
    name: 'CPP ARRAY',
    payload: {
      code: 'class Solution { public: vector<int> identity(vector<int>& nums) { return nums; } };',
      language: 'cpp',
      functionName: 'identity',
      inputType: 'int[]',
      outputType: 'int[]',
      testcases: [{ input: '[1,2,3,4]', expectedOutput: '[1,2,3,4]' }],
    },
  },
  {
    name: 'JAVA 2D ARRAY',
    payload: {
      code: 'class Solution { public int[][] identity(int[][] grid) { return grid; } }',
      language: 'java',
      functionName: 'identity',
      inputType: 'int[][]',
      outputType: 'int[][]',
      testcases: [{ input: '[[1,2],[3,4]]', expectedOutput: '[[1,2],[3,4]]' }],
    },
  },
  {
    name: 'JAVA STRING',
    payload: {
      code: 'class Solution { public String echo(String text) { return text; } }',
      language: 'java',
      functionName: 'echo',
      inputType: 'string',
      outputType: 'string',
      testcases: [{ input: '"hello"', expectedOutput: 'hello' }],
    },
  },
  {
    name: 'JAVA NAMED ORDER',
    payload: {
      code: 'class Solution { public int pick(int[] nums, int k) { return nums[k]; } }',
      language: 'java',
      functionName: 'pick',
      inputType: 'int[],int',
      outputType: 'int',
      testcases: [{ input: 'k=2, nums=[10,20,30,40]', expectedOutput: '30' }],
    },
  },
  {
    name: 'CPP 2D ARRAY',
    payload: {
      code: 'class Solution { public: vector<vector<int>> identity(vector<vector<int>>& grid) { return grid; } };',
      language: 'cpp',
      functionName: 'identity',
      inputType: 'int[][]',
      outputType: 'int[][]',
      testcases: [{ input: '[[1,2],[3,4]]', expectedOutput: '[[1,2],[3,4]]' }],
    },
  },
  {
    name: 'CPP STRING',
    payload: {
      code: 'class Solution { public: string echo(string text) { return text; } };',
      language: 'cpp',
      functionName: 'echo',
      inputType: 'string',
      outputType: 'string',
      testcases: [{ input: '"hello"', expectedOutput: 'hello' }],
    },
  },
  {
    name: 'CPP NAMED ORDER',
    payload: {
      code: 'class Solution { public: int pick(vector<int>& nums, int k) { return nums[k]; } };',
      language: 'cpp',
      functionName: 'pick',
      inputType: 'int[],int',
      outputType: 'int',
      testcases: [{ input: 'k=2, nums=[10,20,30,40]', expectedOutput: '30' }],
    },
  },
  {
    name: 'PYTHON STRING',
    payload: {
      code: 'class Solution:\n    def echo(self, text):\n        return text',
      language: 'python',
      functionName: 'echo',
      inputType: 'string',
      outputType: 'string',
      testcases: [{ input: '"hello"', expectedOutput: 'hello' }],
    },
  },
  {
    name: 'PYTHON NAMED ORDER',
    payload: {
      code: 'class Solution:\n    def pick(self, nums, k):\n        return nums[k]',
      language: 'python',
      functionName: 'pick',
      inputType: 'int[],int',
      outputType: 'int',
      testcases: [{ input: 'k=2, nums=[10,20,30,40]', expectedOutput: '30' }],
    },
  },
  {
    name: 'PYTHON SUBMIT HIDDEN ASSESS',
    payload: {
      code: 'class Solution:\n    def add(self, a, b):\n        return a + b',
      language: 'python',
      functionName: 'add',
      inputType: 'int,int',
      outputType: 'int',
      submit: true,
      testcases: [
        { input: '1,2', expectedOutput: '3', isHidden: false },
        { input: '3,4', expectedOutput: '7', isHidden: true },
        { input: '10,20', expectedOutput: '30', isHidden: true },
      ],
    },
  },
];

const results = [];

for (const testCase of cases) {
  const result = await post(testCase.payload);
  results.push({ name: testCase.name, ...result });
  console.log(`--- ${testCase.name} ---`);
  console.log(JSON.stringify(result, null, 2));
}

fs.writeFileSync('scripts/e2e-execute-check.out.json', JSON.stringify(results, null, 2));
