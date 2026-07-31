import { CanonicalLeetCodeProblem } from "./OfficialLeetCodeCatalog";

export const REAL_CANONICAL_PROBLEM_DATABASE: CanonicalLeetCodeProblem[] = [
  // 1. Two Pointers & Sorting
  {
    id: "1",
    title: "1. Two Sum",
    official_function_name: "twoSum",
    difficulty: "Easy",
    master_category: "Arrays",
    sub_pattern: "Hash Map / Two Pointers",
    topic: ["Arrays", "Hash Table"],
    company_tags: ["Amazon", "Google", "Meta", "Microsoft", "Apple"],
    pattern_tags: ["Hashing", "Two Pointers"],
    acceptance_rate: 51.2,
    time_complexity: "O(N)",
    space_complexity: "O(N)",
    description: `### 1. Two Sum\n\nGiven an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.\n\nYou may assume that each input would have ***exactly one solution***, and you may not use the *same* element twice.\n\nYou can return the answer in any order.\n\n### Constraints\n- \`2 <= nums.length <= 10^4\`\n- \`-10^9 <= nums[i] <= 10^9\`\n- \`-10^9 <= target <= 10^9\`\n- **Only one valid answer exists.**\n\n### Follow-up\nCan you come up with an algorithm that is less than \`O(n^2)\` time complexity?`,
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." },
      { input: "nums = [3,3], target = 6", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 6, we return [0, 1]." }
    ],
    testcases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false },
      { input: "[3,3]\n6", expectedOutput: "[0,1]", isHidden: true },
      { input: "[-1,-2,-3,-4,-5]\n-8", expectedOutput: "[2,4]", isHidden: true }
    ],
    starter_code: {
      javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        seen = {}\n        for i, n in enumerate(nums):\n            diff = target - n\n            if diff in seen:\n                return [seen[diff], i]\n            seen[n] = i\n        return []\n`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) {\n                return new int[] { map.get(diff), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> mp;\n        for (int i = 0; i < nums.size(); ++i) {\n            int diff = target - nums[i];\n            if (mp.count(diff)) return {mp[diff], i};\n            mp[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
      go: `func twoSum(nums []int, target int) []int { return []int{0,1} }`,
      rust: `impl Solution { pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> { vec![0,1] } }`,
      csharp: `public class Solution { public int[] TwoSum(int[] nums, int target) { return new int[]{0,1}; } }`,
      php: `class Solution { function twoSum($nums, $target) { return [0, 1]; } }`,
      kotlin: `class Solution { fun twoSum(nums: IntArray, target: Int): IntArray { return intArrayOf(0, 1) } }`,
      swift: `class Solution { func twoSum(_ nums: [Int], _ target: Int) -> [Int] { return [0, 1] } }`
    }
  },
  {
    id: "15",
    title: "15. 3Sum",
    official_function_name: "threeSum",
    difficulty: "Medium",
    master_category: "Arrays",
    sub_pattern: "Two Pointers",
    topic: ["Arrays", "Two Pointers", "Sorting"],
    company_tags: ["Meta", "Amazon", "Google", "Apple", "Uber"],
    pattern_tags: ["Two Pointers", "Sorting"],
    acceptance_rate: 34.5,
    time_complexity: "O(N²)",
    space_complexity: "O(1)",
    description: `### 15. 3Sum\n\nGiven an integer array nums, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.\n\nNotice that the solution set must not contain duplicate triplets.\n\n### Constraints\n- \`3 <= nums.length <= 3000\`\n- \`-10^5 <= nums[i] <= 10^5\``,
    examples: [
      { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]", explanation: "nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0. Distinct triplets are [-1,0,1] and [-1,-1,2]." },
      { input: "nums = [0,1,1]", output: "[]", explanation: "The only possible triplet does not sum up to 0." },
      { input: "nums = [0,0,0]", output: "[[0,0,0]]", explanation: "The only possible triplet sums up to 0." }
    ],
    testcases: [
      { input: "[-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]", isHidden: false },
      { input: "[0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: false },
      { input: "[-2,0,1,1,2]", expectedOutput: "[[-2,0,2],[-2,1,1]]", isHidden: true }
    ],
    starter_code: {
      javascript: `function threeSum(nums) {\n  nums.sort((a, b) => a - b);\n  const res = [];\n  for (let i = 0; i < nums.length - 2; i++) {\n    if (i > 0 && nums[i] === nums[i - 1]) continue;\n    let l = i + 1, r = nums.length - 1;\n    while (l < r) {\n      const sum = nums[i] + nums[l] + nums[r];\n      if (sum === 0) {\n        res.push([nums[i], nums[l], nums[r]]);\n        while (l < r && nums[l] === nums[l + 1]) l++;\n        while (l < r && nums[r] === nums[r - 1]) r--;\n        l++; r--;\n      } else if (sum < 0) l++;\n      else r--;\n    }\n  }\n  return res;\n}`,
      typescript: `function threeSum(nums: number[]): number[][] { return []; }`,
      python: `class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        return []\n`,
      java: `class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        return new ArrayList<>();\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        return {};\n    }\n};`,
      go: `func threeSum(nums []int) [][]int { return [][]int{} }`,
      rust: `impl Solution { pub fn three_sum(nums: Vec<i32>) -> Vec<Vec<i32>> { vec![] } }`,
      csharp: `public class Solution { public IList<IList<int>> ThreeSum(int[] nums) { return new List<IList<int>>(); } }`,
      php: `class Solution { function threeSum($nums) { return []; } }`,
      kotlin: `class Solution { fun threeSum(nums: IntArray): List<List<Int>> { return emptyList() } }`,
      swift: `class Solution { func threeSum(_ nums: [Int]) -> [[Int]] { return [] } }`
    }
  },
  {
    id: "16",
    title: "16. 3Sum Closest",
    official_function_name: "threeSumClosest",
    difficulty: "Medium",
    master_category: "Arrays",
    sub_pattern: "Two Pointers",
    topic: ["Arrays", "Two Pointers", "Sorting"],
    company_tags: ["Amazon", "Google", "Microsoft"],
    pattern_tags: ["Two Pointers", "Sorting"],
    acceptance_rate: 46.1,
    time_complexity: "O(N²)",
    space_complexity: "O(1)",
    description: `### 16. 3Sum Closest\n\nGiven an integer array \`nums\` of length \`n\` and an integer \`target\`, find three integers in \`nums\` such that the sum is closest to \`target\`.\n\nReturn *the sum of the three integers*.\n\nYou may assume that each input would have exactly one solution.\n\n### Constraints\n- \`3 <= nums.length <= 500\`\n- \`-1000 <= nums[i] <= 1000\`\n- \`-10^4 <= target <= 10^4\``,
    examples: [
      { input: "nums = [-1,2,1,-4], target = 1", output: "2", explanation: "The sum that is closest to the target is 2. (-1 + 2 + 1 = 2)." },
      { input: "nums = [0,0,0], target = 1", output: "0", explanation: "The sum that is closest to the target is 0. (0 + 0 + 0 = 0)." }
    ],
    testcases: [
      { input: "[-1,2,1,-4]\n1", expectedOutput: "2", isHidden: false },
      { input: "[0,0,0]\n1", expectedOutput: "0", isHidden: false }
    ],
    starter_code: {
      javascript: `function threeSumClosest(nums, target) { return 0; }`,
      typescript: `function threeSumClosest(nums: number[], target: number): number { return 0; }`,
      python: `class Solution:\n    def threeSumClosest(self, nums: List[int], target: int) -> int:\n        return 0\n`,
      java: `class Solution {\n    public int threeSumClosest(int[] nums, int target) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int threeSumClosest(vector<int>& nums, int target) {\n        return 0;\n    }\n};`,
      go: `func threeSumClosest(nums []int, target int) int { return 0 }`,
      rust: `impl Solution { pub fn three_sum_closest(nums: Vec<i32>, target: i32) -> i32 { 0 } }`,
      csharp: `public class Solution { public int ThreeSumClosest(int[] nums, int target) { return 0; } }`,
      php: `class Solution { function threeSumClosest($nums, $target) { return 0; } }`,
      kotlin: `class Solution { fun threeSumClosest(nums: IntArray, target: Int): Int { return 0 } }`,
      swift: `class Solution { func threeSumClosest(_ nums: [Int], _ target: Int) -> Int { return 0 } }`
    }
  },
  {
    id: "18",
    title: "18. 4Sum",
    official_function_name: "fourSum",
    difficulty: "Medium",
    master_category: "Arrays",
    sub_pattern: "Two Pointers",
    topic: ["Arrays", "Two Pointers", "Sorting"],
    company_tags: ["Amazon", "Meta", "Google"],
    pattern_tags: ["Two Pointers", "Sorting"],
    acceptance_rate: 36.8,
    time_complexity: "O(N³)",
    space_complexity: "O(1)",
    description: `### 18. 4Sum\n\nGiven an array \`nums\` of \`n\` integers, return *an array of all the unique quadruplets* \`[nums[a], nums[b], nums[c], nums[d]]\` such that:\n- \`0 <= a, b, c, d < n\`\n- \`a, b, c, d\` are all **distinct**.\n- \`nums[a] + nums[b] + nums[c] + nums[d] == target\`\n\nYou may return the answer in **any order**.\n\n### Constraints\n- \`1 <= nums.length <= 200\`\n- \`-10^9 <= nums[i] <= 10^9\`\n- \`-10^9 <= target <= 10^9\``,
    examples: [
      { input: "nums = [1,0,-1,0,-2,2], target = 0", output: "[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]" },
      { input: "nums = [2,2,2,2,2], target = 8", output: "[[2,2,2,2]]" }
    ],
    testcases: [
      { input: "[1,0,-1,0,-2,2]\n0", expectedOutput: "[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]", isHidden: false },
      { input: "[2,2,2,2,2]\n8", expectedOutput: "[[2,2,2,2]]", isHidden: false }
    ],
    starter_code: {
      javascript: `function fourSum(nums, target) { return []; }`,
      typescript: `function fourSum(nums: number[], target: number): number[][] { return []; }`,
      python: `class Solution:\n    def fourSum(self, nums: List[int], target: int) -> List[List[int]]:\n        return []\n`,
      java: `class Solution {\n    public List<List<Integer>> fourSum(int[] nums, int target) {\n        return new ArrayList<>();\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<vector<int>> fourSum(vector<int>& nums, int target) {\n        return {};\n    }\n};`,
      go: `func fourSum(nums []int, target int) [][]int { return [][]int{} }`,
      rust: `impl Solution { pub fn four_sum(nums: Vec<i32>, target: i32) -> Vec<Vec<i32>> { vec![] } }`,
      csharp: `public class Solution { public IList<IList<int>> FourSum(int[] nums, int target) { return new List<IList<int>>(); } }`,
      php: `class Solution { function fourSum($nums, $target) { return []; } }`,
      kotlin: `class Solution { fun fourSum(nums: IntArray, target: Int): List<List<Int>> { return emptyList() } }`,
      swift: `class Solution { func fourSum(_ nums: [Int], _ target: Int) -> [Int] { return [] } }`
    }
  },
  {
    id: "454",
    title: "454. 4Sum II",
    official_function_name: "fourSumCount",
    difficulty: "Medium",
    master_category: "Arrays",
    sub_pattern: "Hashing",
    topic: ["Arrays", "Hash Table"],
    company_tags: ["Amazon", "Google", "Microsoft"],
    pattern_tags: ["Hashing", "Counting"],
    acceptance_rate: 57.4,
    time_complexity: "O(N²)",
    space_complexity: "O(N²)",
    description: `### 454. 4Sum II\n\nGiven four integer arrays \`nums1\`, \`nums2\`, \`nums3\`, and \`nums4\` all of length \`n\`, return the number of tuples \`(i, j, k, l)\` such that:\n- \`0 <= i, j, k, l < n\`\n- \`nums1[i] + nums2[j] + nums3[k] + nums4[l] == 0\`\n\n### Constraints\n- \`n == nums1.length == nums2.length == nums3.length == nums4.length\`\n- \`1 <= n <= 200\`\n- \`-2^28 <= nums1[i], nums2[j], nums3[k], nums4[l] <= 2^28\``,
    examples: [
      { input: "nums1 = [1,2], nums2 = [-2,-1], nums3 = [-1,2], nums4 = [0,2]", output: "2", explanation: "The two tuples are: 1. (0, 0, 0, 1) -> nums1[0] + nums2[0] + nums3[0] + nums4[1] = 1 + (-2) + (-1) + 2 = 0\n2. (1, 1, 0, 0) -> nums1[1] + nums2[1] + nums3[0] + nums4[0] = 2 + (-1) + (-1) + 0 = 0" }
    ],
    testcases: [
      { input: "[1,2]\n[-2,-1]\n[-1,2]\n[0,2]", expectedOutput: "2", isHidden: false }
    ],
    starter_code: {
      javascript: `function fourSumCount(nums1, nums2, nums3, nums4) { return 0; }`,
      typescript: `function fourSumCount(nums1: number[], nums2: number[], nums3: number[], nums4: number[]): number { return 0; }`,
      python: `class Solution:\n    def fourSumCount(self, nums1: List[int], nums2: List[int], nums3: List[int], nums4: List[int]) -> int:\n        return 0\n`,
      java: `class Solution {\n    public int fourSumCount(int[] nums1, int[] nums2, int[] nums3, int[] nums4) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int fourSumCount(vector<int>& nums1, vector<int>& nums2, vector<int>& nums3, vector<int>& nums4) {\n        return 0;\n    }\n};`,
      go: `func fourSumCount(nums1 []int, nums2 []int, nums3 []int, nums4 []int) int { return 0 }`,
      rust: `impl Solution { pub fn four_sum_count(nums1: Vec<i32>, nums2: Vec<i32>, nums3: Vec<i32>, nums4: Vec<i32>) -> i32 { 0 } }`,
      csharp: `public class Solution { public int FourSumCount(int[] nums1, int[] nums2, int[] nums3, int[] nums4) { return 0; } }`,
      php: `class Solution { function fourSumCount($nums1, $nums2, $nums3, $nums4) { return 0; } }`,
      kotlin: `class Solution { fun fourSumCount(nums1: IntArray, nums2: IntArray, nums3: IntArray, nums4: IntArray): Int { return 0 } }`,
      swift: `class Solution { func fourSumCount(_ nums1: [Int], _ nums2: [Int], _ nums3: [Int], _ nums4: [Int]) -> Int { return 0 } }`
    }
  },
  {
    id: "238",
    title: "238. Product of Array Except Self",
    official_function_name: "productExceptSelf",
    difficulty: "Medium",
    master_category: "Arrays",
    sub_pattern: "Prefix Sum / Prefix Products",
    topic: ["Arrays", "Prefix Sum"],
    company_tags: ["Amazon", "Meta", "Google", "Apple", "Microsoft"],
    pattern_tags: ["Prefix Sum", "Prefix Products"],
    acceptance_rate: 65.4,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    description: `### 238. Product of Array Except Self\n\nGiven an integer array \`nums\`, return *an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`*.\n\nThe product of any prefix or suffix of \`nums\` is **guaranteed** to fit in a **32-bit** integer.\n\nYou must write an algorithm that runs in \`O(n)\` time and without using the division operation.\n\n### Constraints\n- \`2 <= nums.length <= 10^5\`\n- \`-30 <= nums[i] <= 30\`\n- The product of any prefix or suffix of \`nums\` is guaranteed to fit in a 32-bit integer.`,
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]" },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0]" }
    ],
    testcases: [
      { input: "[1,2,3,4]", expectedOutput: "[24,12,8,6]", isHidden: false },
      { input: "[-1,1,0,-3,3]", expectedOutput: "[0,0,9,0]", isHidden: false }
    ],
    starter_code: {
      javascript: `function productExceptSelf(nums) { return []; }`,
      typescript: `function productExceptSelf(nums: number[]): number[] { return []; }`,
      python: `class Solution:\n    def productExceptSelf(self, nums: List[int]) -> List[int]:\n        return []\n`,
      java: `class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        return {};\n    }\n};`,
      go: `func productExceptSelf(nums []int) []int { return []int{} }`,
      rust: `impl Solution { pub fn product_except_self(nums: Vec<i32>) -> Vec<i32> { vec![] } }`,
      csharp: `public class Solution { public int[] ProductExceptSelf(int[] nums) { return new int[]{}; } }`,
      php: `class Solution { function productExceptSelf($nums) { return []; } }`,
      kotlin: `class Solution { fun productExceptSelf(nums: IntArray): IntArray { return intArrayOf() } }`,
      swift: `class Solution { func productExceptSelf(_ nums: [Int]) -> [Int] { return [] } }`
    }
  },
  {
    id: "239",
    title: "239. Sliding Window Maximum",
    official_function_name: "maxSlidingWindow",
    difficulty: "Hard",
    master_category: "Arrays",
    sub_pattern: "Monotonic Queue",
    topic: ["Arrays", "Monotonic Queue", "Sliding Window"],
    company_tags: ["Amazon", "Google", "Meta"],
    pattern_tags: ["Monotonic Queue", "Sliding Window"],
    acceptance_rate: 46.5,
    time_complexity: "O(N)",
    space_complexity: "O(K)",
    description: `### 239. Sliding Window Maximum\n\nYou are given an array of integers \`nums\`, there is a sliding window of size \`k\` which is moving from the very left of the array to the very right. You can only see the \`k\` numbers in the window. Each time the sliding window moves right by one position.\n\nReturn *the max sliding window*.\n\n### Constraints\n- \`1 <= nums.length <= 10^5\`\n- \`-10^4 <= nums[i] <= 10^4\`\n- \`1 <= k <= nums.length\``,
    examples: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[3,3,5,5,6,7]" },
      { input: "nums = [1], k = 1", output: "[1]" }
    ],
    testcases: [
      { input: "[1,3,-1,-3,5,3,6,7]\n3", expectedOutput: "[3,3,5,5,6,7]", isHidden: false },
      { input: "[1]\n1", expectedOutput: "[1]", isHidden: false }
    ],
    starter_code: {
      javascript: `function maxSlidingWindow(nums, k) { return []; }`,
      typescript: `function maxSlidingWindow(nums: number[], k: number): number[] { return []; }`,
      python: `class Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        return []\n`,
      java: `class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        return {};\n    }\n};`,
      go: `func maxSlidingWindow(nums []int, k int) []int { return []int{} }`,
      rust: `impl Solution { pub fn max_sliding_window(nums: Vec<i32>, k: i32) -> Vec<i32> { vec![] } }`,
      csharp: `public class Solution { public int[] MaxSlidingWindow(int[] nums, int k) { return new int[]{}; } }`,
      php: `class Solution { function maxSlidingWindow($nums, $k) { return []; } }`,
      kotlin: `class Solution { fun maxSlidingWindow(nums: IntArray, k: Int): IntArray { return intArrayOf() } }`,
      swift: `class Solution { func maxSlidingWindow(_ nums: [Int], _ k: Int) -> [Int] { return [] } }`
    }
  },
  {
    id: "84",
    title: "84. Largest Rectangle in Histogram",
    official_function_name: "largestRectangleArea",
    difficulty: "Hard",
    master_category: "Arrays",
    sub_pattern: "Monotonic Stack",
    topic: ["Arrays", "Stack", "Monotonic Stack"],
    company_tags: ["Amazon", "Google", "Meta"],
    pattern_tags: ["Monotonic Stack"],
    acceptance_rate: 43.2,
    time_complexity: "O(N)",
    space_complexity: "O(N)",
    description: `### 84. Largest Rectangle in Histogram\n\nGiven an array of integers \`heights\` representing the histogram's bar height where the width of each bar is 1, return *the area of the largest rectangle in the histogram*.\n\n### Constraints\n- \`1 <= heights.length <= 10^5\`\n- \`0 <= heights[i] <= 10^4\``,
    examples: [
      { input: "heights = [2,1,5,6,2,3]", output: "10", explanation: "The largest rectangle has an area = 10 units." },
      { input: "heights = [2,4]", output: "4" }
    ],
    testcases: [
      { input: "[2,1,5,6,2,3]", expectedOutput: "10", isHidden: false },
      { input: "[2,4]", expectedOutput: "4", isHidden: false }
    ],
    starter_code: {
      javascript: `function largestRectangleArea(heights) { return 0; }`,
      typescript: `function largestRectangleArea(heights: number[]): number { return 0; }`,
      python: `class Solution:\n    def largestRectangleArea(self, heights: List[int]) -> int:\n        return 0\n`,
      java: `class Solution {\n    public int largestRectangleArea(int[] heights) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int largestRectangleArea(vector<int>& heights) {\n        return 0;\n    }\n};`,
      go: `func largestRectangleArea(heights []int) int { return 0 }`,
      rust: `impl Solution { pub fn largest_rectangle_area(heights: Vec<i32>) -> i32 { 0 } }`,
      csharp: `public class Solution { public int LargestRectangleArea(int[] heights) { return 0; } }`,
      php: `class Solution { function largestRectangleArea($heights) { return 0; } }`,
      kotlin: `class Solution { fun largestRectangleArea(heights: IntArray): Int { return 0 } }`,
      swift: `class Solution { func largestRectangleArea(_ heights: [Int]) -> Int { return 0 } }`
    }
  },
  {
    id: "322",
    title: "322. Coin Change",
    official_function_name: "coinChange",
    difficulty: "Medium",
    master_category: "Dynamic Programming",
    sub_pattern: "Dynamic Programming",
    topic: ["Dynamic Programming", "Memoization"],
    company_tags: ["Amazon", "Google", "Meta", "Microsoft"],
    pattern_tags: ["Dynamic Programming", "1D DP"],
    acceptance_rate: 42.8,
    time_complexity: "O(N * Amount)",
    space_complexity: "O(Amount)",
    description: `### 322. Coin Change\n\nYou are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.\n\nReturn *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.\n\nYou may assume that you have an infinite number of each kind of coin.\n\n### Constraints\n- \`1 <= coins.length <= 12\`\n- \`1 <= coins[i] <= 2^31 - 1\`\n- \`0 <= amount <= 10^4\``,
    examples: [
      { input: "coins = [1,2,5], amount = 11", output: "3", explanation: "11 = 5 + 5 + 1" },
      { input: "coins = [2], amount = 3", output: "-1" },
      { input: "coins = [1], amount = 0", output: "0" }
    ],
    testcases: [
      { input: "[1,2,5]\n11", expectedOutput: "3", isHidden: false },
      { input: "[2]\n3", expectedOutput: "-1", isHidden: false },
      { input: "[1]\n0", expectedOutput: "0", isHidden: true }
    ],
    starter_code: {
      javascript: `function coinChange(coins, amount) { return 0; }`,
      typescript: `function coinChange(coins: number[], amount: number): number { return 0; }`,
      python: `class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        return 0\n`,
      java: `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        return 0;\n    }\n};`,
      go: `func coinChange(coins []int, amount int) int { return 0 }`,
      rust: `impl Solution { pub fn coin_change(coins: Vec<i32>, amount: i32) -> i32 { 0 } }`,
      csharp: `public class Solution { public int CoinChange(int[] coins, int amount) { return 0; } }`,
      php: `class Solution { function coinChange($coins, $amount) { return 0; } }`,
      kotlin: `class Solution { fun coinChange(coins: IntArray, amount: Int): Int { return 0 } }`,
      swift: `class Solution { func coinChange(_ coins: [Int], _ amount: Int) -> Int { return 0 } }`
    }
  },
  {
    id: "133",
    title: "133. Clone Graph",
    official_function_name: "cloneGraph",
    difficulty: "Medium",
    master_category: "Graph",
    sub_pattern: "BFS / DFS",
    topic: ["Graph", "BFS", "DFS"],
    company_tags: ["Amazon", "Meta", "Google"],
    pattern_tags: ["BFS", "DFS"],
    acceptance_rate: 54.2,
    time_complexity: "O(V + E)",
    space_complexity: "O(V)",
    description: `### 133. Clone Graph\n\nGiven a reference of a node in a **connected** undirected graph.\n\nReturn a **deep copy** (clone) of the graph.\n\nEach node in the graph contains a value (\`int\`) and a list (\`List[Node]\`) of its neighbors.\n\n### Constraints\n- The number of nodes in the graph is in the range \`[0, 100]\`.\n- \`1 <= Node.val <= 100\`\n- \`Node.val\` is unique for each node.`,
    examples: [
      { input: "adjList = [[2,4],[1,3],[2,4],[1,3]]", output: "[[2,4],[1,3],[2,4],[1,3]]" }
    ],
    testcases: [
      { input: "[[2,4],[1,3],[2,4],[1,3]]", expectedOutput: "[[2,4],[1,3],[2,4],[1,3]]", isHidden: false }
    ],
    starter_code: {
      javascript: `function cloneGraph(node) { return node; }`,
      typescript: `function cloneGraph(node: Node | null): Node | null { return node; }`,
      python: `class Solution:\n    def cloneGraph(self, node: 'Node') -> 'Node':\n        return node\n`,
      java: `class Solution {\n    public Node cloneGraph(Node node) {\n        return node;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    Node* cloneGraph(Node* node) {\n        return node;\n    }\n};`,
      go: `func cloneGraph(node *Node) *Node { return node }`,
      rust: `impl Solution { pub fn clone_graph(node: Option<Rc<RefCell<Node>>>) -> Option<Rc<RefCell<Node>>> { node } }`,
      csharp: `public class Solution { public Node CloneGraph(Node node) { return node; } }`,
      php: `class Solution { function cloneGraph($node) { return $node; } }`,
      kotlin: `class Solution { fun cloneGraph(node: Node?): Node? { return node } }`,
      swift: `class Solution { func cloneGraph(_ node: Node?) -> Node? { return node } }`
    }
  },
  {
    id: "127",
    title: "127. Word Ladder",
    official_function_name: "ladderLength",
    difficulty: "Hard",
    master_category: "Graph",
    sub_pattern: "BFS",
    topic: ["Graph", "BFS", "String"],
    company_tags: ["Amazon", "Google", "Microsoft"],
    pattern_tags: ["BFS"],
    acceptance_rate: 38.2,
    time_complexity: "O(M² * N)",
    space_complexity: "O(M * N)",
    description: `### 127. Word Ladder\n\nA **transformation sequence** from word \`beginWord\` to word \`endWord\` using a dictionary \`wordList\` is a sequence of words \`beginWord -> s1 -> s2 -> ... -> sk\` such that:\n- Every adjacent pair of words differs by a single letter.\n- Every \`si\` for \`1 <= i <= k\` is in \`wordList\`. Note that \`beginWord\` does not need to be in \`wordList\`.\n- \`sk == endWord\`\n\nGiven two words, \`beginWord\` and \`endWord\`, and a dictionary \`wordList\`, return *the **number of words** in the **shortest transformation sequence** from \`beginWord\` to \`endWord\`, or \`0\` if no such sequence exists*.\n\n### Constraints\n- \`1 <= beginWord.length <= 10\`\n- \`endWord.length == beginWord.length\`\n- \`1 <= wordList.length <= 5000\`\n- \`wordList[i].length == beginWord.length\``,
    examples: [
      { input: "beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]", output: "5", explanation: "One shortest transformation sequence is \"hit\" -> \"hot\" -> \"dot\" -> \"dog\" -> \"cog\", which is 5 words long." }
    ],
    testcases: [
      { input: "\"hit\"\n\"cog\"\n[\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]", expectedOutput: "5", isHidden: false }
    ],
    starter_code: {
      javascript: `function ladderLength(beginWord, endWord, wordList) { return 0; }`,
      typescript: `function ladderLength(beginWord: string, endWord: string, wordList: string[]): number { return 0; }`,
      python: `class Solution:\n    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:\n        return 0\n`,
      java: `class Solution {\n    public int ladderLength(String beginWord, String endWord, List<String> wordList) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {\n        return 0;\n    }\n};`,
      go: `func ladderLength(beginWord string, endWord string, wordList []string) int { return 0 }`,
      rust: `impl Solution { pub fn ladder_length(begin_word: String, end_word: String, word_list: Vec<String>) -> i32 { 0 } }`,
      csharp: `public class Solution { public int LadderLength(string beginWord, string endWord, IList<string> wordList) { return 0; } }`,
      php: `class Solution { function ladderLength($beginWord, $endWord, $wordList) { return 0; } }`,
      kotlin: `class Solution { fun ladderLength(beginWord: String, endWord: String, wordList: List<String>): Int { return 0 } }`,
      swift: `class Solution { func ladderLength(_ beginWord: String, _ endWord: String, _ wordList: [String]) -> Int { return 0 } }`
    }
  }
];
