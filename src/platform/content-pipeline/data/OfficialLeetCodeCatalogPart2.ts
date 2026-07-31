import { CanonicalLeetCodeProblem, LeetCodeTestCase } from "./OfficialLeetCodeCatalog";

function generate23TestCases(
  visible1: { input: string; output: string },
  visible2: { input: string; output: string },
  hiddenCases: Array<{ input: string; output: string; category: LeetCodeTestCase['category'] }>
): LeetCodeTestCase[] {
  const result: LeetCodeTestCase[] = [
    { input: visible1.input, expectedOutput: visible1.output, isHidden: false, category: 'normal' },
    { input: visible2.input, expectedOutput: visible2.output, isHidden: false, category: 'normal' }
  ];

  for (const hc of hiddenCases) {
    result.push({ input: hc.input, expectedOutput: hc.output, isHidden: true, category: hc.category });
  }

  return result;
}

export const OFFICIAL_LEETCODE_CATALOG_PART2: CanonicalLeetCodeProblem[] = [
  {
    id: "best-time-to-buy-and-sell-stock",
    title: "121. Best Time to Buy and Sell Stock",
    official_function_name: "maxProfit",
    difficulty: "Easy",
    master_category: "1. Arrays & Strings",
    sub_pattern: "One-Pass Greedy",
    topic: ["arrays", "dynamic-programming"],
    company_tags: ["amazon", "meta", "google", "microsoft", "apple"],
    pattern_tags: ["arrays", "greedy"],
    acceptance_rate: 54,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    description: `### Best Time to Buy and Sell Stock

You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i-th\` day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.

### Input Format
- An integer array \`prices\`.

### Output Format
- An integer representing the maximum profit achievable.

### Constraints
- \`1 <= prices.length <= 10^5\`
- \`0 <= prices[i] <= 10^4\`

### Notes
- Keep track of the minimum buy price seen so far and check profit at each day in O(1) time.`,
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5." },
      { input: "prices = [7,6,4,3,1]", output: "0", explanation: "In this case, no transaction is done, i.e. max profit = 0." }
    ],
    testcases: generate23TestCases(
      { input: "[7, 1, 5, 3, 6, 4]", output: "5" },
      { input: "[7, 6, 4, 3, 1]", output: "0" },
      [
        { input: "[1]", output: "0", category: "boundary" },
        { input: "[1, 2]", output: "1", category: "boundary" },
        { input: "[2, 4, 1]", output: "2", category: "normal" },
        { input: "[3, 2, 6, 5, 0, 3]", output: "4", category: "normal" },
        { input: "[1, 1, 1, 1, 1]", output: "0", category: "duplicates" },
        { input: "[2, 1, 2, 0, 1]", output: "1", category: "boundary" },
        { input: "[5, 10, 15, 20, 25]", output: "20", category: "normal" },
        { input: "[10, 8, 6, 4, 2, 0]", output: "0", category: "normal" },
        { input: "[0, 0, 0, 0]", output: "0", category: "duplicates" },
        { input: "[3, 8, 2, 5, 1, 7]", output: "6", category: "normal" },
        { input: "[100, 1, 1000]", output: "999", category: "large_input" },
        { input: "[1, 5, 2, 10, 3, 15]", output: "14", category: "normal" },
        { input: "[4, 7, 2, 1, 11]", output: "10", category: "normal" },
        { input: "[1, 10, 1, 10, 1, 10]", output: "9", category: "duplicates" },
        { input: "[5, 4, 3, 2, 1, 100]", output: "99", category: "corner" },
        { input: "[100, 99, 98, 97, 1000]", output: "903", category: "large_input" },
        { input: "[0, 10000]", output: "10000", category: "boundary" },
        { input: "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]", output: "9", category: "normal" },
        { input: "[7, 2, 5, 1, 3, 6]", output: "5", category: "normal" },
        { input: "[3, 3, 5, 0, 0, 3, 1, 4]", output: "4", category: "stress" },
        { input: "[2, 7, 1, 4, 11]", output: "10", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {number[]} prices\n * @return {number}\n */\nfunction maxProfit(prices) {\n  let minPrice = Infinity;\n  let maxProf = 0;\n  for (const price of prices) {\n    if (price < minPrice) minPrice = price;\n    else if (price - minPrice > maxProf) maxProf = price - minPrice;\n  }\n  return maxProf;\n}`,
      typescript: `function maxProfit(prices: number[]): number {\n  let minPrice = Infinity;\n  let maxProf = 0;\n  for (const price of prices) {\n    if (price < minPrice) minPrice = price;\n    else if (price - minPrice > maxProf) maxProf = price - minPrice;\n  }\n  return maxProf;\n}`,
      python: `class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        min_price = float('inf')\n        max_prof = 0\n        for price in prices:\n            if price < min_price:\n                min_price = price\n            elif price - min_price > max_prof:\n                max_prof = price - min_price\n        return max_prof`,
      java: `class Solution {\n    public int maxProfit(int[] prices) {\n        int minPrice = Integer.MAX_VALUE;\n        int maxProf = 0;\n        for (int price : prices) {\n            if (price < minPrice) minPrice = price;\n            else if (price - minPrice > maxProf) maxProf = price - minPrice;\n        }\n        return maxProf;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        int minPrice = INT_MAX;\n        int maxProf = 0;\n        for (int price : prices) {\n            if (price < minPrice) minPrice = price;\n            else if (price - minPrice > maxProf) maxProf = price - minPrice;\n        }\n        return maxProf;\n    }\n};`,
      go: `func maxProfit(prices []int) int {\n    minPrice := 1000000000\n    maxProf := 0\n    for _, price := range prices {\n        if price < minPrice {\n            minPrice = price\n        } else if price - minPrice > maxProf {\n            maxProf = price - minPrice\n        }\n    }\n    return maxProf\n}`,
      rust: `impl Solution {\n    pub fn max_profit(prices: Vec<i32>) -> i32 {\n        let mut min_price = i32::MAX;\n        let mut max_prof = 0;\n        for &price in &prices {\n            if price < min_price {\n                min_price = price;\n            } else if price - min_price > max_prof {\n                max_prof = price - min_price;\n            }\n        }\n        max_prof\n    }\n}`,
      csharp: `public class Solution {\n    public int MaxProfit(int[] prices) {\n        int minPrice = int.MaxValue;\n        int maxProf = 0;\n        foreach (int price in prices) {\n            if (price < minPrice) minPrice = price;\n            else if (price - minPrice > maxProf) maxProf = price - minPrice;\n        }\n        return maxProf;\n    }\n}`,
      php: `class Solution {\n    function maxProfit($prices) {\n        $minPrice = PHP_INT_MAX;\n        $maxProf = 0;\n        foreach ($prices as $price) {\n            if ($price < $minPrice) $minPrice = $price;\n            elseif ($price - $minPrice > $maxProf) $maxProf = $price - $minPrice;\n        }\n        return $maxProf;\n    }\n}`,
      kotlin: `class Solution {\n    fun maxProfit(prices: IntArray): Int {\n        var minPrice = Int.MAX_VALUE\n        var maxProf = 0\n        for (price in prices) {\n            if (price < minPrice) minPrice = price\n            else if (price - minPrice > maxProf) maxProf = price - minPrice\n        }\n        return maxProf\n    }\n}`,
      swift: `class Solution {\n    func maxProfit(_ prices: [Int]) -> Int {\n        var minPrice = Int.max\n        var maxProf = 0\n        for price in prices {\n            if price < minPrice {\n                minPrice = price\n            } else if price - minPrice > maxProf {\n                maxProf = price - minPrice\n            }\n        }\n        return maxProf\n    }\n}`
    }
  },
  {
    id: "maximum-subarray",
    title: "53. Maximum Subarray",
    official_function_name: "maxSubArray",
    difficulty: "Medium",
    master_category: "1. Arrays & Strings",
    sub_pattern: "Kadane's Algorithm",
    topic: ["arrays", "dynamic-programming", "divide-and-conquer"],
    company_tags: ["amazon", "meta", "google", "microsoft", "apple"],
    pattern_tags: ["arrays", "kadane"],
    acceptance_rate: 50,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    description: `### Maximum Subarray

Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

### Input Format
- An integer array \`nums\`.

### Output Format
- An integer representing the maximum subarray sum.

### Constraints
- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\`

### Notes
- Use Kadane's Algorithm: \`currSum = max(num, currSum + num)\`, track global \`maxSum\`.`,
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
      { input: "nums = [1]", output: "1" }
    ],
    testcases: generate23TestCases(
      { input: "[-2, 1, -3, 4, -1, 2, 1, -5, 4]", output: "6" },
      { input: "[1]", output: "1" },
      [
        { input: "[5, 4, -1, 7, 8]", output: "23", category: "normal" },
        { input: "[-1]", output: "-1", category: "negative" },
        { input: "[-10, -2, -3, -4]", output: "-2", category: "negative" },
        { input: "[1, 2, 3, 4, 5]", output: "15", category: "normal" },
        { input: "[-2, -1]", output: "-1", category: "boundary" },
        { input: "[0, 0, 0, 0]", output: "0", category: "duplicates" },
        { input: "[-100, 100, -50, 100]", output: "150", category: "normal" },
        { input: "[2, -1, 2, 3, -9]", output: "6", category: "normal" },
        { input: "[8, -19, 5, -4, 20]", output: "21", category: "normal" },
        { input: "[10000]", output: "10000", category: "large_input" },
        { input: "[-10000, -9999, -9998]", output: "-9998", category: "negative" },
        { input: "[3, -2, 5, -1]", output: "6", category: "normal" },
        { input: "[1, -1, 1, -1, 1, -1, 1]", output: "1", category: "stress" },
        { input: "[10, -5, 20, -15, 30]", output: "40", category: "normal" },
        { input: "[-2, 2, -3, 4, -1, 2, 1, -5, 3]", output: "6", category: "normal" },
        { input: "[2, 2, -1, 4]", output: "7", category: "normal" },
        { input: "[5, -6, 2, 4, -1, 5]", output: "10", category: "normal" },
        { input: "[100, -200, 300, -400, 500]", output: "500", category: "large_input" },
        { input: "[-5, 8, -5, 1, 1, -3, 5, 5, -3, -3, 6, 4, -7, -4,-8, 0, -1, -6]", output: "16", category: "stress" },
        { input: "[1, 2, -1, -2, 2, 1, -2, 1, 4, -5, 4]", output: "6", category: "random" },
        { input: "[-3, 1, 2, -1, 2]", output: "4", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction maxSubArray(nums) {\n  let currSum = nums[0];\n  let maxSum = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    currSum = Math.max(nums[i], currSum + nums[i]);\n    maxSum = Math.max(maxSum, currSum);\n  }\n  return maxSum;\n}`,
      typescript: `function maxSubArray(nums: number[]): number {\n  let currSum = nums[0];\n  let maxSum = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    currSum = Math.max(nums[i], currSum + nums[i]);\n    maxSum = Math.max(maxSum, currSum);\n  }\n  return maxSum;\n}`,
      python: `class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        curr_sum = max_sum = nums[0]\n        for num in nums[1:]:\n            curr_sum = max(num, curr_sum + num)\n            max_sum = max(max_sum, curr_sum)\n        return max_sum`,
      java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        int currSum = nums[0];\n        int maxSum = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            currSum = Math.max(nums[i], currSum + nums[i]);\n            maxSum = Math.max(maxSum, currSum);\n        }\n        return maxSum;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        int currSum = nums[0];\n        int maxSum = nums[0];\n        for (int i = 1; i < nums.size(); i++) {\n            currSum = max(nums[i], currSum + nums[i]);\n            maxSum = max(maxSum, currSum);\n        }\n        return maxSum;\n    }\n};`,
      go: `func maxSubArray(nums []int) int {\n    currSum := nums[0]\n    maxSum := nums[0]\n    for i := 1; i < len(nums); i++ {\n        if currSum + nums[i] > nums[i] {\n            currSum += nums[i]\n        } else {\n            currSum = nums[i]\n        }\n        if currSum > maxSum {\n            maxSum = currSum\n        }\n    }\n    return maxSum\n}`,
      rust: `impl Solution {\n    pub fn max_sub_array(nums: Vec<i32>) -> i32 {\n        let mut curr_sum = nums[0];\n        let mut max_sum = nums[0];\n        for &num in &nums[1..] {\n            curr_sum = num.max(curr_sum + num);\n            max_sum = max_sum.max(curr_sum);\n        }\n        max_sum\n    }\n}`,
      csharp: `public class Solution {\n    public int MaxSubArray(int[] nums) {\n        int currSum = nums[0];\n        int maxSum = nums[0];\n        for (int i = 1; i < nums.Length; i++) {\n            currSum = Math.Max(nums[i], currSum + nums[i]);\n            maxSum = Math.Max(maxSum, currSum);\n        }\n        return maxSum;\n    }\n}`,
      php: `class Solution {\n    function maxSubArray($nums) {\n        $currSum = $nums[0];\n        $maxSum = $nums[0];\n        $len = count($nums);\n        for ($i = 1; $i < $len; $i++) {\n            $currSum = max($nums[$i], $currSum + $nums[$i]);\n            $maxSum = max($maxSum, $currSum);\n        }\n        return $maxSum;\n    }\n}`,
      kotlin: `class Solution {\n    fun maxSubArray(nums: IntArray): Int {\n        var currSum = nums[0]\n        var maxSum = nums[0]\n        for (i in 1 until nums.size) {\n            currSum = Math.max(nums[i], currSum + nums[i])\n            maxSum = Math.max(maxSum, currSum)\n        }\n        return maxSum\n    }\n}`,
      swift: `class Solution {\n    func maxSubArray(_ nums: [Int]) -> Int {\n        var currSum = nums[0]\n        var maxSum = nums[0]\n        for i in 1..<nums.count {\n            currSum = max(nums[i], currSum + nums[i])\n            maxSum = max(maxSum, currSum)\n        }\n        return maxSum\n    }\n}`
    }
  },
  {
    id: "climbing-stairs",
    title: "70. Climbing Stairs",
    official_function_name: "climbStairs",
    difficulty: "Easy",
    master_category: "18. Dynamic Programming",
    sub_pattern: "Fibonacci Sequence",
    topic: ["dynamic-programming", "math", "memoization"],
    company_tags: ["amazon", "google", "meta", "microsoft", "apple"],
    pattern_tags: ["dp", "fibonacci"],
    acceptance_rate: 52,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    description: `### Climbing Stairs

You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?

### Input Format
- An integer \`n\`.

### Output Format
- An integer representing distinct ways to reach the top.

### Constraints
- \`1 <= n <= 45\`

### Notes
- Fibonacci sequence DP: \`ways(n) = ways(n-1) + ways(n-2)\`. Can be optimized to O(1) space.`,
    examples: [
      { input: "n = 2", output: "2", explanation: "1. 1 step + 1 step, 2. 2 steps" },
      { input: "n = 3", output: "3", explanation: "1. 1+1+1, 2. 1+2, 3. 2+1" }
    ],
    testcases: generate23TestCases(
      { input: "2", output: "2" },
      { input: "3", output: "3" },
      [
        { input: "1", output: "1", category: "boundary" },
        { input: "4", output: "5", category: "normal" },
        { input: "5", output: "8", category: "normal" },
        { input: "6", output: "13", category: "normal" },
        { input: "7", output: "21", category: "normal" },
        { input: "8", output: "34", category: "normal" },
        { input: "9", output: "55", category: "normal" },
        { input: "10", output: "89", category: "normal" },
        { input: "15", output: "987", category: "normal" },
        { input: "20", output: "10946", category: "normal" },
        { input: "25", output: "121393", category: "normal" },
        { input: "30", output: "1346269", category: "large_input" },
        { input: "35", output: "14930352", category: "large_input" },
        { input: "40", output: "165580141", category: "large_input" },
        { input: "42", output: "433494437", category: "stress" },
        { input: "44", output: "1134903170", category: "overflow" },
        { input: "45", output: "1836311903", category: "boundary" },
        { input: "11", output: "144", category: "normal" },
        { input: "12", output: "233", category: "normal" },
        { input: "18", output: "4181", category: "normal" },
        { input: "22", output: "28657", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {number} n\n * @return {number}\n */\nfunction climbStairs(n) {\n  if (n <= 2) return n;\n  let a = 1, b = 2;\n  for (let i = 3; i <= n; i++) {\n    const temp = a + b;\n    a = b;\n    b = temp;\n  }\n  return b;\n}`,
      typescript: `function climbStairs(n: number): number {\n  if (n <= 2) return n;\n  let a = 1, b = 2;\n  for (let i = 3; i <= n; i++) {\n    const temp = a + b;\n    a = b;\n    b = temp;\n  }\n  return b;\n}`,
      python: `class Solution:\n    def climbStairs(self, n: int) -> int:\n        if n <= 2:\n            return n\n        a, b = 1, 2\n        for _ in range(3, n + 1):\n            a, b = b, a + b\n        return b`,
      java: `class Solution {\n    public int climbStairs(int n) {\n        if (n <= 2) return n;\n        int a = 1, b = 2;\n        for (int i = 3; i <= n; i++) {\n            int temp = a + b;\n            a = b;\n            b = temp;\n        }\n        return b;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int climbStairs(int n) {\n        if (n <= 2) return n;\n        int a = 1, b = 2;\n        for (int i = 3; i <= n; i++) {\n            int temp = a + b;\n            a = b;\n            b = temp;\n        }\n        return b;\n    }\n};`,
      go: `func climbStairs(n int) int {\n    if n <= 2 { return n }\n    a, b := 1, 2\n    for i := 3; i <= n; i++ {\n        a, b = b, a + b\n    }\n    return b\n}`,
      rust: `impl Solution {\n    pub fn climb_stairs(n: i32) -> i32 {\n        if n <= 2 { return n; }\n        let (mut a, mut b) = (1, 2);\n        for _ in 3..=n {\n            let temp = a + b;\n            a = b;\n            b = temp;\n        }\n        b\n    }\n}`,
      csharp: `public class Solution {\n    public int ClimbStairs(int n) {\n        if (n <= 2) return n;\n        int a = 1, b = 2;\n        for (int i = 3; i <= n; i++) {\n            int temp = a + b;\n            a = b;\n            b = temp;\n        }\n        return b;\n    }\n}`,
      php: `class Solution {\n    function climbStairs($n) {\n        if ($n <= 2) return $n;\n        $a = 1;\n        $b = 2;\n        for ($i = 3; $i <= $n; $i++) {\n            $temp = $a + $b;\n            $a = $b;\n            $b = $temp;\n        }\n        return $b;\n    }\n}`,
      kotlin: `class Solution {\n    fun climbStairs(n: Int): Int {\n        if (n <= 2) return n\n        var a = 1\n        var b = 2\n        for (i in 3..n) {\n            val temp = a + b\n            a = b\n            b = temp\n        }\n        return b\n    }\n}`,
      swift: `class Solution {\n    func climbStairs(_ n: Int) -> Int {\n        if n <= 2 { return n }\n        var a = 1\n        var b = 2\n        for _ in 3...n {\n            let temp = a + b\n            a = b\n            b = temp\n        }\n        return b\n    }\n}`
    }
  }
];
