export const DSA_SECTIONS = [
  {
    id: "arrays",
    label: "Arrays",
    keywords: ["array", "prefix-sum", "difference-array", "simulation"],
  },
  {
    id: "strings",
    label: "Strings",
    keywords: ["string", "palindrome", "kmp", "z-function", "rolling-hash"],
  },
  {
    id: "hashing",
    label: "Hashing",
    keywords: ["hash-table", "hashmap", "hash-set", "frequency", "counting"],
  },
  {
    id: "two-pointers",
    label: "Two Pointers",
    keywords: ["two-pointers", "sliding-window", "window", "partition"],
  },
  {
    id: "linked-list",
    label: "Linked List",
    keywords: ["linked-list", "fast-slow-pointers"],
  },
  {
    id: "stack-queue",
    label: "Stack & Queue",
    keywords: ["stack", "queue", "monotonic-stack", "monotonic-queue", "deque"],
  },
  {
    id: "binary-search",
    label: "Binary Search",
    keywords: ["binary-search", "search", "lower-bound", "upper-bound"],
  },
  {
    id: "greedy",
    label: "Greedy",
    keywords: ["greedy", "interval", "scheduling"],
  },
  {
    id: "recursion-backtracking",
    label: "Recursion & Backtracking",
    keywords: ["recursion", "backtracking", "subset", "permutation", "combination"],
  },
  {
    id: "trees",
    label: "Trees",
    keywords: ["tree", "binary-tree", "bst", "lca", "segment-tree", "fenwick"],
  },
  {
    id: "graphs",
    label: "Graphs",
    keywords: ["graph", "dfs", "bfs", "topological-sort", "shortest-path", "union-find", "disjoint-set"],
  },
  {
    id: "heaps",
    label: "Heaps",
    keywords: ["heap", "priority-queue"],
  },
  {
    id: "dp",
    label: "Dynamic Programming",
    keywords: ["dynamic-programming", "dp", "memoization", "tabulation"],
  },
  {
    id: "bit-manipulation",
    label: "Bit Manipulation",
    keywords: ["bit-manipulation", "bitmask", "xor"],
  },
  {
    id: "math",
    label: "Math",
    keywords: ["math", "number-theory", "combinatorics", "geometry"],
  },
] as const;

export type DsaSectionId = (typeof DSA_SECTIONS)[number]["id"];

export function inferDsaSection(topics: string[], title?: string): string {
  if (Array.isArray(topics) && topics.length > 0) {
    const topicSet = new Set(topics.map(t => t.toLowerCase()));
    
    if (topicSet.has("binary-search")) return "binary-search";
    if (topicSet.has("dfs") || topicSet.has("depth-first-search")) return "graphs";
    if (topicSet.has("bfs") || topicSet.has("breadth-first-search")) return "graphs";
    if (topicSet.has("sliding-window")) return "two-pointers";
    if (topicSet.has("two-pointers")) return "two-pointers";
    if (topicSet.has("dynamic-programming") || topicSet.has("dp")) return "dp";
    if (topicSet.has("greedy")) return "greedy";
    if (topicSet.has("backtracking")) return "recursion-backtracking";
    if (topicSet.has("recursion")) return "recursion-backtracking";
    if (topicSet.has("stack") || topicSet.has("queue") || topicSet.has("monotonic-stack")) return "stack-queue";
    if (topicSet.has("linked-list")) return "linked-list";
    if (topicSet.has("tree") || topicSet.has("binary-tree") || topicSet.has("bst")) return "trees";
    if (topicSet.has("heap") || topicSet.has("priority-queue")) return "heaps";
    if (topicSet.has("hash-table") || topicSet.has("hashmap") || topicSet.has("hash-set")) return "hashing";
    if (topicSet.has("bit-manipulation")) return "bit-manipulation";
    if (topicSet.has("math")) return "math";
    if (topicSet.has("array") || topicSet.has("arrays")) return "arrays";
    if (topicSet.has("string") || topicSet.has("strings")) return "strings";
  }

  const haystack = [
    ...(Array.isArray(topics) ? topics : []),
    String(title || ""),
  ]
    .join(" ")
    .toLowerCase();

  for (const section of DSA_SECTIONS) {
    if (section.keywords.some((k) => haystack.includes(k.toLowerCase()))) {
      return section.id;
    }
  }

  return "core-dsa";
}

export function sectionLabel(sectionId: string): string {
  const found = DSA_SECTIONS.find((s) => s.id === sectionId);
  return found ? found.label : "Core DSA";
}
