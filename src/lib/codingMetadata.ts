// Taxonomy Definitions and Types for NextHire Enterprise Coding Platform

export type FrequencyTier = 'High' | 'Medium' | 'Low';

export type CodingSolution = {
  id: string;
  title: string;
  pattern: string;
  isPrimary: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  codeTemplates: {
    python?: string;
    cpp?: string;
    java?: string;
    javascript?: string;
  };
};

export type InterviewInsights = {
  whyAsked: string;
  skillsEvaluated: string[];
  interviewerFollowups: string[];
  candidateMistakes: string[];
};

export type QuestionRichMetadata = {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  eloRating: number;
  acceptanceRate: number;
  topics: string[];
  subtopic: string;
  primaryPattern: string;
  secondaryPatterns: string[];
  companies: Array<{ name: string; tier: FrequencyTier; score: number }>;
  timeComplexity: string;
  spaceComplexity: string;
  solutions: CodingSolution[];
  prerequisites: Array<{ id: string; title: string }>;
  nextProblems: Array<{ id: string; title: string }>;
  hardFollowup?: { id: string; title: string };
  companyVariants: Array<{ company: string; variantTitle: string; notes?: string }>;
  insights: InterviewInsights;
  confidenceScore: number;
  hints: string[];
  editorial: string;
  sampleTestCases: Array<{ input: string; output: string }>;
  hiddenTestCases: Array<{ input: string; output: string }>;
  starterCode: Record<string, string>;
};

export const CODING_TOPICS = [
  'Arrays',
  'Strings',
  'Linked List',
  'Binary Tree',
  'BST',
  'Graph',
  'Heap',
  'Trie',
  'Queue',
  'Stack',
  'Hash Table',
  'Matrix',
  'Intervals',
  'Math',
  'Geometry',
  'Simulation',
  'Design'
] as const;

export const SOLVING_PATTERNS = [
  'Two Pointers',
  'Sliding Window',
  'Fast Slow Pointer',
  'Prefix Sum',
  'Difference Array',
  'Binary Search',
  'Sorting',
  'Merge Intervals',
  'Greedy',
  'Recursion',
  'Backtracking',
  'DFS',
  'BFS',
  'Tree DFS',
  'Tree BFS',
  'Dynamic Programming',
  'Memoization',
  'Tabulation',
  'Bitmask DP',
  'Bit Manipulation',
  'Monotonic Stack',
  'Monotonic Queue',
  'Heap / Priority Queue',
  'Trie',
  'Union Find (DSU)',
  'Topological Sort',
  'Shortest Path',
  'Minimum Spanning Tree',
  'Segment Tree',
  'Fenwick Tree / BIT',
  'Sweep Line',
  'Meet in the Middle',
  'Binary Lifting',
  'Euler Tour',
  'Rolling Hash',
  'KMP Algorithm',
  'Z Algorithm',
  'Rabin Karp',
  'Manacher Algorithm',
  'Suffix Array',
  'Geometry',
  'Game Theory',
  'Math Logic',
  'Simulation Engine',
  'Design Data Structure',
  'Randomized Algorithms',
  'Advanced Data Structures'
] as const;

export type PatternRecognitionSignal = {
  keyword: string;
  pattern: string;
  description: string;
};

export const RECOGNITION_SIGNALS: PatternRecognitionSignal[] = [
  { keyword: 'longest / shortest contiguous subarray', pattern: 'Sliding Window', description: 'Dynamic range expanding and shrinking based on validity condition.' },
  { keyword: 'k closest / top k frequent elements', pattern: 'Heap / Priority Queue', description: 'Min-heap or Max-heap maintains top K elements efficiently in O(N log K).' },
  { keyword: 'minimum steps / shortest path in unweighted grid', pattern: 'BFS', description: 'Breadth-First Search guarantees level-by-level shortest path traversal.' },
  { keyword: 'shortest path in weighted graph', pattern: 'Shortest Path', description: 'Dijkstra algorithm using Priority Queue or Bellman-Ford for negative edges.' },
  { keyword: 'connected components / grouping relationships', pattern: 'Union Find (DSU)', description: 'Disjoint Set Union with path compression and rank optimization.' },
  { keyword: 'sorted array search / search in monotonic range', pattern: 'Binary Search', description: 'Halving search space at each step in O(log N) complexity.' },
  { keyword: 'next greater / next smaller element', pattern: 'Monotonic Stack', description: 'Maintain monotonic increasing/decreasing order in O(N) linear time.' },
  { keyword: 'prefix sum / range sum queries without updates', pattern: 'Prefix Sum', description: 'Precomputing prefix array enables O(1) range sum evaluation.' },
  { keyword: 'range updates / range sum queries with updates', pattern: 'Segment Tree', description: 'Tree-based structure allowing O(log N) updates and range queries.' },
  { keyword: 'all permutations / combinations / subset search', pattern: 'Backtracking', description: 'Depth-first decision tree with state rollback.' }
];

export const PATTERN_TEMPLATES: Record<string, Record<string, string>> = {
  'Sliding Window': {
    python: `def sliding_window(nums, k):\n    left = 0\n    current_sum = 0\n    max_val = 0\n    for right in range(len(nums)):\n        current_sum += nums[right]\n        while not is_valid(current_sum):\n            current_sum -= nums[left]\n            left += 1\n        max_val = max(max_val, current_sum)\n    return max_val`,
    cpp: `int slidingWindow(vector<int>& nums, int k) {\n    int left = 0, currentSum = 0, maxVal = 0;\n    for (int right = 0; right < nums.size(); ++right) {\n        currentSum += nums[right];\n        while (!isValid(currentSum)) {\n            currentSum -= nums[left++];\n        }\n        maxVal = max(maxVal, currentSum);\n    }\n    return maxVal;\n}`,
    java: `public int slidingWindow(int[] nums, int k) {\n    int left = 0, currentSum = 0, maxVal = 0;\n    for (int right = 0; right < nums.length; right++) {\n        currentSum += nums[right];\n        while (!isValid(currentSum)) {\n            currentSum -= nums[left++];\n        }\n        maxVal = Math.max(maxVal, currentSum);\n    }\n    return maxVal;\n}`,
    javascript: `function slidingWindow(nums, k) {\n  let left = 0, currentSum = 0, maxVal = 0;\n  for (let right = 0; right < nums.length; right++) {\n    currentSum += nums[right];\n    while (!isValid(currentSum)) {\n      currentSum -= nums[left++];\n    }\n    maxVal = Math.max(maxVal, currentSum);\n  }\n  return maxVal;\n}`
  },
  'Two Pointers': {
    python: `def two_pointers(nums, target):\n    left, right = 0, len(nums) - 1\n    while left < right:\n        val = nums[left] + nums[right]\n        if val == target:\n          return [left, right]\n        elif val < target:\n          left += 1\n        else:\n          right -= 1\n    return []`,
    cpp: `vector<int> twoPointers(vector<int>& nums, int target) {\n    int left = 0, right = nums.size() - 1;\n    while (left < right) {\n        int sum = nums[left] + nums[right];\n        if (sum == target) return {left, right};\n        if (sum < target) left++;\n        else right--;\n    }\n    return {};\n}`,
    java: `public int[] twoPointers(int[] nums, int target) {\n    int left = 0, right = nums.length - 1;\n    while (left < right) {\n        int sum = nums[left] + nums[right];\n        if (sum == target) return new int[]{left, right};\n        if (sum < target) left++;\n        else right--;\n    }\n    return new int[0];\n}`,
    javascript: `function twoPointers(nums, target) {\n  let left = 0, right = nums.length - 1;\n  while (left < right) {\n    const sum = nums[left] + nums[right];\n    if (sum === target) return [left, right];\n    if (sum < target) left++;\n    else right--;\n  }\n  return [];\n}`
  }
};

export const LEARNING_TRACKS = [
  {
    id: 'faang-dsa',
    title: 'FAANG DSA Masterclass',
    targetAudience: 'Top product company interviewees (Google, Amazon, Meta, Apple)',
    estimatedDays: 60,
    topics: ['Arrays', 'Strings', 'Graph', 'Binary Tree', 'Dynamic Programming']
  },
  {
    id: 'amazon-sde',
    title: 'Amazon SDE Track',
    targetAudience: 'Candidates preparing for Amazon SDE 1 & SDE 2 technical rounds',
    estimatedDays: 45,
    topics: ['Arrays', 'Heap', 'Graph', 'Tree DFS', 'Two Pointers']
  },
  {
    id: 'tcs-infosys',
    title: 'Service-Based Companies (TCS / Infosys / Wipro / Accenture)',
    targetAudience: 'Campus drives for IT service sector roles',
    estimatedDays: 21,
    topics: ['Arrays', 'Strings', 'Math', 'Simulation']
  },
  {
    id: '30-day-placement',
    title: '30-Day Placement Intensive',
    targetAudience: 'Rapid refresher for upcoming campus placement season',
    estimatedDays: 30,
    topics: ['Arrays', 'Linked List', 'Binary Search', 'Trees', 'DP']
  }
];
