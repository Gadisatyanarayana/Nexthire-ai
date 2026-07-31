export interface LeetCodeStarterCodes {
  javascript: string;
  typescript: string;
  python: string;
  java: string;
  cpp: string;
  go: string;
  rust: string;
  csharp: string;
  php: string;
  kotlin: string;
  swift: string;
}

export interface LeetCodeTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  category?: 'normal' | 'boundary' | 'large_input' | 'duplicates' | 'negative' | 'overflow' | 'stress' | 'corner' | 'random';
}

export interface CanonicalLeetCodeProblem {
  id: string;
  title: string;
  official_function_name: string;
  difficulty: "Easy" | "Medium" | "Hard";
  master_category: string;
  sub_pattern: string;
  topic: string[];
  company_tags: string[];
  pattern_tags: string[];
  acceptance_rate: number;
  time_complexity: string;
  space_complexity: string;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  testcases: LeetCodeTestCase[];
  starter_code: LeetCodeStarterCodes;
}

/**
 * Helper to generate 21 hidden test cases + 2 visible test cases for numeric/array problems
 * ensuring full coverage: Normal, Boundary, Large input, Duplicates, Negative values, Overflow, Stress tests, Corner cases, Random tests.
 */
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

export const OFFICIAL_LEETCODE_CATALOG: CanonicalLeetCodeProblem[] = [
  {
    id: "two-sum",
    title: "1. Two Sum",
    official_function_name: "twoSum",
    difficulty: "Easy",
    master_category: "1. Arrays & Strings",
    sub_pattern: "HashMap Complement Search",
    topic: ["arrays", "hash-table"],
    company_tags: ["google", "amazon", "meta", "microsoft", "apple", "uber"],
    pattern_tags: ["arrays", "hash-table", "complement-search"],
    acceptance_rate: 51,
    time_complexity: "O(N)",
    space_complexity: "O(N)",
    description: `### Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

### Input Format
- First line: An integer array \`nums\`
- Second line: An integer \`target\`

### Output Format
- An array of two integers representing the indices of the complement pair.

### Constraints
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **Only one valid answer exists.**

### Notes
- Do not use brute-force O(N^2) double loop.
- Use a hash map to look up required complement \`target - nums[i]\` in O(1) time.`,
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "nums[1] + nums[2] == 6." }
    ],
    testcases: generate23TestCases(
      { input: "[2, 7, 11, 15]\n9", output: "[0, 1]" },
      { input: "[3, 2, 4]\n6", output: "[1, 2]" },
      [
        { input: "[3, 3]\n6", output: "[0, 1]", category: "duplicates" },
        { input: "[1, 5, 8, 12, 19]\n20", output: "[0, 4]", category: "normal" },
        { input: "[-3, 4, 3, 90]\n0", output: "[0, 2]", category: "negative" },
        { input: "[0, 4, 3, 0]\n0", output: "[0, 3]", category: "boundary" },
        { input: "[-10, -1, -18, -19]\n-29", output: "[0, 3]", category: "negative" },
        { input: "[100, 200, 300, 400]\n700", output: "[2, 3]", category: "large_input" },
        { input: "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n19", output: "[8, 9]", category: "normal" },
        { input: "[5, 75, 25]\n100", output: "[1, 2]", category: "normal" },
        { input: "[-50, 50]\n0", output: "[0, 1]", category: "negative" },
        { input: "[1000000000, -1000000000]\n0", output: "[0, 1]", category: "overflow" },
        { input: "[1, 1, 1, 1, 1, 4, 1, 1, 1, 8]\n12", output: "[5, 9]", category: "duplicates" },
        { input: "[9999, 1]\n10000", output: "[0, 1]", category: "corner" },
        { input: "[-5, -4, -3, -2, -1]\n-9", output: "[0, 1]", category: "negative" },
        { input: "[10, 20, 30, 40, 50, 60]\n110", output: "[4, 5]", category: "normal" },
        { input: "[2, 5, 5, 11]\n10", output: "[1, 2]", category: "duplicates" },
        { input: "[0, 1, 2, 0]\n0", output: "[0, 3]", category: "boundary" },
        { input: "[100, 1000, 10000, 100000]\n1100", output: "[0, 1]", category: "large_input" },
        { input: "[-100, 100, 200, 300]\n100", output: "[0, 2]", category: "negative" },
        { input: "[7, 14, 21, 28, 35]\n56", output: "[2, 4]", category: "normal" },
        { input: "[45, 55, 65, 75]\n100", output: "[0, 1]", category: "stress" },
        { input: "[123, 456, 789]\n1245", output: "[1, 2]", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) {\n                return new int[] { map.get(diff), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> mp;\n        for (int i = 0; i < nums.size(); i++) {\n            int diff = target - nums[i];\n            if (mp.count(diff)) return {mp[diff], i};\n            mp[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
      go: `func twoSum(nums []int, target int) []int {\n    mp := make(map[int]int)\n    for i, num := range nums {\n        diff := target - num\n        if idx, found := mp[diff]; found {\n            return []int{idx, i}\n        }\n        mp[num] = i\n    }\n    return []int{}\n}`,
      rust: `impl Solution {\n    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        use std::collections::HashMap;\n        let mut map = HashMap::new();\n        for (i, &num) in nums.iter().enumerate() {\n            let diff = target - num;\n            if let Some(&idx) = map.get(&diff) {\n                return vec![idx as i32, i as i32];\n            }\n            map.insert(num, i);\n        }\n        vec![]\n    }\n}`,
      csharp: `public class Solution {\n    public int[] TwoSum(int[] nums, int target) {\n        var dict = new Dictionary<int, int>();\n        for (int i = 0; i < nums.Length; i++) {\n            int diff = target - nums[i];\n            if (dict.ContainsKey(diff)) return new int[] { dict[diff], i };\n            dict[nums[i]] = i;\n        }\n        return new int[0];\n    }\n}`,
      php: `class Solution {\n    function twoSum($nums, $target) {\n        $map = [];\n        foreach ($nums as $i => $num) {\n            $diff = $target - $num;\n            if (isset($map[$diff])) return [$map[$diff], $i];\n            $map[$num] = $i;\n        }\n        return [];\n    }\n}`,
      kotlin: `class Solution {\n    fun twoSum(nums: IntArray, target: Int): IntArray {\n        val map = HashMap<Int, Int>()\n        for (i in nums.indices) {\n            val diff = target - nums[i]\n            if (map.containsKey(diff)) return intArrayOf(map[diff]!!, i)\n            map[nums[i]] = i\n        }\n        return intArrayOf()\n    }\n}`,
      swift: `class Solution {\n    func twoSum(_ nums: [Int], _ target: Int) -> [Int] {\n        var dict = [Int: Int]()\n        for (i, num) in nums.enumerated() {\n            let diff = target - num\n            if let index = dict[diff] {\n                return [index, i]\n            }\n            dict[num] = i\n        }\n        return []\n    }\n}`
    }
  },
  {
    id: "reverse-linked-list",
    title: "206. Reverse Linked List",
    official_function_name: "reverseList",
    difficulty: "Easy",
    master_category: "13. Linked List",
    sub_pattern: "In-place Reversal",
    topic: ["linked-list", "recursion"],
    company_tags: ["amazon", "microsoft", "apple", "google", "meta"],
    pattern_tags: ["linked-list", "reverse"],
    acceptance_rate: 74,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    description: `### Reverse Linked List

Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.

### Input Format
- A singly linked list \`head\`.

### Output Format
- The new head of the reversed singly linked list.

### Constraints
- The number of nodes in the list is the range \`[0, 5000]\`.
- \`-5000 <= Node.val <= 5000\`

### Notes
- Can be solved iteratively in O(1) auxiliary space using three pointers: \`prev\`, \`curr\`, and \`next\`.`,
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = [1,2]", output: "[2,1]" }
    ],
    testcases: generate23TestCases(
      { input: "[1, 2, 3, 4, 5]", output: "[5, 4, 3, 2, 1]" },
      { input: "[1, 2]", output: "[2, 1]" },
      [
        { input: "[]", output: "[]", category: "boundary" },
        { input: "[1]", output: "[1]", category: "boundary" },
        { input: "[3, 3, 3]", output: "[3, 3, 3]", category: "duplicates" },
        { input: "[-1, -2, -3]", output: "[-3, -2, -1]", category: "negative" },
        { input: "[10, 20, 30, 40]", output: "[40, 30, 20, 10]", category: "normal" },
        { input: "[100, 200, 300]", output: "[300, 200, 100]", category: "normal" },
        { input: "[5, 4, 3, 2, 1, 0]", output: "[0, 1, 2, 3, 4, 5]", category: "normal" },
        { input: "[-5000, 5000]", output: "[5000, -5000]", category: "boundary" },
        { input: "[7, 7, 8, 8]", output: "[8, 8, 7, 7]", category: "duplicates" },
        { input: "[9, 8, 7, 6, 5, 4, 3, 2, 1]", output: "[1, 2, 3, 4, 5, 6, 7, 8, 9]", category: "large_input" },
        { input: "[42]", output: "[42]", category: "corner" },
        { input: "[-10, 0, 10]", output: "[10, 0, -10]", category: "negative" },
        { input: "[2, 4, 6, 8, 10, 12, 14]", output: "[14, 12, 10, 8, 6, 4, 2]", category: "normal" },
        { input: "[0, 0, 0, 0]", output: "[0, 0, 0, 0]", category: "duplicates" },
        { input: "[1, 3, 5, 7, 9, 11, 13, 15]", output: "[15, 13, 11, 9, 7, 5, 3, 1]", category: "large_input" },
        { input: "[-99, -88, -77]", output: "[-77, -88, -99]", category: "negative" },
        { input: "[1000, 2000, 3000, 4000, 5000]", output: "[5000, 4000, 3000, 2000, 1000]", category: "stress" },
        { input: "[5]", output: "[5]", category: "corner" },
        { input: "[1, 2, 1, 2, 1]", output: "[1, 2, 1, 2, 1]", category: "duplicates" },
        { input: "[8, 6, 4, 2, 0, -2, -4]", output: "[-4, -2, 0, 2, 4, 6, 8]", category: "negative" },
        { input: "[99, 100]", output: "[100, 99]", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nfunction reverseList(head) {\n  let prev = null, curr = head;\n  while (curr !== null) {\n    let nextTemp = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = nextTemp;\n  }\n  return prev;\n}`,
      typescript: `function reverseList(head: ListNode | null): ListNode | null {\n  let prev: ListNode | null = null;\n  let curr: ListNode | null = head;\n  while (curr !== null) {\n    let nextTemp = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = nextTemp;\n  }\n  return prev;\n}`,
      python: `class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        prev = None\n        curr = head\n        while curr:\n            next_temp = curr.next\n            curr.next = prev\n            prev = curr\n            curr = next_temp\n        return prev`,
      java: `class Solution {\n    public ListNode reverseList(ListNode head) {\n        ListNode prev = null, curr = head;\n        while (curr != null) {\n            ListNode nextTemp = curr.next;\n            curr.next = prev;\n            prev = curr;\n            curr = nextTemp;\n        }\n        return prev;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        ListNode* prev = nullptr;\n        ListNode* curr = head;\n        while (curr != nullptr) {\n            ListNode* nextTemp = curr->next;\n            curr->next = prev;\n            prev = curr;\n            curr = nextTemp;\n        }\n        return prev;\n    }\n};`,
      go: `func reverseList(head *ListNode) *ListNode {\n    var prev *ListNode = nil\n    curr := head\n    for curr != nil {\n        nextTemp := curr.Next\n        curr.Next = prev\n        prev = curr\n        curr = nextTemp\n    }\n    return prev\n}`,
      rust: `impl Solution {\n    pub fn reverse_list(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {\n        let mut prev = None;\n        let mut curr = head;\n        while let Some(mut node) = curr {\n            curr = node.next;\n            node.next = prev;\n            prev = Some(node);\n        }\n        prev\n    }\n}`,
      csharp: `public class Solution {\n    public ListNode ReverseList(ListNode head) {\n        ListNode prev = null, curr = head;\n        while (curr != null) {\n            ListNode nextTemp = curr.next;\n            curr.next = prev;\n            prev = curr;\n            curr = nextTemp;\n        }\n        return prev;\n    }\n}`,
      php: `class Solution {\n    function reverseList($head) {\n        $prev = null;\n        $curr = $head;\n        while ($curr !== null) {\n            $nextTemp = $curr->next;\n            $curr->next = $prev;\n            $prev = $curr;\n            $curr = $nextTemp;\n        }\n        return $prev;\n    }\n}`,
      kotlin: `class Solution {\n    fun reverseList(head: ListNode?): ListNode? {\n        var prev: ListNode? = null\n        var curr = head\n        while (curr != null) {\n            val nextTemp = curr.next\n            curr.next = prev\n            prev = curr\n            curr = nextTemp\n        }\n        return prev\n    }\n}`,
      swift: `class Solution {\n    func reverseList(_ head: ListNode?) -> ListNode? {\n        var prev: ListNode? = nil\n        var curr = head\n        while curr != nil {\n            let nextTemp = curr?.next\n            curr?.next = prev\n            prev = curr\n            curr = nextTemp\n        }\n        return prev\n    }\n}`
    }
  },
  {
    id: "binary-tree-level-order-traversal",
    title: "102. Binary Tree Level Order Traversal",
    official_function_name: "levelOrder",
    difficulty: "Medium",
    master_category: "14. Trees",
    sub_pattern: "BFS Level Order Traversal",
    topic: ["trees", "bfs"],
    company_tags: ["amazon", "microsoft", "meta", "google"],
    pattern_tags: ["trees", "bfs", "level-order"],
    acceptance_rate: 66,
    time_complexity: "O(N)",
    space_complexity: "O(N)",
    description: `### Binary Tree Level Order Traversal

Given the \`head\` or \`root\` of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).

### Input Format
- The root of a binary tree \`root\`.

### Output Format
- A 2D list of integers representing level-by-level node values.

### Constraints
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-1000 <= Node.val <= 1000\`

### Notes
- Use a Breadth-First Search (BFS) queue to process nodes level by level.`,
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "[[3],[9,20],[15,7]]" },
      { input: "root = [1]", output: "[[1]]" }
    ],
    testcases: generate23TestCases(
      { input: "[3, 9, 20, null, null, 15, 7]", output: "[[3], [9, 20], [15, 7]]" },
      { input: "[1]", output: "[[1]]" },
      [
        { input: "[]", output: "[]", category: "boundary" },
        { input: "[1, 2, 3]", output: "[[1], [2, 3]]", category: "normal" },
        { input: "[1, 2, null, 3, null, 4]", output: "[[1], [2], [3], [4]]", category: "stress" },
        { input: "[-10, -20, -30]", output: "[[-10], [-20, -30]]", category: "negative" },
        { input: "[100, 100, 100]", output: "[[100], [100, 100]]", category: "duplicates" },
        { input: "[1, 2, 3, 4, 5, 6, 7]", output: "[[1], [2, 3], [4, 5, 6, 7]]", category: "normal" },
        { input: "[0]", output: "[[0]]", category: "boundary" },
        { input: "[5, 1, 4, null, null, 3, 6]", output: "[[5], [1, 4], [3, 6]]", category: "normal" },
        { input: "[10, 5, 15, 3, 7, 13, 18]", output: "[[10], [5, 15], [3, 7, 13, 18]]", category: "normal" },
        { input: "[-1000, 1000]", output: "[[-1000], [1000]]", category: "boundary" },
        { input: "[2, 2, 2, 2, 2]", output: "[[2], [2, 2], [2, 2]]", category: "duplicates" },
        { input: "[10, 9, 8, 7, 6, 5, 4]", output: "[[10], [9, 8], [7, 6, 5, 4]]", category: "normal" },
        { input: "[42, 24]", output: "[[42], [24]]", category: "corner" },
        { input: "[-5, -4, -3, -2, -1]", output: "[[-5], [-4, -3], [-2, -1]]", category: "negative" },
        { input: "[1, null, 2, null, 3, null, 4]", output: "[[1], [2], [3], [4]]", category: "stress" },
        { input: "[50, 40, 60, 30, 45, 55, 70]", output: "[[50], [40, 60], [30, 45, 55, 70]]", category: "normal" },
        { input: "[8, 8, 8, 8, 8, 8, 8]", output: "[[8], [8, 8], [8, 8, 8, 8]]", category: "duplicates" },
        { input: "[100, 50, 200, 25, 75, 150, 300]", output: "[[100], [50, 200], [25, 75, 150, 300]]", category: "large_input" },
        { input: "[-99, -88, -77, -66]", output: "[[-99], [-88, -77], [-66]]", category: "negative" },
        { input: "[7]", output: "[[7]]", category: "corner" },
        { input: "[12, 11, 10]", output: "[[12], [11, 10]]", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {TreeNode} root\n * @return {number[][]}\n */\nfunction levelOrder(root) {\n  if (!root) return [];\n  const result = [];\n  const queue = [root];\n  while (queue.length > 0) {\n    const size = queue.length;\n    const currentLevel = [];\n    for (let i = 0; i < size; i++) {\n      const node = queue.shift();\n      currentLevel.push(node.val);\n      if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n    result.push(currentLevel);\n  }\n  return result;\n}`,
      typescript: `function levelOrder(root: TreeNode | null): number[][] {\n  if (!root) return [];\n  const result: number[][] = [];\n  const queue: TreeNode[] = [root];\n  while (queue.length > 0) {\n    const size = queue.length;\n    const currentLevel: number[] = [];\n    for (let i = 0; i < size; i++) {\n      const node = queue.shift()!;\n      currentLevel.push(node.val);\n      if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n    result.push(currentLevel);\n  }\n  return result;\n}`,
      python: `class Solution:\n    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:\n        if not root:\n            return []\n        res, queue = [], collections.deque([root])\n        while queue:\n            level = []\n            for _ in range(len(queue)):\n                node = queue.popleft()\n                level.append(node.val)\n                if node.left:\n                    queue.append(node.left)\n                if node.right:\n                    queue.append(node.right)\n            res.append(level)\n        return res`,
      java: `class Solution {\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        List<List<Integer>> res = new ArrayList<>();\n        if (root == null) return res;\n        Queue<TreeNode> queue = new LinkedList<>();\n        queue.offer(root);\n        while (!queue.isEmpty()) {\n            int size = queue.size();\n            List<Integer> level = new ArrayList<>();\n            for (int i = 0; i < size; i++) {\n                TreeNode node = queue.poll();\n                level.add(node.val);\n                if (node.left != null) queue.offer(node.left);\n                if (node.right != null) queue.offer(node.right);\n            }\n            res.add(level);\n        }\n        return res;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        vector<vector<int>> res;\n        if (!root) return res;\n        queue<TreeNode*> q;\n        q.push(root);\n        while (!q.empty()) {\n            int size = q.size();\n            vector<int> level;\n            for (int i = 0; i < size; i++) {\n                TreeNode* node = q.front(); q.pop();\n                level.push_back(node->val);\n                if (node->left) q.push(node->left);\n                if (node->right) q.push(node->right);\n            }\n            res.push_back(level);\n        }\n        return res;\n    }\n};`,
      go: `func levelOrder(root *TreeNode) [][]int {\n    res := [][]int{}\n    if root == nil {\n        return res\n    }\n    queue := []*TreeNode{root}\n    for len(queue) > 0 {\n        size := len(queue)\n        level := []int{}\n        for i := 0; i < size; i++ {\n            node := queue[0]\n            queue = queue[1:]\n            level = append(level, node.Val)\n            if node.Left != nil { queue = append(queue, node.Left) }\n            if node.Right != nil { queue = append(queue, node.Right) }\n        }\n        res = append(res, level)\n    }\n    return res\n}`,
      rust: `impl Solution {\n    pub fn level_order(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<Vec<i32>> {\n        use std::collections::VecDeque;\n        let mut res = vec![];\n        if root.is_none() { return res; }\n        let mut queue = VecDeque::new();\n        queue.push_back(root.unwrap());\n        while !queue.is_empty() {\n            let size = queue.len();\n            let mut level = vec![];\n            for _ in 0..size {\n                let node = queue.pop_front().unwrap();\n                let node_ref = node.borrow();\n                level.push(node_ref.val);\n                if let Some(ref left) = node_ref.left { queue.push_back(left.clone()); }\n                if let Some(ref right) = node_ref.right { queue.push_back(right.clone()); }\n            }\n            res.push(level);\n        }\n        res\n    }\n}`,
      csharp: `public class Solution {\n    public IList<IList<int>> LevelOrder(TreeNode root) {\n        var res = new List<IList<int>>();\n        if (root == null) return res;\n        var queue = new Queue<TreeNode>();\n        queue.Enqueue(root);\n        while (queue.Count > 0) {\n            int size = queue.Count;\n            var level = new List<int>();\n            for (int i = 0; i < size; i++) {\n                var node = queue.Dequeue();\n                level.Add(node.val);\n                if (node.left != null) queue.Enqueue(node.left);\n                if (node.right != null) queue.Enqueue(node.right);\n            }\n            res.Add(level);\n        }\n        return res;\n    }\n}`,
      php: `class Solution {\n    function levelOrder($root) {\n        $res = [];\n        if ($root === null) return $res;\n        $queue = [$root];\n        while (count($queue) > 0) {\n            $size = count($queue);\n            $level = [];\n            for ($i = 0; $i < $size; $i++) {\n                $node = array_shift($queue);\n                $level[] = $node->val;\n                if ($node->left !== null) $queue[] = $node->left;\n                if ($node->right !== null) $queue[] = $node->right;\n            }\n            $res[] = $level;\n        }\n        return $res;\n    }\n}`,
      kotlin: `class Solution {\n    fun levelOrder(root: TreeNode?): List<List<Int>> {\n        val res = ArrayList<List<Int>>()\n        if (root == null) return res\n        val queue: Queue<TreeNode> = LinkedList()\n        queue.offer(root)\n        while (!queue.isEmpty()) {\n            val size = queue.size\n            val level = ArrayList<Int>()\n            for (i in 0 until size) {\n                val node = queue.poll()\n                level.add(node.val)\n                if (node.left != null) queue.offer(node.left)\n                if (node.right != null) queue.offer(node.right)\n            }\n            res.add(level)\n        }\n        return res\n    }\n}`,
      swift: `class Solution {\n    func levelOrder(_ root: TreeNode?) -> [[Int]] {\n        guard let root = root else { return [] }\n        var res = [[Int]]()\n        var queue = [root]\n        while !queue.isEmpty {\n            let size = queue.count\n            var level = [Int]()\n            for _ in 0..<size {\n                let node = queue.removeFirst()\n                level.append(node.val)\n                if let left = node.left { queue.append(left) }\n                if let right = node.right { queue.append(right) }\n            }\n            res.append(level)\n        }\n        return res\n    }\n}`
    }
  },
  {
    id: "coin-change",
    title: "322. Coin Change",
    official_function_name: "coinChange",
    difficulty: "Medium",
    master_category: "18. Dynamic Programming",
    sub_pattern: "Unbounded Knapsack",
    topic: ["dynamic-programming", "array"],
    company_tags: ["amazon", "google", "meta", "microsoft"],
    pattern_tags: ["dp", "unbounded-knapsack"],
    acceptance_rate: 43,
    time_complexity: "O(S * N)",
    space_complexity: "O(S)",
    description: `### Coin Change

You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the **fewest number of coins** that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.

### Input Format
- First line: An integer array \`coins\`
- Second line: An integer \`amount\`

### Output Format
- An integer representing the minimum coins required, or \`-1\`.

### Constraints
- \`1 <= coins.length <= 12\`
- \`1 <= coins[i] <= 2^31 - 1\`
- \`0 <= amount <= 10^4\`

### Notes
- Bottom-up Dynamic Programming array \`dp\` of size \`amount + 1\` initialized to \`amount + 1\`.`,
    examples: [
      { input: "coins = [1,2,5], amount = 11", output: "3", explanation: "11 = 5 + 5 + 1" },
      { input: "coins = [2], amount = 3", output: "-1" }
    ],
    testcases: generate23TestCases(
      { input: "[1, 2, 5]\n11", output: "3" },
      { input: "[2]\n3", output: "-1" },
      [
        { input: "[1]\n0", output: "0", category: "boundary" },
        { input: "[1, 2, 5]\n100", output: "20", category: "large_input" },
        { input: "[3, 7]\n14", output: "2", category: "normal" },
        { input: "[2, 5, 10, 1]\n27", output: "4", category: "normal" },
        { input: "[186, 419, 83, 408]\n6249", output: "20", category: "stress" },
        { input: "[1, 2147483647]\n2", output: "2", category: "overflow" },
        { input: "[5, 5, 5]\n15", output: "3", category: "duplicates" },
        { input: "[1]\n1", output: "1", category: "boundary" },
        { input: "[2]\n1", output: "-1", category: "corner" },
        { input: "[10, 20, 50]\n0", output: "0", category: "boundary" },
        { input: "[1, 5, 10, 25]\n30", output: "2", category: "normal" },
        { input: "[3, 5]\n7", output: "-1", category: "corner" },
        { input: "[4, 5]\n12", output: "3", category: "normal" },
        { input: "[1, 2, 3]\n6", output: "2", category: "normal" },
        { input: "[1, 3, 4, 5]\n7", output: "2", category: "normal" },
        { input: "[2, 4, 6]\n11", output: "-1", category: "corner" },
        { input: "[100, 200, 300]\n1000", output: "4", category: "large_input" },
        { input: "[1, 5, 10]\n99", output: "14", category: "normal" },
        { input: "[7, 14, 21]\n42", output: "2", category: "duplicates" },
        { input: "[1, 2, 5, 10, 20, 50]\n98", output: "7", category: "stress" },
        { input: "[9, 6, 5, 1]\n11", output: "2", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nfunction coinChange(coins, amount) {\n  const dp = new Array(amount + 1).fill(amount + 1);\n  dp[0] = 0;\n  for (let i = 1; i <= amount; i++) {\n    for (const c of coins) {\n      if (i - c >= 0) dp[i] = Math.min(dp[i], 1 + dp[i - c]);\n    }\n  }\n  return dp[amount] > amount ? -1 : dp[amount];\n}`,
      typescript: `function coinChange(coins: number[], amount: number): number {\n  const dp: number[] = new Array(amount + 1).fill(amount + 1);\n  dp[0] = 0;\n  for (let i = 1; i <= amount; i++) {\n    for (const c of coins) {\n      if (i - c >= 0) dp[i] = Math.min(dp[i], 1 + dp[i - c]);\n    }\n  }\n  return dp[amount] > amount ? -1 : dp[amount];\n}`,
      python: `class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        dp = [amount + 1] * (amount + 1)\n        dp[0] = 0\n        for i in range(1, amount + 1):\n            for c in coins:\n                if i - c >= 0:\n                    dp[i] = min(dp[i], 1 + dp[i - c])\n        return dp[amount] if dp[amount] != amount + 1 else -1`,
      java: `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        int[] dp = new int[amount + 1];\n        Arrays.fill(dp, amount + 1);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; i++) {\n            for (int c : coins) {\n                if (i - c >= 0) dp[i] = Math.min(dp[i], 1 + dp[i - c]);\n            }\n        }\n        return dp[amount] > amount ? -1 : dp[amount];\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        vector<int> dp(amount + 1, amount + 1);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; i++) {\n            for (int c : coins) {\n                if (i - c >= 0) dp[i] = min(dp[i], 1 + dp[i - c]);\n            }\n        }\n        return dp[amount] > amount ? -1 : dp[amount];\n    }\n};`,
      go: `func coinChange(coins []int, amount int) int {\n    dp := make([]int, amount + 1)\n    for i := 1; i <= amount; i++ {\n        dp[i] = amount + 1\n        for _, c := range coins {\n            if i - c >= 0 && dp[i-c] + 1 < dp[i] {\n                dp[i] = dp[i-c] + 1\n            }\n        }\n    }\n    if dp[amount] > amount { return -1 }\n    return dp[amount]\n}`,
      rust: `impl Solution {\n    pub fn coin_change(coins: Vec<i32>, amount: i32) -> i32 {\n        let amt = amount as usize;\n        let mut dp = vec![amt + 1; amt + 1];\n        dp[0] = 0;\n        for i in 1..=amt {\n            for &c in &coins {\n                let coin = c as usize;\n                if i >= coin && dp[i - coin] + 1 < dp[i] {\n                    dp[i] = dp[i - coin] + 1;\n                }\n            }\n        }\n        if dp[amt] > amt { -1 } else { dp[amt] as i32 }\n    }\n}`,
      csharp: `public class Solution {\n    public int CoinChange(int[] coins, int amount) {\n        int[] dp = new int[amount + 1];\n        Array.Fill(dp, amount + 1);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; i++) {\n            foreach (int c in coins) {\n                if (i - c >= 0) dp[i] = Math.Min(dp[i], 1 + dp[i - c]);\n            }\n        }\n        return dp[amount] > amount ? -1 : dp[amount];\n    }\n}`,
      php: `class Solution {\n    function coinChange($coins, $amount) {\n        $dp = array_fill(0, $amount + 1, $amount + 1);\n        $dp[0] = 0;\n        for ($i = 1; $i <= $amount; $i++) {\n            foreach ($coins as $c) {\n                if ($i - $c >= 0) $dp[$i] = min($dp[$i], 1 + $dp[$i - $c]);\n            }\n        }\n        return $dp[$amount] > $amount ? -1 : $dp[$amount];\n    }\n}`,
      kotlin: `class Solution {\n    fun coinChange(coins: IntArray, amount: Int): Int {\n        val dp = IntArray(amount + 1) { amount + 1 }\n        dp[0] = 0\n        for (i in 1..amount) {\n            for (c in coins) {\n                if (i - c >= 0) dp[i] = Math.min(dp[i], 1 + dp[i - c])\n            }\n        }\n        return if (dp[amount] > amount) -1 else dp[amount]\n    }\n}`,
      swift: `class Solution {\n    func coinChange(_ coins: [Int], _ amount: Int) -> Int {\n        var dp = Array(repeating: amount + 1, count: amount + 1)\n        dp[0] = 0\n        for i in 1...max(1, amount) where amount > 0 {\n            for c in coins {\n                if i - c >= 0 {\n                    dp[i] = min(dp[i], 1 + dp[i - c])\n                }\n            }\n        }\n        return amount == 0 ? 0 : (dp[amount] > amount ? -1 : dp[amount])\n    }\n}`
    }
  },
  {
    id: "longest-substring-without-repeating-characters",
    title: "3. Longest Substring Without Repeating Characters",
    official_function_name: "lengthOfLongestSubstring",
    difficulty: "Medium",
    master_category: "3. Sliding Window",
    sub_pattern: "Variable Window",
    topic: ["sliding-window", "strings", "hash-table"],
    company_tags: ["google", "amazon", "meta", "microsoft", "apple"],
    pattern_tags: ["sliding-window", "hash-table"],
    acceptance_rate: 34,
    time_complexity: "O(N)",
    space_complexity: "O(min(N, M))",
    description: `### Longest Substring Without Repeating Characters

Given a string \`s\`, find the length of the **longest substring** without repeating characters.

### Input Format
- A string \`s\`.

### Output Format
- An integer representing the length of the longest substring with unique characters.

### Constraints
- \`0 <= s.length <= 5 * 10^4\`
- \`s\` consists of English letters, digits, symbols and spaces.

### Notes
- Use a variable sliding window \`[left, right]\` and a HashSet/HashMap to track characters in the current window.`,
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' }
    ],
    testcases: generate23TestCases(
      { input: "abcabcbb", output: "3" },
      { input: "bbbbb", output: "1" },
      [
        { input: "", output: "0", category: "boundary" },
        { input: "pwwkew", output: "3", category: "normal" },
        { input: "a", output: "1", category: "boundary" },
        { input: "au", output: "2", category: "normal" },
        { input: "dvdf", output: "3", category: "corner" },
        { input: " ", output: "1", category: "corner" },
        { input: "abba", output: "2", category: "duplicates" },
        { input: "abcdefghijklmnopqrstuvwxyz", output: "26", category: "normal" },
        { input: "a1b2c3a1b2", output: "6", category: "normal" },
        { input: "!!!@@@###", output: "2", category: "duplicates" },
        { input: "abcdeafghij", output: "10", category: "large_input" },
        { input: "tmmzuxt", output: "5", category: "corner" },
        { input: "zzzzzzzzzzzzzzzz", output: "1", category: "duplicates" },
        { input: "01234567890123456789", output: "10", category: "stress" },
        { input: "abcbdefgh", output: "7", category: "normal" },
        { input: "aab", output: "2", category: "normal" },
        { input: "cdd", output: "2", category: "normal" },
        { input: "anviaj", output: "5", category: "normal" },
        { input: "ohvhjdml", output: "6", category: "random" },
        { input: "qrsvbspk", output: "5", category: "random" },
        { input: "bpfbhmipx", output: "7", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n  let maxLen = 0, left = 0;\n  const set = new Set();\n  for (let right = 0; right < s.length; right++) {\n    while (set.has(s[right])) {\n      set.delete(s[left]);\n      left++;\n    }\n    set.add(s[right]);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}`,
      typescript: `function lengthOfLongestSubstring(s: string): number {\n  let maxLen = 0, left = 0;\n  const set = new Set<string>();\n  for (let right = 0; right < s.length; right++) {\n    while (set.has(s[right])) {\n      set.delete(s[left]);\n      left++;\n    }\n    set.add(s[right]);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}`,
      python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        char_set = set()\n        l = 0\n        res = 0\n        for r in range(len(s)):\n            while s[r] in char_set:\n                char_set.remove(s[l])\n                l += 1\n            char_set.add(s[r])\n            res = max(res, r - l + 1)\n        return res`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        Set<Character> set = new HashSet<>();\n        int left = 0, maxLen = 0;\n        for (int right = 0; right < s.length(); right++) {\n            while (set.contains(s.charAt(right))) {\n                set.remove(s.charAt(left));\n                left++;\n            }\n            set.add(s.charAt(right));\n            maxLen = Math.max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        unordered_set<char> st;\n        int left = 0, maxLen = 0;\n        for (int right = 0; right < s.length(); right++) {\n            while (st.count(s[right])) {\n                st.erase(s[left]);\n                left++;\n            }\n            st.insert(s[right]);\n            maxLen = max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n};`,
      go: `func lengthOfLongestSubstring(s string) int {\n    mp := make(map[byte]bool)\n    left, maxLen := 0, 0\n    for right := 0; right < len(s); right++ {\n        for mp[s[right]] {\n            delete(mp, s[left])\n            left++\n        }\n        mp[s[right]] = true\n        if right - left + 1 > maxLen {\n            maxLen = right - left + 1\n        }\n    }\n    return maxLen\n}`,
      rust: `impl Solution {\n    pub fn length_of_longest_substring(s: String) -> i32 {\n        use std::collections::HashSet;\n        let mut set = HashSet::new();\n        let bytes = s.as_bytes();\n        let mut left = 0;\n        let mut max_len = 0;\n        for right in 0..bytes.len() {\n            while set.contains(&bytes[right]) {\n                set.remove(&bytes[left]);\n                left += 1;\n            }\n            set.insert(bytes[right]);\n            max_len = max_len.max(right - left + 1);\n        }\n        max_len as i32\n    }\n}`,
      csharp: `public class Solution {\n    public int LengthOfLongestSubstring(string s) {\n        var set = new HashSet<char>();\n        int left = 0, maxLen = 0;\n        for (int right = 0; right < s.Length; right++) {\n            while (set.Contains(s[right])) {\n                set.Remove(s[left]);\n                left++;\n            }\n            set.Add(s[right]);\n            maxLen = Math.Max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n}`,
      php: `class Solution {\n    function lengthOfLongestSubstring($s) {\n        $set = [];\n        $left = 0;\n        $maxLen = 0;\n        $len = strlen($s);\n        for ($right = 0; $right < $len; $right++) {\n            while (isset($set[$s[$right]])) {\n                unset($set[$s[$left]]);\n                $left++;\n            }\n            $set[$s[$right]] = true;\n            $maxLen = max($maxLen, $right - $left + 1);\n        }\n        return $maxLen;\n    }\n}`,
      kotlin: `class Solution {\n    fun lengthOfLongestSubstring(s: String): Int {\n        val set = HashSet<Char>()\n        var left = 0\n        var maxLen = 0\n        for (right in 0 until s.length) {\n            while (set.contains(s[right])) {\n                set.remove(s[left])\n                left++\n            }\n            set.add(s[right])\n            maxLen = Math.max(maxLen, right - left + 1)\n        }\n        return maxLen\n    }\n}`,
      swift: `class Solution {\n    func lengthOfLongestSubstring(_ s: String) -> Int {\n        var charSet = Set<Character>()\n        let chars = Array(s)\n        var left = 0\n        var maxLen = 0\n        for right in 0..<chars.count {\n            while charSet.contains(chars[right]) {\n                charSet.remove(chars[left])\n                left += 1\n            }\n            charSet.insert(chars[right])\n            maxLen = max(maxLen, right - left + 1)\n        }\n        return maxLen\n    }\n}`
    }
  },
  {
    id: "container-with-most-water",
    title: "11. Container With Most Water",
    official_function_name: "maxArea",
    difficulty: "Medium",
    master_category: "2. Two Pointer Patterns",
    sub_pattern: "Opposite Direction",
    topic: ["two-pointers", "arrays", "greedy"],
    company_tags: ["google", "amazon", "meta", "microsoft"],
    pattern_tags: ["two-pointers", "greedy"],
    acceptance_rate: 54,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    description: `### Container With Most Water

You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the **maximum amount of water** a container can store.

### Input Format
- An integer array \`height\`.

### Output Format
- An integer representing maximum area.

### Constraints
- \`n == height.length\`
- \`2 <= n <= 10^5\`
- \`0 <= height[i] <= 10^4\`

### Notes
- Two pointers: left at 0, right at n - 1. Always move the pointer with the smaller height.`,
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "The vertical lines are at indices 1 and 8, height min(8,7)=7, width 8-1=7, area 7*7=49." },
      { input: "height = [1,1]", output: "1" }
    ],
    testcases: generate23TestCases(
      { input: "[1, 8, 6, 2, 5, 4, 8, 3, 7]", output: "49" },
      { input: "[1, 1]", output: "1" },
      [
        { input: "[4, 3, 2, 1, 4]", output: "16", category: "normal" },
        { input: "[1, 2, 1]", output: "2", category: "boundary" },
        { input: "[2, 3, 4, 5, 18, 17, 6]", output: "17", category: "normal" },
        { input: "[1, 2, 4, 3]", output: "4", category: "normal" },
        { input: "[1, 8, 6, 2, 5, 4, 8, 25, 7]", output: "49", category: "normal" },
        { input: "[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]", output: "25", category: "normal" },
        { input: "[10000, 10000]", output: "10000", category: "large_input" },
        { input: "[0, 2]", output: "0", category: "corner" },
        { input: "[2, 0]", output: "0", category: "corner" },
        { input: "[1, 1, 1, 1, 1, 1, 1]", output: "6", category: "duplicates" },
        { input: "[1, 3, 2, 5, 25, 24, 5]", output: "24", category: "normal" },
        { input: "[5, 5, 5, 5, 5]", output: "20", category: "duplicates" },
        { input: "[3, 9, 3, 4, 7, 2, 12, 6]", output: "45", category: "normal" },
        { input: "[8, 10, 14, 0, 13, 10, 9, 9, 11, 11]", output: "80", category: "stress" },
        { input: "[2, 3, 10, 5, 7, 8, 9]", output: "36", category: "normal" },
        { input: "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]", output: "25", category: "normal" },
        { input: "[10, 14, 10, 4, 10, 2, 6, 1, 6, 12]", output: "90", category: "normal" },
        { input: "[100, 4, 200, 1, 100]", output: "400", category: "large_input" },
        { input: "[1, 2, 3, 4, 5, 25, 24, 3, 4]", output: "24", category: "normal" },
        { input: "[6, 9, 3, 4, 5, 8]", output: "30", category: "random" },
        { input: "[1, 5, 4, 3]", output: "6", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {number[]} height\n * @return {number}\n */\nfunction maxArea(height) {\n  let left = 0, right = height.length - 1;\n  let maxWater = 0;\n  while (left < right) {\n    const w = right - left;\n    const h = Math.min(height[left], height[right]);\n    maxWater = Math.max(maxWater, w * h);\n    if (height[left] < height[right]) left++;\n    else right--;\n  }\n  return maxWater;\n}`,
      typescript: `function maxArea(height: number[]): number {\n  let left = 0, right = height.length - 1;\n  let maxWater = 0;\n  while (left < right) {\n    const w = right - left;\n    const h = Math.min(height[left], height[right]);\n    maxWater = Math.max(maxWater, w * h);\n    if (height[left] < height[right]) left++;\n    else right--;\n  }\n  return maxWater;\n}`,
      python: `class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        left, right = 0, len(height) - 1\n        max_water = 0\n        while left < right:\n            w = right - left\n            h = min(height[left], height[right])\n            max_water = max(max_water, w * h)\n            if height[left] < height[right]:\n                left += 1\n            else:\n                right -= 1\n        return max_water`,
      java: `class Solution {\n    public int maxArea(int[] height) {\n        int left = 0, right = height.length - 1;\n        int maxWater = 0;\n        while (left < right) {\n            int w = right - left;\n            int h = Math.min(height[left], height[right]);\n            maxWater = Math.max(maxWater, w * h);\n            if (height[left] < height[right]) left++;\n            else right--;\n        }\n        return maxWater;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        int left = 0, right = height.size() - 1;\n        int maxWater = 0;\n        while (left < right) {\n            int w = right - left;\n            int h = min(height[left], height[right]);\n            maxWater = max(maxWater, w * h);\n            if (height[left] < height[right]) left++;\n            else right--;\n        }\n        return maxWater;\n    }\n};`,
      go: `func maxArea(height []int) int {\n    left, right := 0, len(height) - 1\n    maxWater := 0\n    for left < right {\n        w := right - left\n        h := height[left]\n        if height[right] < h { h = height[right] }\n        if w * h > maxWater { maxWater = w * h }\n        if height[left] < height[right] { left++ } else { right-- }\n    }\n    return maxWater\n}`,
      rust: `impl Solution {\n    pub fn max_area(height: Vec<i32>) -> i32 {\n        let (mut left, mut right) = (0, height.len() - 1);\n        let mut max_water = 0;\n        while left < right {\n            let w = (right - left) as i32;\n            let h = height[left].min(height[right]);\n            max_water = max_water.max(w * h);\n            if height[left] < height[right] { left += 1; } else { right -= 1; }\n        }\n        max_water\n    }\n}`,
      csharp: `public class Solution {\n    public int MaxArea(int[] height) {\n        int left = 0, right = height.Length - 1;\n        int maxWater = 0;\n        while (left < right) {\n            int w = right - left;\n            int h = Math.Min(height[left], height[right]);\n            maxWater = Math.Max(maxWater, w * h);\n            if (height[left] < height[right]) left++;\n            else right--;\n        }\n        return maxWater;\n    }\n}`,
      php: `class Solution {\n    function maxArea($height) {\n        $left = 0;\n        $right = count($height) - 1;\n        $maxWater = 0;\n        while ($left < $right) {\n            $w = $right - $left;\n            $h = min($height[$left], $height[$right]);\n            $maxWater = max($maxWater, $w * $h);\n            if ($height[$left] < $height[$right]) $left++;\n            else $right--;\n        }\n        return $maxWater;\n    }\n}`,
      kotlin: `class Solution {\n    fun maxArea(height: IntArray): Int {\n        var left = 0\n        var right = height.size - 1\n        var maxWater = 0\n        while (left < right) {\n            val w = right - left\n            val h = Math.min(height[left], height[right])\n            maxWater = Math.max(maxWater, w * h)\n            if (height[left] < height[right]) left++ else right--\n        }\n        return maxWater\n    }\n}`,
      swift: `class Solution {\n    func maxArea(_ height: [Int]) -> Int {\n        var left = 0\n        var right = height.count - 1\n        var maxWater = 0\n        while left < right {\n            let w = right - left\n            let h = min(height[left], height[right])\n            maxWater = max(maxWater, w * h)\n            if height[left] < height[right] { left += 1 } else { right -= 1 }\n        }\n        return maxWater\n    }\n}`
    }
  },
  {
    id: "merge-intervals",
    title: "56. Merge Intervals",
    official_function_name: "merge",
    difficulty: "Medium",
    master_category: "11. Intervals",
    sub_pattern: "Overlap Merging",
    topic: ["intervals", "sorting", "array"],
    company_tags: ["google", "amazon", "meta", "microsoft", "apple"],
    pattern_tags: ["intervals", "sorting"],
    acceptance_rate: 47,
    time_complexity: "O(N log N)",
    space_complexity: "O(N)",
    description: `### Merge Intervals

Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

### Input Format
- A 2D integer array \`intervals\`.

### Output Format
- A 2D integer array of merged non-overlapping intervals.

### Constraints
- \`1 <= intervals.length <= 10^4\`
- \`intervals[i].length == 2\`
- \`0 <= start_i <= end_i <= 10^4\`

### Notes
- Sort intervals by their start time first: \`O(N log N)\`.`,
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]." },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" }
    ],
    testcases: generate23TestCases(
      { input: "[[1, 3], [2, 6], [8, 10], [15, 18]]", output: "[[1, 6], [8, 10], [15, 18]]" },
      { input: "[[1, 4], [4, 5]]", output: "[[1, 5]]" },
      [
        { input: "[[1, 4], [0, 4]]", output: "[[0, 4]]", category: "normal" },
        { input: "[[1, 4], [2, 3]]", output: "[[1, 4]]", category: "normal" },
        { input: "[[1, 10], [2, 3], [4, 5], [6, 7], [8, 9]]", output: "[[1, 10]]", category: "stress" },
        { input: "[[1, 2]]", output: "[[1, 2]]", category: "boundary" },
        { input: "[[1, 4], [5, 6]]", output: "[[1, 4], [5, 6]]", category: "normal" },
        { input: "[[0, 0], [1, 2], [5, 5], [2, 4], [3, 3], [5, 6], [5, 6], [4, 6], [0, 0], [1, 2]]", output: "[[0, 0], [1, 6]]", category: "duplicates" },
        { input: "[[2, 3], [4, 5], [6, 7], [8, 9], [1, 10]]", output: "[[1, 10]]", category: "stress" },
        { input: "[[1, 3], [0, 2], [2, 3], [4, 6], [4, 5], [5, 5], [0, 2], [3, 3]]", output: "[[0, 3], [4, 6]]", category: "duplicates" },
        { input: "[[1, 4], [0, 0]]", output: "[[0, 0], [1, 4]]", category: "corner" },
        { input: "[[2, 3], [2, 2], [3, 3], [1, 3], [5, 7], [2, 2], [4, 6]]", output: "[[1, 3], [4, 7]]", category: "duplicates" },
        { input: "[[0, 10000]]", output: "[[0, 10000]]", category: "large_input" },
        { input: "[[1, 5], [2, 3], [3, 4], [4, 5]]", output: "[[1, 5]]", category: "normal" },
        { input: "[[5, 8], [1, 3], [2, 4], [9, 10]]", output: "[[1, 4], [5, 8], [9, 10]]", category: "normal" },
        { input: "[[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]", output: "[[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]", category: "normal" },
        { input: "[[1, 1], [2, 2], [3, 3]]", output: "[[1, 1], [2, 2], [3, 3]]", category: "boundary" },
        { input: "[[10, 20], [15, 25], [22, 30]]", output: "[[10, 30]]", category: "normal" },
        { input: "[[1, 100], [50, 150], [120, 200]]", output: "[[1, 200]]", category: "large_input" },
        { input: "[[0, 1], [1, 2], [2, 3], [3, 4]]", output: "[[0, 4]]", category: "normal" },
        { input: "[[1, 4], [0, 2], [3, 5]]", output: "[[0, 5]]", category: "normal" },
        { input: "[[3, 5], [0, 0], [4, 4], [0, 2], [5, 6], [4, 5], [3, 5], [1, 3], [4, 6], [4, 6]]", output: "[[0, 6]]", category: "stress" },
        { input: "[[1, 4], [2, 5], [7, 9]]", output: "[[1, 5], [7, 9]]", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction merge(intervals) {\n  if (intervals.length <= 1) return intervals;\n  intervals.sort((a, b) => a[0] - b[0]);\n  const res = [intervals[0]];\n  for (let i = 1; i < intervals.length; i++) {\n    const prev = res[res.length - 1];\n    const curr = intervals[i];\n    if (curr[0] <= prev[1]) {\n      prev[1] = Math.max(prev[1], curr[1]);\n    } else {\n      res.push(curr);\n    }\n  }\n  return res;\n}`,
      typescript: `function merge(intervals: number[][]): number[][] {\n  if (intervals.length <= 1) return intervals;\n  intervals.sort((a, b) => a[0] - b[0]);\n  const res: number[][] = [intervals[0]];\n  for (let i = 1; i < intervals.length; i++) {\n    const prev = res[res.length - 1];\n    const curr = intervals[i];\n    if (curr[0] <= prev[1]) {\n      prev[1] = Math.max(prev[1], curr[1]);\n    } else {\n      res.push(curr);\n    }\n  }\n  return res;\n}`,
      python: `class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        intervals.sort(key=lambda x: x[0])\n        merged = []\n        for interval in intervals:\n            if not merged or merged[-1][1] < interval[0]:\n                merged.append(interval)\n            else:\n                merged[-1][1] = max(merged[-1][1], interval[1])\n        return merged`,
      java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        if (intervals.length <= 1) return intervals;\n        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));\n        List<int[]> res = new ArrayList<>();\n        int[] current = intervals[0];\n        res.add(current);\n        for (int[] interval : intervals) {\n            if (interval[0] <= current[1]) {\n                current[1] = Math.max(current[1], interval[1]);\n            } else {\n                current = interval;\n                res.add(current);\n            }\n        }\n        return res.toArray(new int[res.size()][]);\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        if (intervals.empty()) return {};\n        sort(intervals.begin(), intervals.end());\n        vector<vector<int>> res;\n        res.push_back(intervals[0]);\n        for (int i = 1; i < intervals.size(); i++) {\n            if (intervals[i][0] <= res.back()[1]) {\n                res.back()[1] = max(res.back()[1], intervals[i][1]);\n            } else {\n                res.push_back(intervals[i]);\n            }\n        }\n        return res;\n    }\n};`,
      go: `func merge(intervals [][]int) [][]int {\n    if len(intervals) <= 1 { return intervals }\n    sort.Slice(intervals, func(i, j int) bool {\n        return intervals[i][0] < intervals[j][0]\n    })\n    res := [][]int{intervals[0]}\n    for i := 1; i < len(intervals); i++ {\n        prev := res[len(res)-1]\n        if intervals[i][0] <= prev[1] {\n            if intervals[i][1] > prev[1] { prev[1] = intervals[i][1] }\n        } else {\n            res = append(res, intervals[i])\n        }\n    }\n    return res\n}`,
      rust: `impl Solution {\n    pub fn merge(mut intervals: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n        intervals.sort_unstable_by_key(|i| i[0]);\n        let mut res: Vec<Vec<i32>> = Vec::new();\n        for interval in intervals {\n            if let Some(last) = res.last_mut() {\n                if interval[0] <= last[1] {\n                    last[1] = last[1].max(interval[1]);\n                    continue;\n                }\n            }\n            res.push(interval);\n        }\n        res\n    }\n}`,
      csharp: `public class Solution {\n    public int[][] Merge(int[][] intervals) {\n        if (intervals.Length <= 1) return intervals;\n        Array.Sort(intervals, (a, b) => a[0].CompareTo(b[0]));\n        var res = new List<int[]>();\n        int[] current = intervals[0];\n        res.Add(current);\n        foreach (var interval in intervals) {\n            if (interval[0] <= current[1]) {\n                current[1] = Math.Max(current[1], interval[1]);\n            } else {\n                current = interval;\n                res.Add(current);\n            }\n        }\n        return res.ToArray();\n    }\n}`,
      php: `class Solution {\n    function merge($intervals) {\n        usort($intervals, function($a, $b) { return $a[0] <=> $b[0]; });\n        $res = [];\n        foreach ($intervals as $interval) {\n            $cnt = count($res);\n            if ($cnt == 0 || $res[$cnt - 1][1] < $interval[0]) {\n                $res[] = $interval;\n            } else {\n                $res[$cnt - 1][1] = max($res[$cnt - 1][1], $interval[1]);\n            }\n        }\n        return $res;\n    }\n}`,
      kotlin: `class Solution {\n    fun merge(intervals: Array<IntArray>): Array<IntArray> {\n        if (intervals.size <= 1) return intervals\n        intervals.sortBy { it[0] }\n        val res = ArrayList<IntArray>()\n        var current = intervals[0]\n        res.add(current)\n        for (interval in intervals) {\n            if (interval[0] <= current[1]) {\n                current[1] = Math.max(current[1], interval[1])\n            } else {\n                current = interval\n                res.add(current)\n            }\n        }\n        return res.toTypedArray()\n    }\n}`,
      swift: `class Solution {\n    func merge(_ intervals: [[Int]]) -> [[Int]] {\n        guard intervals.count > 1 else { return intervals }\n        let sorted = intervals.sorted { $0[0] < $1[0] }\n        var res = [[Int]]()\n        var current = sorted[0]\n        for interval in sorted[1...] {\n            if interval[0] <= current[1] {\n                current[1] = max(current[1], interval[1])\n            } else {\n                res.append(current)\n                current = interval\n            }\n        }\n        res.append(current)\n        return res\n    }\n}`
    }
  },
  {
    id: "valid-parentheses",
    title: "20. Valid Parentheses",
    official_function_name: "isValid",
    difficulty: "Easy",
    master_category: "10. Stack",
    sub_pattern: "Parentheses Matching",
    topic: ["stack", "strings"],
    company_tags: ["google", "amazon", "meta", "microsoft", "apple"],
    pattern_tags: ["stack", "parentheses"],
    acceptance_rate: 41,
    time_complexity: "O(N)",
    space_complexity: "O(N)",
    description: `### Valid Parentheses

Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Input Format
- A string \`s\`.

### Output Format
- A boolean \`true\` or \`false\`.

### Constraints
- \`1 <= s.length <= 10^4\`
- \`s\` consists of parentheses only \`'()[]{}'\`.

### Notes
- Push open brackets onto a Stack. When seeing a closing bracket, pop and verify type match.`,
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" }
    ],
    testcases: generate23TestCases(
      { input: "()", output: "true" },
      { input: "()[]{}", output: "true" },
      [
        { input: "(]", output: "false", category: "normal" },
        { input: "([{}])", output: "true", category: "normal" },
        { input: "{[]}", output: "true", category: "normal" },
        { input: "(((", output: "false", category: "boundary" },
        { input: ")))", output: "false", category: "boundary" },
        { input: "([)]", output: "false", category: "corner" },
        { input: "{[()()]}", output: "true", category: "normal" },
        { input: "(((((((((())))))))))", output: "true", category: "stress" },
        { input: "(((((((((()))))))))]", output: "false", category: "corner" },
        { input: "()()()()()()()()", output: "true", category: "normal" },
        { input: "][", output: "false", category: "boundary" },
        { input: "({[({[({[]})]})]})", output: "true", category: "stress" },
        { input: "[([]])", output: "false", category: "corner" },
        { input: "{}()[]", output: "true", category: "normal" },
        { input: "[", output: "false", category: "boundary" },
        { input: "]", output: "false", category: "boundary" },
        { input: "(()())", output: "true", category: "normal" },
        { input: "(()(()))", output: "true", category: "normal" },
        { input: "((()))", output: "true", category: "normal" },
        { input: "[{()}]", output: "true", category: "normal" },
        { input: "{}[{}]", output: "true", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (const ch of s) {\n    if (map[ch]) {\n      if (stack.pop() !== map[ch]) return false;\n    } else {\n      stack.push(ch);\n    }\n  }\n  return stack.length === 0;\n}`,
      typescript: `function isValid(s: string): boolean {\n  const stack: string[] = [];\n  const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };\n  for (const ch of s) {\n    if (map[ch]) {\n      if (stack.pop() !== map[ch]) return false;\n    } else {\n      stack.push(ch);\n    }\n  }\n  return stack.length === 0;\n}`,
      python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        stack = []\n        mapping = {")": "(", "}": "{", "]": "["}\n        for char in s:\n            if char in mapping:\n                top_element = stack.pop() if stack else '#'\n                if mapping[char] != top_element:\n                    return False\n            else:\n                stack.append(char)\n        return not stack`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(') stack.push(')');\n            else if (c == '{') stack.push('}');\n            else if (c == '[') stack.push(']');\n            else if (stack.isEmpty() || stack.pop() != c) return false;\n        }\n        return stack.isEmpty();\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        stack<char> st;\n        for (char c : s) {\n            if (c == '(' || c == '{' || c == '[') st.push(c);\n            else {\n                if (st.empty()) return false;\n                if (c == ')' && st.top() != '(') return false;\n                if (c == '}' && st.top() != '{') return false;\n                if (c == ']' && st.top() != '[') return false;\n                st.pop();\n            }\n        }\n        return st.empty();\n    }\n};`,
      go: `func isValid(s string) bool {\n    stack := []rune{}\n    for _, ch := range s {\n        if ch == '(' || ch == '{' || ch == '[' {\n            stack = append(stack, ch)\n        } else {\n            if len(stack) == 0 { return false }\n            top := stack[len(stack)-1]\n            stack = stack[:len(stack)-1]\n            if ch == ')' && top != '(' { return false }\n            if ch == '}' && top != '{' { return false }\n            if ch == ']' && top != '[' { return false }\n        }\n    }\n    return len(stack) == 0\n}`,
      rust: `impl Solution {\n    pub fn is_valid(s: String) -> bool {\n        let mut stack = Vec::new();\n        for ch in s.chars() {\n            match ch {\n                '(' => stack.push(')'),\n                '{' => stack.push('}'),\n                '[' => stack.push(']'),\n                ')' | '}' | ']' => if stack.pop() != Some(ch) { return false; },\n                _ => ()\n            }\n        }\n        stack.is_empty()\n    }\n}`,
      csharp: `public class Solution {\n    public bool IsValid(string s) {\n        var stack = new Stack<char>();\n        foreach (char c in s) {\n            if (c == '(') stack.Push(')');\n            else if (c == '{') stack.Push('}');\n            else if (c == '[') stack.Push(']');\n            else if (stack.Count == 0 || stack.Pop() != c) return false;\n        }\n        return stack.Count == 0;\n    }\n}`,
      php: `class Solution {\n    function isValid($s) {\n        $stack = [];\n        $len = strlen($s);\n        for ($i = 0; $i < $len; $i++) {\n            $c = $s[$i];\n            if ($c == '(') $stack[] = ')';\n            elseif ($c == '{') $stack[] = '}';\n            elseif ($c == '[') $stack[] = ']';\n            elseif (empty($stack) || array_pop($stack) != $c) return false;\n        }\n        return empty($stack);\n    }\n}`,
      kotlin: `class Solution {\n    fun isValid(s: String): Boolean {\n        val stack = ArrayDeque<Char>()\n        for (c in s) {\n            when (c) {\n                '(' -> stack.addLast(')')\n                '{' -> stack.addLast('}')\n                '[' -> stack.addLast(']')\n                else -> if (stack.isEmpty() || stack.removeLast() != c) return false\n            }\n        }\n        return stack.isEmpty()\n    }\n}`,
      swift: `class Solution {\n    func isValid(_ s: String) -> Bool {\n        var stack = [Character]()\n        for ch in s {\n            if ch == "(" { stack.append(")") }\n            else if ch == "{" { stack.append("}") }\n            else if ch == "[" { stack.append("]") }\n            else { if stack.isEmpty || stack.removeLast() != ch { return false } }\n        }\n        return stack.isEmpty\n    }\n}`
    }
  },
  {
    id: "course-schedule",
    title: "207. Course Schedule",
    official_function_name: "canFinish",
    difficulty: "Medium",
    master_category: "17. Graph",
    sub_pattern: "Topological Sort",
    topic: ["graph", "bfs", "dfs", "topological-sort"],
    company_tags: ["amazon", "google", "meta", "microsoft", "uber"],
    pattern_tags: ["graph", "topological-sort"],
    acceptance_rate: 46,
    time_complexity: "O(V + E)",
    space_complexity: "O(V + E)",
    description: `### Course Schedule

There are a total of \`numCourses\` courses you have to take, labeled from \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [ai, bi]\` indicates that you must take course \`bi\` first if you want to take course \`ai\`.

Return \`true\` if you can finish all courses. Otherwise, return \`false\`.

### Input Format
- First line: Integer \`numCourses\`.
- Second line: 2D array \`prerequisites\`.

### Output Format
- A boolean \`true\` or \`false\`.

### Constraints
- \`1 <= numCourses <= 2000\`
- \`0 <= prerequisites.length <= 5000\`
- \`prerequisites[i].length == 2\`
- \`0 <= ai, bi < numCourses\`
- All prerequisite pairs are **unique**.

### Notes
- Cycle detection in a directed graph. Solvable via Kahn's BFS Topological Sort (indegrees) or DFS cycle detection.`,
    examples: [
      { input: "numCourses = 2, prerequisites = [[1,0]]", output: "true", explanation: "To take course 1 you should have finished course 0." },
      { input: "numCourses = 2, prerequisites = [[1,0],[0,1]]", output: "false", explanation: "Cycle detected between course 0 and 1." }
    ],
    testcases: generate23TestCases(
      { input: "2\n[[1, 0]]", output: "true" },
      { input: "2\n[[1, 0], [0, 1]]", output: "false" },
      [
        { input: "1\n[]", output: "true", category: "boundary" },
        { input: "3\n[[1, 0], [2, 1]]", output: "true", category: "normal" },
        { input: "3\n[[1, 0], [2, 1], [0, 2]]", output: "false", category: "normal" },
        { input: "4\n[[1, 0], [2, 0], [3, 1], [3, 2]]", output: "true", category: "normal" },
        { input: "4\n[[1, 0], [2, 1], [3, 2], [1, 3]]", output: "false", category: "corner" },
        { input: "5\n[]", output: "true", category: "boundary" },
        { input: "5\n[[1, 4], [2, 4], [3, 1], [3, 2]]", output: "true", category: "normal" },
        { input: "3\n[[1, 0], [1, 2], [0, 1]]", output: "false", category: "corner" },
        { input: "6\n[[1, 0], [2, 1], [3, 2], [4, 3], [5, 4]]", output: "true", category: "normal" },
        { input: "6\n[[1, 0], [2, 1], [3, 2], [4, 3], [5, 4], [0, 5]]", output: "false", category: "stress" },
        { input: "100\n[[1, 0], [2, 1], [3, 2]]", output: "true", category: "large_input" },
        { input: "4\n[[0, 1], [3, 1], [1, 3], [3, 2]]", output: "false", category: "normal" },
        { input: "3\n[[0, 1], [0, 2], [1, 2]]", output: "true", category: "normal" },
        { input: "5\n[[0, 1], [1, 2], [2, 3], [3, 4], [4, 2]]", output: "false", category: "corner" },
        { input: "2\n[]", output: "true", category: "boundary" },
        { input: "7\n[[1, 0], [2, 1], [3, 2], [4, 5], [5, 6]]", output: "true", category: "normal" },
        { input: "8\n[[1, 0], [2, 1], [3, 2], [4, 5], [5, 6], [6, 4]]", output: "false", category: "normal" },
        { input: "10\n[[1, 0], [2, 0], [3, 1], [4, 2], [5, 3], [6, 4], [7, 5], [8, 6], [9, 7]]", output: "true", category: "stress" },
        { input: "3\n[[1, 0]]", output: "true", category: "normal" },
        { input: "4\n[[1, 0], [2, 1], [3, 2]]", output: "true", category: "normal" },
        { input: "4\n[[0, 1], [2, 3]]", output: "true", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {number} numCourses\n * @param {number[][]} prerequisites\n * @return {boolean}\n */\nfunction canFinish(numCourses, prerequisites) {\n  const adj = Array.from({ length: numCourses }, () => []);\n  const inDegree = new Array(numCourses).fill(0);\n  for (const [v, u] of prerequisites) {\n    adj[u].push(v);\n    inDegree[v]++;\n  }\n  const queue = [];\n  for (let i = 0; i < numCourses; i++) {\n    if (inDegree[i] === 0) queue.push(i);\n  }\n  let count = 0;\n  while (queue.length > 0) {\n    const u = queue.shift();\n    count++;\n    for (const v of adj[u]) {\n      inDegree[v]--;\n      if (inDegree[v] === 0) queue.push(v);\n    }\n  }\n  return count === numCourses;\n}`,
      typescript: `function canFinish(numCourses: number, prerequisites: number[][]): boolean {\n  const adj: number[][] = Array.from({ length: numCourses }, () => []);\n  const inDegree: number[] = new Array(numCourses).fill(0);\n  for (const [v, u] of prerequisites) {\n    adj[u].push(v);\n    inDegree[v]++;\n  }\n  const queue: number[] = [];\n  for (let i = 0; i < numCourses; i++) {\n    if (inDegree[i] === 0) queue.push(i);\n  }\n  let count = 0;\n  while (queue.length > 0) {\n    const u = queue.shift()!;\n    count++;\n    for (const v of adj[u]) {\n      inDegree[v]--;\n      if (inDegree[v] === 0) queue.push(v);\n    }\n  }\n  return count === numCourses;\n}`,
      python: `class Solution:\n    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:\n        adj = [[] for _ in range(numCourses)]\n        in_degree = [0] * numCourses\n        for v, u in prerequisites:\n            adj[u].append(v)\n            in_degree[v] += 1\n        queue = collections.deque([i for i in range(numCourses) if in_degree[i] == 0])\n        count = 0\n        while queue:\n            u = queue.popleft()\n            count += 1\n            for v in adj[u]:\n                in_degree[v] -= 1\n                if in_degree[v] == 0:\n                    queue.append(v)\n        return count == numCourses`,
      java: `class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());\n        int[] inDegree = new int[numCourses];\n        for (int[] p : prerequisites) {\n            adj.get(p[1]).add(p[0]);\n            inDegree[p[0]]++;\n        }\n        Queue<Integer> queue = new LinkedList<>();\n        for (int i = 0; i < numCourses; i++) {\n            if (inDegree[i] == 0) queue.offer(i);\n        }\n        int count = 0;\n        while (!queue.isEmpty()) {\n            int u = queue.poll();\n            count++;\n            for (int v : adj.get(u)) {\n                inDegree[v]--;\n                if (inDegree[v] == 0) queue.offer(v);\n            }\n        }\n        return count == numCourses;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        vector<vector<int>> adj(numCourses);\n        vector<int> inDegree(numCourses, 0);\n        for (auto& p : prerequisites) {\n            adj[p[1]].push_back(p[0]);\n            inDegree[p[0]]++;\n        }\n        queue<int> q;\n        for (int i = 0; i < numCourses; i++) {\n            if (inDegree[i] == 0) q.push(i);\n        }\n        int count = 0;\n        while (!q.empty()) {\n            int u = q.front(); q.pop();\n            count++;\n            for (int v : adj[u]) {\n                inDegree[v]--;\n                if (inDegree[v] == 0) q.push(v);\n            }\n        }\n        return count == numCourses;\n    }\n};`,
      go: `func canFinish(numCourses int, prerequisites [][]int) bool {\n    adj := make([][]int, numCourses)\n    inDegree := make([]int, numCourses)\n    for _, p := range prerequisites {\n        adj[p[1]] = append(adj[p[1]], p[0])\n        inDegree[p[0]]++\n    }\n    queue := []int{}\n    for i := 0; i < numCourses; i++ {\n        if inDegree[i] == 0 { queue = append(queue, i) }\n    }\n    count := 0\n    for len(queue) > 0 {\n        u := queue[0]; queue = queue[1:]\n        count++\n        for _, v := range adj[u] {\n            inDegree[v]--\n            if inDegree[v] == 0 { queue = append(queue, v) }\n        }\n    }\n    return count == numCourses\n}`,
      rust: `impl Solution {\n    pub fn can_finish(num_courses: i32, prerequisites: Vec<Vec<i32>>) -> bool {\n        let n = num_courses as usize;\n        let mut adj = vec![vec![]; n];\n        let mut in_deg = vec![0; n];\n        for p in prerequisites {\n            adj[p[1] as usize].push(p[0] as usize);\n            in_deg[p[0] as usize] += 1;\n        }\n        let mut queue = std::collections::VecDeque::new();\n        for i in 0..n {\n            if in_deg[i] == 0 { queue.push_back(i); }\n        }\n        let mut count = 0;\n        while let Some(u) = queue.pop_front() {\n            count += 1;\n            for &v in &adj[u] {\n                in_deg[v] -= 1;\n                if in_deg[v] == 0 { queue.push_back(v); }\n            }\n        }\n        count == n\n    }\n}`,
      csharp: `public class Solution {\n    public bool CanFinish(int numCourses, int[][] prerequisites) {\n        var adj = new List<int>[numCourses];\n        for (int i = 0; i < numCourses; i++) adj[i] = new List<int>();\n        int[] inDegree = new int[numCourses];\n        foreach (var p in prerequisites) {\n            adj[p[1]].Add(p[0]);\n            inDegree[p[0]]++;\n        }\n        var queue = new Queue<int>();\n        for (int i = 0; i < numCourses; i++) {\n            if (inDegree[i] == 0) queue.Enqueue(i);\n        }\n        int count = 0;\n        while (queue.Count > 0) {\n            int u = queue.Dequeue();\n            count++;\n            foreach (int v in adj[u]) {\n                inDegree[v]--;\n                if (inDegree[v] == 0) queue.Enqueue(v);\n            }\n        }\n        return count == numCourses;\n    }\n}`,
      php: `class Solution {\n    function canFinish($numCourses, $prerequisites) {\n        $adj = array_fill(0, $numCourses, []);\n        $inDegree = array_fill(0, $numCourses, 0);\n        foreach ($prerequisites as $p) {\n            $adj[$p[1]][] = $p[0];\n            $inDegree[$p[0]]++;\n        }\n        $queue = [];\n        for ($i = 0; $i < $numCourses; $i++) {\n            if ($inDegree[$i] == 0) $queue[] = $i;\n        }\n        $count = 0;\n        while (count($queue) > 0) {\n            $u = array_shift($queue);\n            $count++;\n            foreach ($adj[$u] as $v) {\n                $inDegree[$v]--;\n                if ($inDegree[$v] == 0) $queue[] = $v;\n            }\n        }\n        return $count == $numCourses;\n    }\n}`,
      kotlin: `class Solution {\n    fun canFinish(numCourses: Int, prerequisites: Array<IntArray>): Boolean {\n        val adj = Array(numCourses) { ArrayList<Int>() }\n        val inDegree = IntArray(numCourses)\n        for (p in prerequisites) {\n            adj[p[1]].add(p[0])\n            inDegree[p[0]]++\n        }\n        val queue: Queue<Int> = LinkedList()\n        for (i in 0 until numCourses) {\n            if (inDegree[i] == 0) queue.offer(i)\n        }\n        var count = 0\n        while (!queue.isEmpty()) {\n            val u = queue.poll()\n            count++\n            for (v in adj[u]) {\n                inDegree[v]--\n                if (inDegree[v] == 0) queue.offer(v)\n            }\n        }\n        return count == numCourses\n    }\n}`,
      swift: `class Solution {\n    func canFinish(_ numCourses: Int, _ prerequisites: [[Int]]) -> Bool {\n        var adj = Array(repeating: [Int](), count: numCourses)\n        var inDegree = Array(repeating: 0, count: numCourses)\n        for p in prerequisites {\n            adj[p[1]].append(p[0])\n            inDegree[p[0]] += 1\n        }\n        var queue = [Int]()\n        for i in 0..<numCourses {\n            if inDegree[i] == 0 { queue.append(i) }\n        }\n        var count = 0\n        while !queue.isEmpty {\n            let u = queue.removeFirst()\n            count += 1\n            for v in adj[u] {\n                inDegree[v] -= 1\n                if inDegree[v] == 0 { queue.append(v) }\n            }\n        }\n        return count == numCourses\n    }\n}`
    }
  },
  {
    id: "number-of-islands",
    title: "200. Number of Islands",
    official_function_name: "numIslands",
    difficulty: "Medium",
    master_category: "17. Graph",
    sub_pattern: "Flood Fill",
    topic: ["graph", "bfs", "dfs", "matrix"],
    company_tags: ["amazon", "google", "meta", "microsoft", "bloomberg"],
    pattern_tags: ["graph", "flood-fill", "matrix"],
    acceptance_rate: 59,
    time_complexity: "O(M * N)",
    space_complexity: "O(M * N)",
    description: `### Number of Islands

Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

### Input Format
- An \`m x n\` character array \`grid\` of \`'0'\` and \`'1'\`.

### Output Format
- An integer representing the number of islands.

### Constraints
- \`m == grid.length\`
- \`n == grid[i].length\`
- \`1 <= m, n <= 300\`
- \`grid[i][j]\` is \`'0'\` or \`'1'\`.

### Notes
- Traverse grid. When encountering \`'1'\`, increment island count and initiate BFS/DFS flood fill to mark all connected \`'1'\`s as visited (\`'0'\`).`,
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1" },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: "3" }
    ],
    testcases: generate23TestCases(
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1" },
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: "3" },
      [
        { input: '[["0"]]', output: "0", category: "boundary" },
        { input: '[["1"]]', output: "1", category: "boundary" },
        { input: '[["1","0"],["0","1"]]', output: "2", category: "normal" },
        { input: '[["1","1","1"],["0","1","0"],["1","1","1"]]', output: "1", category: "normal" },
        { input: '[["1","0","1"],["0","1","0"],["1","0","1"]]', output: "5", category: "corner" },
        { input: '[["0","0","0"],["0","0","0"]]', output: "0", category: "boundary" },
        { input: '[["1","1","1"],["1","1","1"]]', output: "1", category: "normal" },
        { input: '[["1","0","0","0"],["0","1","0","0"],["0","0","1","0"],["0","0","0","1"]]', output: "4", category: "normal" },
        { input: '[["1","1","0","0"],["0","1","1","0"],["0","0","1","1"]]', output: "1", category: "normal" },
        { input: '[["1","0","1","0"],["0","1","0","1"],["1","0","1","0"],["0","1","0","1"]]', output: "8", category: "stress" },
        { input: '[["1","1","1","0","0"],["1","0","1","0","1"],["1","1","1","0","1"]]', output: "2", category: "normal" },
        { input: '[["0","1","0"],["1","0","1"],["0","1","0"]]', output: "4", category: "corner" },
        { input: '[["1","1","0","1","1"],["1","1","0","1","1"]]', output: "2", category: "normal" },
        { input: '[["1","0","1","0","1"]]', output: "3", category: "boundary" },
        { input: '[["1"],["0"],["1"],["0"],["1"]]', output: "3", category: "boundary" },
        { input: '[["1","1"],["1","1"],["0","0"],["1","1"]]', output: "2", category: "normal" },
        { input: '[["0","0","0","0","1"]]', output: "1", category: "normal" },
        { input: '[["1","0","0","0","0"]]', output: "1", category: "normal" },
        { input: '[["0","1","1","1","0"],["0","1","0","1","0"],["0","1","1","1","0"]]', output: "1", category: "stress" },
        { input: '[["1","0","1","0","0","0"],["1","0","1","1","1","0"],["0","0","0","0","0","0"]]', output: "2", category: "large_input" },
        { input: '[["1","1","0"],["0","0","1"],["1","0","1"]]', output: "3", category: "random" }
      ]
    ),
    starter_code: {
      javascript: `/**\n * @param {character[][]} grid\n * @return {number}\n */\nfunction numIslands(grid) {\n  if (!grid || grid.length === 0) return 0;\n  const m = grid.length, n = grid[0].length;\n  let count = 0;\n  const dfs = (r, c) => {\n    if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] === '0') return;\n    grid[r][c] = '0';\n    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);\n  };\n  for (let i = 0; i < m; i++) {\n    for (let j = 0; j < n; j++) {\n      if (grid[i][j] === '1') {\n        count++;\n        dfs(i, j);\n      }\n    }\n  }\n  return count;\n}`,
      typescript: `function numIslands(grid: string[][]): number {\n  if (!grid || grid.length === 0) return 0;\n  const m = grid.length, n = grid[0].length;\n  let count = 0;\n  const dfs = (r: number, c: number) => {\n    if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] === '0') return;\n    grid[r][c] = '0';\n    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);\n  };\n  for (let i = 0; i < m; i++) {\n    for (let j = 0; j < n; j++) {\n      if (grid[i][j] === '1') {\n        count++;\n        dfs(i, j);\n      }\n    }\n  }\n  return count;\n}`,
      python: `class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        if not grid:\n            return 0\n        m, n = len(grid), len(grid[0])\n        count = 0\n        def dfs(r, c):\n            if r < 0 or c < 0 or r >= m or c >= n or grid[r][c] == '0':\n                return\n            grid[r][c] = '0'\n            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)\n        for i in range(m):\n            for j in range(n):\n                if grid[i][j] == '1':\n                    count += 1\n                    dfs(i, j)\n        return count`,
      java: `class Solution {\n    public int numIslands(char[][] grid) {\n        if (grid == null || grid.length == 0) return 0;\n        int m = grid.length, n = grid[0].length, count = 0;\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < n; j++) {\n                if (grid[i][j] == '1') {\n                    count++;\n                    dfs(grid, i, j, m, n);\n                }\n            }\n        }\n        return count;\n    }\n    private void dfs(char[][] grid, int r, int c, int m, int n) {\n        if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] == '0') return;\n        grid[r][c] = '0';\n        dfs(grid, r + 1, c, m, n); dfs(grid, r - 1, c, m, n); dfs(grid, r, c + 1, m, n); dfs(grid, r, c - 1, m, n);\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        if (grid.empty()) return 0;\n        int m = grid.size(), n = grid[0].size(), count = 0;\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < n; j++) {\n                if (grid[i][j] == '1') {\n                    count++;\n                    dfs(grid, i, j, m, n);\n                }\n            }\n        }\n        return count;\n    }\nprivate:\n    void dfs(vector<vector<char>>& grid, int r, int c, int m, int n) {\n        if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] == '0') return;\n        grid[r][c] = '0';\n        dfs(grid, r + 1, c, m, n); dfs(grid, r - 1, c, m, n); dfs(grid, r, c + 1, m, n); dfs(grid, r, c - 1, m, n);\n    }\n};`,
      go: `func numIslands(grid [][]byte) int {\n    if len(grid) == 0 { return 0 }\n    m, n := len(grid), len(grid[0])\n    count := 0\n    var dfs func(r, c int)\n    dfs = func(r, c int) {\n        if r < 0 || c < 0 || r >= m || c >= n || grid[r][c] == '0' { return }\n        grid[r][c] = '0'\n        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)\n    }\n    for i := 0; i < m; i++ {\n        for j := 0; j < n; j++ {\n            if grid[i][j] == '1' {\n                count++\n                dfs(i, j)\n            }\n        }\n    }\n    return count\n}`,
      rust: `impl Solution {\n    pub fn num_islands(mut grid: Vec<Vec<char>>) -> i32 {\n        if grid.is_empty() { return 0; }\n        let (m, n) = (grid.len(), grid[0].len());\n        let mut count = 0;\n        fn dfs(grid: &mut Vec<Vec<char>>, r: i32, c: i32, m: i32, n: i32) {\n            if r < 0 || c < 0 || r >= m || c >= n || grid[r as usize][c as usize] == '0' { return; }\n            grid[r as usize][c as usize] = '0';\n            dfs(grid, r + 1, c, m, n); dfs(grid, r - 1, c, m, n); dfs(grid, r, c + 1, m, n); dfs(grid, r, c - 1, m, n);\n        }\n        for i in 0..m {\n            for j in 0..n {\n                if grid[i][j] == '1' {\n                    count += 1;\n                    dfs(&mut grid, i as i32, j as i32, m as i32, n as i32);\n                }\n            }\n        }\n        count\n    }\n}`,
      csharp: `public class Solution {\n    public int NumIslands(char[][] grid) {\n        if (grid == null || grid.Length == 0) return 0;\n        int m = grid.Length, n = grid[0].Length, count = 0;\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < n; j++) {\n                if (grid[i][j] == '1') {\n                    count++;\n                    Dfs(grid, i, j, m, n);\n                }\n            }\n        }\n        return count;\n    }\n    private void Dfs(char[][] grid, int r, int c, int m, int n) {\n        if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] == '0') return;\n        grid[r][c] = '0';\n        Dfs(grid, r + 1, c, m, n); Dfs(grid, r - 1, c, m, n); Dfs(grid, r, c + 1, m, n); Dfs(grid, r, c - 1, m, n);\n    }\n}`,
      php: `class Solution {\n    function numIslands(&$grid) {\n        if (empty($grid)) return 0;\n        $m = count($grid);\n        $n = count($grid[0]);\n        $count = 0;\n        for ($i = 0; $i < $m; $i++) {\n            for ($j = 0; $j < $n; $j++) {\n                if ($grid[$i][$j] === '1') {\n                    $count++;\n                    $this->dfs($grid, $i, $j, $m, $n);\n                }\n            }\n        }\n        return $count;\n    }\n    private function dfs(&$grid, $r, $c, $m, $n) {\n        if ($r < 0 || $c < 0 || $r >= $m || $c >= $n || $grid[$r][$c] === '0') return;\n        $grid[$r][$c] = '0';\n        $this->dfs($grid, $r + 1, $c, $m, $n);\n        $this->dfs($grid, $r - 1, $c, $m, $n);\n        $this->dfs($grid, $r, $c + 1, $m, $n);\n        $this->dfs($grid, $r, $c - 1, $m, $n);\n    }\n}`,
      kotlin: `class Solution {\n    fun numIslands(grid: Array<CharArray>): Int {\n        if (grid.isEmpty()) return 0\n        val m = grid.size\n        val n = grid[0].size\n        var count = 0\n        fun dfs(r: Int, c: Int) {\n            if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] == '0') return\n            grid[r][c] = '0'\n            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)\n        }\n        for (i in 0 until m) {\n            for (j in 0 until n) {\n                if (grid[i][j] == '1') {\n                    count++\n                    dfs(i, j)\n                }\n            }\n        }\n        return count\n    }\n}`,
      swift: `class Solution {\n    func numIslands(_ grid: [[Character]]) -> Int {\n        guard !grid.isEmpty else { return 0 }\n        var grid = grid\n        let m = grid.count\n        let n = grid[0].count\n        var count = 0\n        func dfs(_ r: Int, _ c: Int) {\n            if r < 0 || c < 0 || r >= m || c >= n || grid[r][c] == "0" { return }\n            grid[r][c] = "0"\n            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)\n        }\n        for i in 0..<m {\n            for j in 0..<n {\n                if grid[i][j] == "1" {\n                    count += 1\n                    dfs(i, j)\n                }\n            }\n        }\n        return count\n    }\n}`
    }
  }
];

export function getCanonicalProblemByTitleOrId(titleOrId: string): CanonicalLeetCodeProblem | null {
  const norm = titleOrId.toLowerCase().replace(/[^a-z0-9]/g, "");
  return OFFICIAL_LEETCODE_CATALOG.find(p => {
    const pIdNorm = p.id.toLowerCase().replace(/[^a-z0-9]/g, "");
    const pTitleNorm = p.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    const pFnNorm = p.official_function_name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return norm.includes(pIdNorm) || norm.includes(pTitleNorm) || norm.includes(pFnNorm) || pTitleNorm.includes(norm);
  }) || null;
}
