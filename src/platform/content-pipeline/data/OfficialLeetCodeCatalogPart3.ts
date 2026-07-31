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

export const OFFICIAL_LEETCODE_CATALOG_PART3: CanonicalLeetCodeProblem[] = [
  {
    id: "product-of-array-except-self",
    title: "238. Product of Array Except Self",
    official_function_name: "productExceptSelf",
    difficulty: "Medium",
    master_category: "1. Arrays & Strings",
    sub_pattern: "Prefix and Suffix Products",
    topic: ["arrays", "prefix-sum"],
    company_tags: ["amazon", "meta", "google", "microsoft", "apple"],
    pattern_tags: ["arrays", "prefix-sum"],
    acceptance_rate: 65,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    description: `### Product of Array Except Self

Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is **guaranteed** to fit in a 32-bit integer.

You must write an algorithm that runs in **O(n)** time and without using the division operation.

### Input Format
- An integer array \`nums\`.

### Output Format
- An integer array representing prefix and suffix products.

### Constraints
- \`2 <= nums.length <= 10^5\`
- \`-30 <= nums[i] <= 30\`

### Notes
- Compute left running products first in result array, then multiply by right running product in a single reverse pass.`,
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]" },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]" }
    ],
    testcases: generate23TestCases(
      { input: "[1, 2, 3, 4]", output: "[24, 12, 8, 6]" },
      { input: "[-1, 1, 0, -3, 3]", output: "[0, 0, 9, 0, 0]" },
      [
        { input: "[1, 0]", output: "[0, 1]", category: "boundary" },
        { input: "[0, 0]", output: "[0, 0]", category: "boundary" },
        { input: "[2, 3]", output: "[3, 2]", category: "normal" },
        { input: "[1, 1, 1, 1, 1]", output: "[1, 1, 1, 1, 1]", category: "duplicates" },
        { input: "[-1, -1, -1, -1]", output: "[-1, -1, -1, -1]", category: "negative" },
        { input: "[1, 2, 3, 4, 5]", output: "[120, 60, 40, 30, 24]", category: "normal" },
        { input: "[-2, 3, -4, 5]", output: "[-60, 40, -30, 24]", category: "negative" },
        { input: "[10, 10, 10]", output: "[100, 100, 100]", category: "duplicates" },
        { input: "[0, 1, 2, 3, 4]", output: "[24, 0, 0, 0, 0]", category: "boundary" },
        { input: "[0, 0, 1, 2]", output: "[0, 0, 0, 0]", category: "boundary" },
        { input: "[5, 4, 3, 2, 1]", output: "[24, 30, 40, 60, 120]", category: "normal" },
        { input: "[-10, -5, 2, 4]", output: "[-40, -80, 200, 100]", category: "negative" },
        { input: "[30, 30, 30]", output: "[900, 900, 900]", category: "large_input" },
        { input: "[2, 2, 2, 2, 2, 2]", output: "[32, 32, 32, 32, 32, 32]", category: "duplicates" },
        { input: "[1, 2, 0, 4, 5]", output: "[0, 0, 40, 0, 0]", category: "boundary" },
        { input: "[1, -2, 3, -4, 5, -6]", output: "[-720, 360, -240, 180, -144, 120]", category: "stress" },
        { input: "[2, 4, 6, 8, 10]", output: "[1920, 960, 640, 480, 384]", category: "normal" },
        { input: "[10, -10, 10, -10]", output: "[1000, -1000, 1000, -1000]", category: "negative" },
        { input: "[3, 6, 9]", output: "[54, 27, 18]", category: "normal" },
        { input: "[7, 8, 9, 10]", output: "[720, 630, 560, 504]", category: "normal" },
        { input: "[-2, -3, -4, -5]", output: "[-60, -40, -30, -24]", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {number[]} nums\n * @return {number[]}\n */\nfunction productExceptSelf(nums) {\n  const n = nums.length;\n  const res = new Array(n).fill(1);\n  let left = 1;\n  for (let i = 0; i < n; i++) {\n    res[i] = left;\n    left *= nums[i];\n  }\n  let right = 1;\n  for (let i = n - 1; i >= 0; i--) {\n    res[i] *= right;\n    right *= nums[i];\n  }\n  return res;\n}`,
      typescript: `function productExceptSelf(nums: number[]): number[] {\n  const n = nums.length;\n  const res: number[] = new Array(n).fill(1);\n  let left = 1;\n  for (let i = 0; i < n; i++) {\n    res[i] = left;\n    left *= nums[i];\n  }\n  let right = 1;\n  for (let i = n - 1; i >= 0; i--) {\n    res[i] *= right;\n    right *= nums[i];\n  }\n  return res;\n}`,
      python: `class Solution:\n    def productExceptSelf(self, nums: List[int]) -> List[int]:\n        n = len(nums)\n        res = [1] * n\n        left = 1\n        for i in range(n):\n            res[i] = left\n            left *= nums[i]\n        right = 1\n        for i in range(n - 1, -1, -1):\n            res[i] *= right\n            right *= nums[i]\n        return res`,
      java: `class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        int n = nums.length;\n        int[] res = new int[n];\n        res[0] = 1;\n        for (int i = 1; i < n; i++) {\n            res[i] = res[i - 1] * nums[i - 1];\n        }\n        int right = 1;\n        for (int i = n - 1; i >= 0; i--) {\n            res[i] *= right;\n            right *= nums[i];\n        }\n        return res;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        int n = nums.size();\n        vector<int> res(n, 1);\n        int left = 1;\n        for (int i = 0; i < n; i++) {\n            res[i] = left;\n            left *= nums[i];\n        }\n        int right = 1;\n        for (int i = n - 1; i >= 0; i--) {\n            res[i] *= right;\n            right *= nums[i];\n        }\n        return res;\n    }\n};`,
      go: `func productExceptSelf(nums []int) []int {\n    n := len(nums)\n    res := make([]int, n)\n    res[0] = 1\n    for i := 1; i < n; i++ {\n        res[i] = res[i-1] * nums[i-1]\n    }\n    right := 1\n    for i := n - 1; i >= 0; i-- {\n        res[i] *= right\n        right *= nums[i]\n    }\n    return res\n}`,
      rust: `impl Solution {\n    pub fn product_except_self(nums: Vec<i32>) -> Vec<i32> {\n        let n = nums.len();\n        let mut res = vec![1; n];\n        let mut left = 1;\n        for i in 0..n {\n            res[i] = left;\n            left *= nums[i];\n        }\n        let mut right = 1;\n        for i in (0..n).rev() {\n            res[i] *= right;\n            right *= nums[i];\n        }\n        res\n    }\n}`,
      csharp: `public class Solution {\n    public int[] ProductExceptSelf(int[] nums) {\n        int n = nums.Length;\n        int[] res = new int[n];\n        res[0] = 1;\n        for (int i = 1; i < n; i++) {\n            res[i] = res[i - 1] * nums[i - 1];\n        }\n        int right = 1;\n        for (int i = n - 1; i >= 0; i--) {\n            res[i] *= right;\n            right *= nums[i];\n        }\n        return res;\n    }\n}`,
      php: `class Solution {\n    function productExceptSelf($nums) {\n        $n = count($nums);\n        $res = array_fill(0, $n, 1);\n        $left = 1;\n        for ($i = 0; $i < $n; $i++) {\n            $res[$i] = $left;\n            $left *= $nums[$i];\n        }\n        $right = 1;\n        for ($i = $n - 1; $i >= 0; $i--) {\n            $res[$i] *= $right;\n            $right *= $nums[$i];\n        }\n        return $res;\n    }\n}`,
      kotlin: `class Solution {\n    fun productExceptSelf(nums: IntArray): IntArray {\n        val n = nums.size\n        val res = IntArray(n)\n        res[0] = 1\n        for (i in 1 until n) {\n            res[i] = res[i - 1] * nums[i - 1]\n        }\n        var right = 1\n        for (i in n - 1 downTo 0) {\n            res[i] *= right\n            right *= nums[i]\n        }\n        return res\n    }\n}`,
      swift: `class Solution {\n    func productExceptSelf(_ nums: [Int]) -> [Int] {\n        let n = nums.count\n        var res = Array(repeating: 1, count: n)\n        var left = 1\n        for i in 0..<n {\n            res[i] = left\n            left *= nums[i]\n        }\n        var right = 1\n        for i in (0..<n).reversed() {\n            res[i] *= right\n            right *= nums[i]\n        }\n        return res\n    }\n}`
    }
  },
  {
    id: "valid-palindrome",
    title: "125. Valid Palindrome",
    official_function_name: "isPalindrome",
    difficulty: "Easy",
    master_category: "2. Two Pointer Patterns",
    sub_pattern: "Opposite Direction",
    topic: ["two-pointers", "strings"],
    company_tags: ["meta", "amazon", "microsoft", "google"],
    pattern_tags: ["two-pointers", "strings"],
    acceptance_rate: 45,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    description: `### Valid Palindrome

A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.

### Input Format
- A string \`s\`.

### Output Format
- A boolean \`true\` or \`false\`.

### Constraints
- \`1 <= s.length <= 2 * 10^5\`
- \`s\` consists only of printable ASCII characters.

### Notes
- Two pointers: skip non-alphanumeric characters and compare lowercase equivalents.`,
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: "true", explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: "false", explanation: '"raceacar" is not a palindrome.' }
    ],
    testcases: generate23TestCases(
      { input: "A man, a plan, a canal: Panama", output: "true" },
      { input: "race a car", output: "false" },
      [
        { input: " ", output: "true", category: "boundary" },
        { input: "a.", output: "true", category: "boundary" },
        { input: "ab", output: "false", category: "normal" },
        { input: "aba", output: "true", category: "normal" },
        { input: "0P", output: "false", category: "corner" },
        { input: "1b1", output: "true", category: "normal" },
        { input: "Was it a car or a cat I saw?", output: "true", category: "normal" },
        { input: "No 'x' in Nixon", output: "true", category: "normal" },
        { input: "madam", output: "true", category: "normal" },
        { input: "hello", output: "false", category: "normal" },
        { input: "a1a", output: "true", category: "normal" },
        { input: "12321", output: "true", category: "normal" },
        { input: "123421", output: "false", category: "normal" },
        { input: ".,;!", output: "true", category: "boundary" },
        { input: "a a a a a", output: "true", category: "duplicates" },
        { input: "A b C b A", output: "true", category: "normal" },
        { input: "abcdee dcba", output: "false", category: "normal" },
        { input: "racecar", output: "true", category: "normal" },
        { input: "abcba", output: "true", category: "normal" },
        { input: "A man a plan a canal Panama", output: "true", category: "normal" },
        { input: "not a palindrome", output: "false", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isPalindrome(s) {\n  let left = 0, right = s.length - 1;\n  while (left < right) {\n    while (left < right && !/[a-zA-Z0-9]/.test(s[left])) left++;\n    while (left < right && !/[a-zA-Z0-9]/.test(s[right])) right--;\n    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;\n    left++; right--;\n  }\n  return true;\n}`,
      typescript: `function isPalindrome(s: string): boolean {\n  let left = 0, right = s.length - 1;\n  while (left < right) {\n    while (left < right && !/[a-zA-Z0-9]/.test(s[left])) left++;\n    while (left < right && !/[a-zA-Z0-9]/.test(s[right])) right--;\n    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;\n    left++; right--;\n  }\n  return true;\n}`,
      python: `class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        l, r = 0, len(s) - 1\n        while l < r:\n            while l < r and not s[l].isalnum():\n                l += 1\n            while r > l and not s[r].isalnum():\n                r -= 1\n            if s[l].lower() != s[r].lower():\n                return False\n            l, r = l + 1, r - 1\n        return True`,
      java: `class Solution {\n    public boolean isPalindrome(String s) {\n        int left = 0, right = s.length() - 1;\n        while (left < right) {\n            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;\n            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;\n            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) return false;\n            left++; right--;\n        }\n        return true;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool isPalindrome(string s) {\n        int left = 0, right = s.size() - 1;\n        while (left < right) {\n            while (left < right && !isalnum(s[left])) left++;\n            while (left < right && !isalnum(s[right])) right--;\n            if (tolower(s[left]) != tolower(s[right])) return false;\n            left++; right--;\n        }\n        return true;\n    }\n};`,
      go: `func isPalindrome(s string) bool {\n    isAlnum := func(b byte) bool {\n        return (b >= 'a' && b <= 'z') || (b >= 'A' && b <= 'Z') || (b >= '0' && b <= '9')\n    }\n    toLower := func(b byte) byte {\n        if b >= 'A' && b <= 'Z' { return b + 32 }\n        return b\n    }\n    left, right := 0, len(s)-1\n    for left < right {\n        for left < right && !isAlnum(s[left]) { left++ }\n        for left < right && !isAlnum(s[right]) { right-- }\n        if toLower(s[left]) != toLower(s[right]) { return false }\n        left++; right--\n    }\n    return true\n}`,
      rust: `impl Solution {\n    pub fn is_palindrome(s: String) -> bool {\n        let chars: Vec<char> = s.chars()\n            .filter(|c| c.is_ascii_alphanumeric())\n            .map(|c| c.to_ascii_lowercase())\n            .collect();\n        let len = chars.len();\n        if len == 0 { return true; }\n        for i in 0..len/2 {\n            if chars[i] != chars[len - 1 - i] { return false; }\n        }\n        true\n    }\n}`,
      csharp: `public class Solution {\n    public bool IsPalindrome(string s) {\n        int left = 0, right = s.Length - 1;\n        while (left < right) {\n            while (left < right && !char.IsLetterOrDigit(s[left])) left++;\n            while (left < right && !char.IsLetterOrDigit(s[right])) right--;\n            if (char.ToLower(s[left]) != char.ToLower(s[right])) return false;\n            left++; right--;\n        }\n        return true;\n    }\n}`,
      php: `class Solution {\n    function isPalindrome($s) {\n        $clean = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $s));\n        return $clean === strrev($clean);\n    }\n}`,
      kotlin: `class Solution {\n    fun isPalindrome(s: String): Boolean {\n        var left = 0\n        var right = s.length - 1\n        while (left < right) {\n            while (left < right && !s[left].isLetterOrDigit()) left++\n            while (left < right && !s[right].isLetterOrDigit()) right--\n            if (s[left].toLowerCase() != s[right].toLowerCase()) return false\n            left++; right--\n        }\n        return true\n    }\n}`,
      swift: `class Solution {\n    func isPalindrome(_ s: String) -> Bool {\n        let chars = Array(s.lowercased().filter { $0.isLetter || $0.isNumber })\n        var left = 0, right = chars.count - 1\n        while left < right {\n            if chars[left] != chars[right] { return false }\n            left += 1; right -= 1\n        }\n        return true\n    }\n}`
    }
  },
  {
    id: "3sum",
    title: "15. 3Sum",
    official_function_name: "threeSum",
    difficulty: "Medium",
    master_category: "2. Two Pointer Patterns",
    sub_pattern: "Three Pointers",
    topic: ["arrays", "two-pointers", "sorting"],
    company_tags: ["meta", "amazon", "google", "microsoft", "apple"],
    pattern_tags: ["two-pointers", "sorting"],
    acceptance_rate: 33,
    time_complexity: "O(N^2)",
    space_complexity: "O(1)",
    description: `### 3Sum

Given an integer array \`nums\`, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.

### Input Format
- An integer array \`nums\`.

### Output Format
- A 2D integer array of unique triplets summing to zero.

### Constraints
- \`3 <= nums.length <= 3000\`
- \`-10^5 <= nums[i] <= 10^5\`

### Notes
- Sort array first \`O(N log N)\`. Loop \`i\` and use two pointers \`(left, right)\` for remainder \`-nums[i]\`. Skip duplicates carefully.`,
    examples: [
      { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" },
      { input: "nums = [0,1,1]", output: "[]" }
    ],
    testcases: generate23TestCases(
      { input: "[-1, 0, 1, 2, -1, -4]", output: "[[-1, -1, 2], [-1, 0, 1]]" },
      { input: "[0, 1, 1]", output: "[]" },
      [
        { input: "[0, 0, 0]", output: "[[0, 0, 0]]", category: "boundary" },
        { input: "[0, 0, 0, 0]", output: "[[0, 0, 0]]", category: "duplicates" },
        { input: "[-2, 0, 1, 1, 2]", output: "[[-2, 0, 2], [-2, 1, 1]]", category: "normal" },
        { input: "[-2, 0, 0, 2, 2]", output: "[[-2, 0, 2]]", category: "duplicates" },
        { input: "[-1, -1, -1, 2, 2, 2]", output: "[[-1, -1, 2]]", category: "duplicates" },
        { input: "[1, 2, -2, -1]", output: "[]", category: "normal" },
        { input: "[-4, -1, -1, 0, 1, 2]", output: "[[-1, -1, 2], [-1, 0, 1]]", category: "normal" },
        { input: "[-3, 0, 1, 2]", output: "[[-3, 1, 2]]", category: "normal" },
        { input: "[3, -2, 1, 0]", output: "[]", category: "normal" },
        { input: "[-100, 50, 50]", output: "[[-100, 50, 50]]", category: "normal" },
        { input: "[-1000, 500, 500]", output: "[[-1000, 500, 500]]", category: "large_input" },
        { input: "[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]", output: "[[-5, 0, 5], [-5, 1, 4], [-5, 2, 3], [-4, -1, 5], [-4, 0, 4], [-4, 1, 3], [-3, -2, 5], [-3, -1, 4], [-3, 0, 3], [-3, 1, 2], [-2, -1, 3], [-2, 0, 2], [-1, 0, 1]]", category: "stress" },
        { input: "[-1, -2, -3, 4, 1, 3, 0, 3, -2, 1, -2, 2, -1, 1, -5, 4, -3]", output: "[[-5, 1, 4], [-5, 2, 3], [-3, -1, 4], [-3, 0, 3], [-3, 1, 2], [-2, -2, 4], [-2, -1, 3], [-2, 0, 2], [-1, -1, 2], [-1, 0, 1]]", category: "stress" },
        { input: "[1, 1, 1, 1]", output: "[]", category: "duplicates" },
        { input: "[-2, 0, 1, 1, 2, -1, -4]", output: "[[-2, 0, 2], [-2, 1, 1], [-1, -1, 2], [-1, 0, 1]]", category: "normal" },
        { input: "[-1, 0, 1]", output: "[[-1, 0, 1]]", category: "normal" },
        { input: "[-5, 2, 3]", output: "[[-5, 2, 3]]", category: "normal" },
        { input: "[-10, -10, 20]", output: "[[-10, -10, 20]]", category: "duplicates" },
        { input: "[0, -1, 1, -1, 1]", output: "[[-1, 0, 1]]", category: "duplicates" },
        { input: "[-1, 1, 0, 0]", output: "[[-1, 0, 1]]", category: "normal" },
        { input: "[3, 0, -2, -1, 1, 2]", output: "[[-2, -1, 3], [-2, 0, 2], [-1, 0, 1]]", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nfunction threeSum(nums) {\n  nums.sort((a, b) => a - b);\n  const res = [];\n  for (let i = 0; i < nums.length - 2; i++) {\n    if (i > 0 && nums[i] === nums[i - 1]) continue;\n    let left = i + 1, right = nums.length - 1;\n    while (left < right) {\n      const sum = nums[i] + nums[left] + nums[right];\n      if (sum === 0) {\n        res.push([nums[i], nums[left], nums[right]]);\n        while (left < right && nums[left] === nums[left + 1]) left++;\n        while (left < right && nums[right] === nums[right - 1]) right--;\n        left++; right--;\n      } else if (sum < 0) {\n        left++;\n      } else {\n        right--;\n      }\n    }\n  }\n  return res;\n}`,
      typescript: `function threeSum(nums: number[]): number[][] {\n  nums.sort((a, b) => a - b);\n  const res: number[][] = [];\n  for (let i = 0; i < nums.length - 2; i++) {\n    if (i > 0 && nums[i] === nums[i - 1]) continue;\n    let left = i + 1, right = nums.length - 1;\n    while (left < right) {\n      const sum = nums[i] + nums[left] + nums[right];\n      if (sum === 0) {\n        res.push([nums[i], nums[left], nums[right]]);\n        while (left < right && nums[left] === nums[left + 1]) left++;\n        while (left < right && nums[right] === nums[right - 1]) right--;\n        left++; right--;\n      } else if (sum < 0) {\n        left++;\n      } else {\n        right--;\n      }\n    }\n  }\n  return res;\n}`,
      python: `class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        nums.sort()\n        res = []\n        for i, a in enumerate(nums):\n            if i > 0 and a == nums[i - 1]:\n                continue\n            l, r = i + 1, len(nums) - 1\n            while l < r:\n                three_sum = a + nums[l] + nums[r]\n                if three_sum > 0:\n                    r -= 1\n                elif three_sum < 0:\n                    l += 1\n                else:\n                    res.append([a, nums[l], nums[r]])\n                    l += 1\n                    while nums[l] == nums[l - 1] and l < r:\n                        l += 1\n        return res`,
      java: `class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        Arrays.sort(nums);\n        List<List<Integer>> res = new ArrayList<>();\n        for (int i = 0; i < nums.length - 2; i++) {\n            if (i > 0 && nums[i] == nums[i - 1]) continue;\n            int left = i + 1, right = nums.length - 1;\n            while (left < right) {\n                int sum = nums[i] + nums[left] + nums[right];\n                if (sum == 0) {\n                    res.add(Arrays.asList(nums[i], nums[left], nums[right]));\n                    while (left < right && nums[left] == nums[left + 1]) left++;\n                    while (left < right && nums[right] == nums[right - 1]) right--;\n                    left++; right--;\n                } else if (sum < 0) left++;\n                else right--;\n            }\n        }\n        return res;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        sort(nums.begin(), nums.end());\n        vector<vector<int>> res;\n        for (int i = 0; i < nums.size() - 2; i++) {\n            if (i > 0 && nums[i] == nums[i - 1]) continue;\n            int left = i + 1, right = nums.size() - 1;\n            while (left < right) {\n                int sum = nums[i] + nums[left] + nums[right];\n                if (sum == 0) {\n                    res.push_back({nums[i], nums[left], nums[right]});\n                    while (left < right && nums[left] == nums[left + 1]) left++;\n                    while (left < right && nums[right] == nums[right - 1]) right--;\n                    left++; right--;\n                } else if (sum < 0) left++;\n                else right--;\n            }\n        }\n        return res;\n    }\n};`,
      go: `func threeSum(nums []int) [][]int {\n    sort.Ints(nums)\n    res := [][]int{}\n    for i := 0; i < len(nums)-2; i++ {\n        if i > 0 && nums[i] == nums[i-1] { continue }\n        left, right := i+1, len(nums)-1\n        for left < right {\n            sum := nums[i] + nums[left] + nums[right]\n            if sum == 0 {\n                res = append(res, []int{nums[i], nums[left], nums[right]})\n                for left < right && nums[left] == nums[left+1] { left++ }\n                for left < right && nums[right] == nums[right-1] { right-- }\n                left++; right--\n            } else if sum < 0 {\n                left++\n            } else {\n                right--\n            }\n        }\n    }\n    return res\n}`,
      rust: `impl Solution {\n    pub fn three_sum(mut nums: Vec<i32>) -> Vec<Vec<i32>> {\n        nums.sort_unstable();\n        let mut res = vec![];\n        let len = nums.len();\n        if len < 3 { return res; }\n        for i in 0..len-2 {\n            if i > 0 && nums[i] == nums[i - 1] { continue; }\n            let (mut left, mut right) = (i + 1, len - 1);\n            while left < right {\n                let sum = nums[i] + nums[left] + nums[right];\n                if sum == 0 {\n                    res.push(vec![nums[i], nums[left], nums[right]]);\n                    while left < right && nums[left] == nums[left + 1] { left += 1; }\n                    while left < right && nums[right] == nums[right - 1] { right -= 1; }\n                    left += 1; right -= 1;\n                } else if sum < 0 { left += 1; } else { right -= 1; }\n            }\n        }\n        res\n    }\n}`,
      csharp: `public class Solution {\n    public IList<IList<int>> ThreeSum(int[] nums) {\n        Array.Sort(nums);\n        var res = new List<IList<int>>();\n        for (int i = 0; i < nums.Length - 2; i++) {\n            if (i > 0 && nums[i] == nums[i - 1]) continue;\n            int left = i + 1, right = nums.Length - 1;\n            while (left < right) {\n                int sum = nums[i] + nums[left] + nums[right];\n                if (sum == 0) {\n                    res.Add(new List<int> { nums[i], nums[left], nums[right] });\n                    while (left < right && nums[left] == nums[left + 1]) left++;\n                    while (left < right && nums[right] == nums[right - 1]) right--;\n                    left++; right--;\n                } else if (sum < 0) left++;\n                else right--;\n            }\n        }\n        return res;\n    }\n}`,
      php: `class Solution {\n    function threeSum($nums) {\n        sort($nums);\n        $res = [];\n        $len = count($nums);\n        for ($i = 0; $i < $len - 2; $i++) {\n            if ($i > 0 && $nums[$i] === $nums[$i - 1]) continue;\n            $left = $i + 1;\n            $right = $len - 1;\n            while ($left < $right) {\n                $sum = $nums[$i] + $nums[$left] + $nums[$right];\n                if ($sum === 0) {\n                    $res[] = [$nums[$i], $nums[$left], $nums[$right]];\n                    while ($left < $right && $nums[$left] === $nums[$left + 1]) $left++;\n                    while ($left < $right && $nums[$right] === $nums[$right - 1]) $right--;\n                    $left++; $right--;\n                } elseif ($sum < 0) $left++;\n                else $right--;\n            }\n        }\n        return $res;\n    }\n}`,
      kotlin: `class Solution {\n    fun threeSum(nums: IntArray): List<List<Int>> {\n        nums.sort()\n        val res = ArrayList<List<Int>>()\n        for (i in 0 until nums.size - 2) {\n            if (i > 0 && nums[i] == nums[i - 1]) continue\n            var left = i + 1\n            var right = nums.size - 1\n            while (left < right) {\n                val sum = nums[i] + nums[left] + nums[right]\n                if (sum == 0) {\n                    res.add(listOf(nums[i], nums[left], nums[right]))\n                    while (left < right && nums[left] == nums[left + 1]) left++\n                    while (left < right && nums[right] == nums[right - 1]) right--\n                    left++; right--\n                } else if (sum < 0) left++ else right--\n            }\n        }\n        return res\n    }\n}`,
      swift: `class Solution {\n    func threeSum(_ nums: [Int]) -> [[Int]] {\n        let nums = nums.sorted()\n        var res = [[Int]]()\n        guard nums.count >= 3 else { return res }\n        for i in 0..<nums.count - 2 {\n            if i > 0 && nums[i] == nums[i - 1] { continue }\n            var left = i + 1, right = nums.count - 1\n            while left < right {\n                let sum = nums[i] + nums[left] + nums[right]\n                if sum == 0 {\n                    res.append([nums[i], nums[left], nums[right]])\n                    while left < right && nums[left] == nums[left + 1] { left += 1 }\n                    while left < right && nums[right] == nums[right - 1] { right -= 1 }\n                    left += 1; right -= 1\n                } else if sum < 0 { left += 1 } else { right -= 1 }\n            }\n        }\n        return res\n    }\n}`
    }
  }
];
