import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey);

export const REAL_MNC_CODING_QUESTIONS = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    topic: ["arrays", "hash-table"],
    company_tags: ["google", "amazon", "meta", "tcs"],
    pattern_tags: ["two-pointers", "hash-table"],
    acceptance_rate: 49,
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
    ],
    testcases: [
      { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" },
      { input: "[3, 2, 4]\n6", expectedOutput: "[1, 2]" },
      { input: "[3, 3]\n6", expectedOutput: "[0, 1]" }
    ],
    starter_code: {
      javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) {\n                return new int[] { map.get(diff), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> mp;\n        for (int i = 0; i < nums.size(); i++) {\n            int diff = target - nums[i];\n            if (mp.count(diff)) return {mp[diff], i};\n            mp[nums[i]] = i;\n        }\n        return {};\n    }\n};`
    }
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: ["stack", "strings"],
    company_tags: ["amazon", "meta", "microsoft", "infosys"],
    pattern_tags: ["stack"],
    acceptance_rate: 41,
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets and in the correct order.",
    examples: [
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" }
    ],
    testcases: [
      { input: "()[]{}", expectedOutput: "true" },
      { input: "(]", expectedOutput: "false" },
      { input: "([{}])", expectedOutput: "true" }
    ],
    starter_code: {
      javascript: `function isValid(s) {\n  const stack = [];\n  const pairs = { ')': '(', '}': '{', ']': '[' };\n  for (let ch of s) {\n    if (pairs[ch]) {\n      if (stack.pop() !== pairs[ch]) return false;\n    } else {\n      stack.push(ch);\n    }\n  }\n  return stack.length === 0;\n}`,
      python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        stack = []\n        mapping = {")": "(", "}": "{", "]": "["}\n        for char in s:\n            if char in mapping:\n                top = stack.pop() if stack else '#'\n                if mapping[char] != top:\n                    return False\n            else:\n                stack.append(char)\n        return not stack`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(') stack.push(')');\n            else if (c == '{') stack.push('}');\n            else if (c == '[') stack.push(']');\n            else if (stack.isEmpty() || stack.pop() != c) return false;\n        }\n        return stack.isEmpty();\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        stack<char> st;\n        for (char c : s) {\n            if (c == '(' || c == '{' || c == '[') st.push(c);\n            else {\n                if (st.empty()) return false;\n                if (c == ')' && st.top() != '(') return false;\n                if (c == '}' && st.top() != '{') return false;\n                if (c == ']' && st.top() != '[') return false;\n                st.pop();\n            }\n        }\n        return st.empty();\n    }\n};`
    }
  },
  {
    id: "longest-substring-without-repeating",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: ["sliding-window", "strings", "hash-table"],
    company_tags: ["google", "amazon", "tcs", "wipro"],
    pattern_tags: ["sliding-window"],
    acceptance_rate: 34,
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' }
    ],
    testcases: [
      { input: "abcabcbb", expectedOutput: "3" },
      { input: "bbbbb", expectedOutput: "1" },
      { input: "pwwkew", expectedOutput: "3" }
    ],
    starter_code: {
      javascript: `function lengthOfLongestSubstring(s) {\n  let maxLen = 0, left = 0;\n  const set = new Set();\n  for (let right = 0; right < s.length; right++) {\n    while (set.has(s[right])) {\n      set.delete(s[left]);\n      left++;\n    }\n    set.add(s[right]);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}`,
      python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        char_set = set()\n        l = 0\n        res = 0\n        for r in range(len(s)):\n            while s[r] in char_set:\n                char_set.remove(s[l])\n                l += 1\n            char_set.add(s[r])\n            res = max(res, r - l + 1)\n        return res`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        Set<Character> set = new HashSet<>();\n        int left = 0, maxLen = 0;\n        for (int right = 0; right < s.length(); right++) {\n            while (set.contains(s.charAt(right))) {\n                set.remove(s.charAt(left));\n                left++;\n            }\n            set.add(s.charAt(right));\n            maxLen = Math.max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        unordered_set<char> st;\n        int left = 0, maxLen = 0;\n        for (int right = 0; right < s.length(); right++) {\n            while (st.count(s[right])) {\n                st.erase(s[left]);\n                left++;\n            }\n            st.insert(s[right]);\n            maxLen = max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n};`
    }
  },
  {
    id: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    topic: ["two-pointers", "arrays", "greedy"],
    company_tags: ["google", "meta", "amazon", "cognizant"],
    pattern_tags: ["two-pointers"],
    acceptance_rate: 54,
    description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water.",
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "The vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, max area of water the container can contain is 49." }
    ],
    testcases: [
      { input: "[1,8,6,2,5,4,8,3,7]", expectedOutput: "49" },
      { input: "[1,1]", expectedOutput: "1" }
    ],
    starter_code: {
      javascript: `function maxArea(height) {\n  let l = 0, r = height.length - 1, max = 0;\n  while (l < r) {\n    const area = Math.min(height[l], height[r]) * (r - l);\n    max = Math.max(max, area);\n    if (height[l] < height[r]) l++;\n    else r--;\n  }\n  return max;\n}`,
      python: `class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        l, r = 0, len(height) - 1\n        res = 0\n        while l < r:\n            area = min(height[l], height[r]) * (r - l)\n            res = max(res, area)\n            if height[l] < height[r]:\n                l += 1\n            else:\n                r -= 1\n        return res`,
      java: `class Solution {\n    public int maxArea(int[] height) {\n        int l = 0, r = height.length - 1, max = 0;\n        while (l < r) {\n            int area = Math.min(height[l], height[r]) * (r - l);\n            max = Math.max(max, area);\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return max;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        int l = 0, r = height.size() - 1, maxArea = 0;\n        while (l < r) {\n            int area = min(height[l], height[r]) * (r - l);\n            maxArea = max(maxArea, area);\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return maxArea;\n    }\n};`
    }
  },
  {
    id: "3sum",
    title: "3Sum",
    difficulty: "Medium",
    topic: ["two-pointers", "sorting", "arrays"],
    company_tags: ["amazon", "facebook", "tcs", "capgemini"],
    pattern_tags: ["two-pointers"],
    acceptance_rate: 33,
    description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.",
    examples: [
      { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" }
    ],
    testcases: [
      { input: "[-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]" },
      { input: "[0,1,1]", expectedOutput: "[]" }
    ],
    starter_code: {
      javascript: `function threeSum(nums) {\n  nums.sort((a,b)=>a-b);\n  const res = [];\n  for (let i = 0; i < nums.length - 2; i++) {\n    if (i > 0 && nums[i] === nums[i-1]) continue;\n    let l = i + 1, r = nums.length - 1;\n    while (l < r) {\n      const sum = nums[i] + nums[l] + nums[r];\n      if (sum === 0) {\n        res.push([nums[i], nums[l], nums[r]]);\n        while (l < r && nums[l] === nums[l+1]) l++;\n        while (l < r && nums[r] === nums[r-1]) r--;\n        l++; r--;\n      } else if (sum < 0) l++;\n      else r--;\n    }\n  }\n  return res;\n}`,
      python: `class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        nums.sort()\n        res = []\n        for i in range(len(nums) - 2):\n            if i > 0 and nums[i] == nums[i-1]: continue\n            l, r = i + 1, len(nums) - 1\n            while l < r:\n                s = nums[i] + nums[l] + nums[r]\n                if s == 0:\n                    res.append([nums[i], nums[l], nums[r]])\n                    while l < r and nums[l] == nums[l+1]: l += 1\n                    while l < r and nums[r] == nums[r-1]: r -= 1\n                    l += 1; r -= 1\n                elif s < 0: l += 1\n                else: r -= 1\n        return res`,
      java: `class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        Arrays.sort(nums);\n        List<List<Integer>> res = new ArrayList<>();\n        for (int i = 0; i < nums.length - 2; i++) {\n            if (i > 0 && nums[i] == nums[i-1]) continue;\n            int l = i + 1, r = nums.length - 1;\n            while (l < r) {\n                int sum = nums[i] + nums[l] + nums[r];\n                if (sum == 0) {\n                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));\n                    while (l < r && nums[l] == nums[l+1]) l++;\n                    while (l < r && nums[r] == nums[r-1]) r--;\n                    l++; r--;\n                } else if (sum < 0) l++;\n                else r--;\n            }\n        }\n        return res;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        sort(nums.begin(), nums.end());\n        vector<vector<int>> res;\n        for (int i = 0; i < (int)nums.size() - 2; i++) {\n            if (i > 0 && nums[i] == nums[i-1]) continue;\n            int l = i + 1, r = nums.size() - 1;\n            while (l < r) {\n                int s = nums[i] + nums[l] + nums[r];\n                if (s == 0) {\n                    res.push_back({nums[i], nums[l], nums[r]});\n                    while (l < r && nums[l] == nums[l+1]) l++;\n                    while (l < r && nums[r] == nums[r-1]) r--;\n                    l++; r--;\n                } else if (s < 0) l++;\n                else r--;\n            }\n        }\n        return res;\n    }\n};`
    }
  },
  {
    id: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    topic: ["graphs", "bfs", "dfs", "matrix"],
    company_tags: ["amazon", "google", "microsoft", "accenture"],
    pattern_tags: ["dfs", "bfs"],
    acceptance_rate: 57,
    description: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1" }
    ],
    testcases: [
      { input: "1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1", expectedOutput: "3" }
    ],
    starter_code: {
      javascript: `function numIslands(grid) {\n  if (!grid || grid.length === 0) return 0;\n  let count = 0;\n  function dfs(r, c) {\n    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] === '0') return;\n    grid[r][c] = '0';\n    dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);\n  }\n  for (let r = 0; r < grid.length; r++) {\n    for (let c = 0; c < grid[0].length; c++) {\n      if (grid[r][c] === '1') {\n        count++;\n        dfs(r, c);\n      }\n    }\n  }\n  return count;\n}`,
      python: `class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        if not grid: return 0\n        rows, cols = len(grid), len(grid[0])\n        count = 0\n        def dfs(r, c):\n            if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] == '0':\n                return\n            grid[r][c] = '0'\n            dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)\n        for r in range(rows):\n            for c in range(cols):\n                if grid[r][c] == '1':\n                    count += 1\n                    dfs(r, c)\n        return count`,
      java: `class Solution {\n    public int numIslands(char[][] grid) {\n        if (grid == null || grid.length == 0) return 0;\n        int count = 0;\n        for (int r = 0; r < grid.length; r++) {\n            for (int c = 0; c < grid[0].length; c++) {\n                if (grid[r][c] == '1') {\n                    count++;\n                    dfs(grid, r, c);\n                }\n            }\n        }\n        return count;\n    }\n    private void dfs(char[][] grid, int r, int c) {\n        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] == '0') return;\n        grid[r][c] = '0';\n        dfs(grid, r+1, c); dfs(grid, r-1, c); dfs(grid, r, c+1); dfs(grid, r, c-1);\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        if (grid.empty()) return 0;\n        int count = 0;\n        for (int r = 0; r < grid.size(); r++) {\n            for (int c = 0; c < grid[0].size(); c++) {\n                if (grid[r][c] == '1') {\n                    count++;\n                    dfs(grid, r, c);\n                }\n            }\n        }\n        return count;\n    }\nprivate:\n    void dfs(vector<vector<char>>& grid, int r, int c) {\n        if (r < 0 || c < 0 || r >= grid.size() || c >= grid[0].size() || grid[r][c] == '0') return;\n        grid[r][c] = '0';\n        dfs(grid, r+1, c); dfs(grid, r-1, c); dfs(grid, r, c+1); dfs(grid, r, c-1);\n    }\n};`
    }
  },
  {
    id: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    topic: ["dynamic-programming", "memoization"],
    company_tags: ["amazon", "google", "meta", "infosys"],
    pattern_tags: ["dp"],
    acceptance_rate: 42,
    description: "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.",
    examples: [
      { input: "coins = [1,2,5], amount = 11", output: "3", explanation: "11 = 5 + 5 + 1" },
      { input: "coins = [2], amount = 3", output: "-1" }
    ],
    testcases: [
      { input: "[1, 2, 5]\n11", expectedOutput: "3" },
      { input: "[2]\n3", expectedOutput: "-1" }
    ],
    starter_code: {
      javascript: `function coinChange(coins, amount) {\n  const dp = new Array(amount + 1).fill(Infinity);\n  dp[0] = 0;\n  for (let i = 1; i <= amount; i++) {\n    for (const c of coins) {\n      if (i - c >= 0) dp[i] = Math.min(dp[i], dp[i-c] + 1);\n    }\n  }\n  return dp[amount] === Infinity ? -1 : dp[amount];\n}`,
      python: `class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        dp = [float('inf')] * (amount + 1)\n        dp[0] = 0\n        for i in range(1, amount + 1):\n            for c in coins:\n                if i - c >= 0:\n                    dp[i] = min(dp[i], dp[i-c] + 1)\n        return dp[amount] if dp[amount] != float('inf') else -1`,
      java: `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        int[] dp = new int[amount + 1];\n        Arrays.fill(dp, amount + 1);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; i++) {\n            for (int c : coins) {\n                if (i - c >= 0) dp[i] = Math.min(dp[i], dp[i-c] + 1);\n            }\n        }\n        return dp[amount] > amount ? -1 : dp[amount];\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        vector<int> dp(amount + 1, amount + 1);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; i++) {\n            for (int c : coins) {\n                if (i - c >= 0) dp[i] = min(dp[i], dp[i-c] + 1);\n            }\n        }\n        return dp[amount] > amount ? -1 : dp[amount];\n    }\n};`
    }
  },
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    topic: ["linked-list", "pointers"],
    company_tags: ["amazon", "microsoft", "tcs", "wipro"],
    pattern_tags: ["pointers"],
    acceptance_rate: 73,
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" }
    ],
    testcases: [
      { input: "[1, 2, 3, 4, 5]", expectedOutput: "[5, 4, 3, 2, 1]" }
    ],
    starter_code: {
      javascript: `function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    let next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}`,
      python: `class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        prev, curr = None, head\n        while curr:\n            nxt = curr.next\n            curr.next = prev\n            prev = curr\n            curr = nxt\n        return prev`,
      java: `class Solution {\n    public ListNode reverseList(ListNode head) {\n        ListNode prev = null, curr = head;\n        while (curr != null) {\n            ListNode next = curr.next;\n            curr.next = prev;\n            prev = curr;\n            curr = next;\n        }\n        return prev;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        ListNode *prev = nullptr, *curr = head;\n        while (curr) {\n            ListNode* next = curr->next;\n            curr->next = prev;\n            prev = curr;\n            curr = next;\n        }\n        return prev;\n    }\n};`
    }
  },
  {
    id: "merge-k-sorted-lists",
    title: "Merge k Sorted Lists",
    difficulty: "Hard",
    topic: ["linked-list", "heap", "divide-and-conquer"],
    company_tags: ["google", "amazon", "meta"],
    pattern_tags: ["heap"],
    acceptance_rate: 49,
    description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    examples: [
      { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" }
    ],
    testcases: [
      { input: "[[1,4,5],[1,3,4],[2,6]]", expectedOutput: "[1,1,2,3,4,4,5,6]" }
    ],
    starter_code: {
      javascript: `function mergeKLists(lists) {\n  if (!lists || lists.length === 0) return null;\n  while (lists.length > 1) {\n    let merged = [];\n    for (let i = 0; i < lists.length; i += 2) {\n      let l1 = lists[i], l2 = (i + 1 < lists.length) ? lists[i+1] : null;\n      merged.push(merge2Lists(l1, l2));\n    }\n    lists = merged;\n  }\n  return lists[0];\n}`,
      python: `class Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        if not lists: return None\n        while len(lists) > 1:\n            merged = []\n            for i in range(0, len(lists), 2):\n                l1 = lists[i]\n                l2 = lists[i+1] if i + 1 < len(lists) else None\n                merged.append(self.merge2(l1, l2))\n            lists = merged\n        return lists[0]`,
      java: `class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        PriorityQueue<ListNode> pq = new PriorityQueue<>((a,b)->a.val - b.val);\n        for (ListNode node : lists) if (node != null) pq.add(node);\n        ListNode dummy = new ListNode(0), tail = dummy;\n        while (!pq.isEmpty()) {\n            ListNode min = pq.poll();\n            tail.next = min;\n            tail = tail.next;\n            if (min.next != null) pq.add(min.next);\n        }\n        return dummy.next;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        auto comp = [](ListNode* a, ListNode* b){ return a->val > b->val; };\n        priority_queue<ListNode*, vector<ListNode*>, decltype(comp)> pq(comp);\n        for (auto node : lists) if (node) pq.push(node);\n        ListNode dummy(0), *tail = &dummy;\n        while (!pq.empty()) {\n            ListNode* top = pq.top(); pq.pop();\n            tail->next = top;\n            tail = tail->next;\n            if (top->next) pq.push(top->next);\n        }\n        return dummy.next;\n    }\n};`
    }
  }
];

async function run() {
  console.log("Upserting authentic MNC coding questions into Supabase...");
  const { error } = await admin.from("questions").upsert(REAL_MNC_CODING_QUESTIONS, { onConflict: "id" });
  if (error) {
    console.error("Failed to seed real coding questions:", error);
  } else {
    console.log("Successfully seeded real MNC coding questions!");
  }
}

run();
