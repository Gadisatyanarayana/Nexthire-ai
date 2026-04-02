import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { STARTER_CODE } from "@/lib/codingQuestions";

type SeedQuestion = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string[];
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  testcases: Array<{ input: string; expectedOutput: string }>;
};

const PROJECT_SEED_QUESTIONS: SeedQuestion[] = [
  {
    id: "two-sum-project-seed",
    title: "Two Sum",
    difficulty: "Easy",
    topic: ["array", "hash-map"],
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }],
    testcases: [{ input: "nums = [2,7,11,15], target = 9", expectedOutput: "[0,1]" }],
  },
  {
    id: "valid-parentheses-project-seed",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: ["stack", "string"],
    description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [{ input: "s = ()[]{}", output: "true" }],
    testcases: [{ input: "s = ()[]{}", expectedOutput: "true" }],
  },
  {
    id: "binary-search-project-seed",
    title: "Binary Search",
    difficulty: "Easy",
    topic: ["array", "binary-search"],
    description: "Given a sorted array and a target value, return the index if target is found, else return -1.",
    examples: [{ input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" }],
    testcases: [{ input: "nums = [-1,0,3,5,9,12], target = 9", expectedOutput: "4" }],
  },
  {
    id: "merge-intervals-project-seed",
    title: "Merge Intervals",
    difficulty: "Medium",
    topic: ["array", "sorting"],
    description: "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals.",
    examples: [{ input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" }],
    testcases: [{ input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]" }],
  },
  {
    id: "longest-substring-without-repeating-project-seed",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: ["string", "sliding-window"],
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [{ input: "s = abcabcbb", output: "3" }],
    testcases: [{ input: "s = abcabcbb", expectedOutput: "3" }],
  },
  {
    id: "kth-largest-element-project-seed",
    title: "Kth Largest Element in an Array",
    difficulty: "Medium",
    topic: ["array", "heap"],
    description: "Given an integer array nums and an integer k, return the k-th largest element in the array.",
    examples: [{ input: "nums = [3,2,1,5,6,4], k = 2", output: "5" }],
    testcases: [{ input: "nums = [3,2,1,5,6,4], k = 2", expectedOutput: "5" }],
  },
  {
    id: "word-break-project-seed",
    title: "Word Break",
    difficulty: "Medium",
    topic: ["dynamic-programming", "string"],
    description: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a sequence of dictionary words.",
    examples: [{ input: "s = leetcode, wordDict = [leet,code]", output: "true" }],
    testcases: [{ input: "s = leetcode, wordDict = [leet,code]", expectedOutput: "true" }],
  },
  {
    id: "lowest-common-ancestor-bst-project-seed",
    title: "Lowest Common Ancestor of a BST",
    difficulty: "Medium",
    topic: ["tree", "binary-search-tree"],
    description: "Given a BST, find the lowest common ancestor node of two given nodes in the BST.",
    examples: [{ input: "root = [6,2,8,0,4,7,9], p = 2, q = 8", output: "6" }],
    testcases: [{ input: "root = [6,2,8,0,4,7,9], p = 2, q = 8", expectedOutput: "6" }],
  },
  {
    id: "edit-distance-project-seed",
    title: "Edit Distance",
    difficulty: "Hard",
    topic: ["dynamic-programming", "string"],
    description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.",
    examples: [{ input: "word1 = horse, word2 = ros", output: "3" }],
    testcases: [{ input: "word1 = horse, word2 = ros", expectedOutput: "3" }],
  },
  {
    id: "trapping-rain-water-project-seed",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    topic: ["array", "two-pointers"],
    description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap.",
    examples: [{ input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" }],
    testcases: [{ input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6" }],
  },
];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = PROJECT_SEED_QUESTIONS.map((q) => ({
      id: q.id,
      title: q.title,
      difficulty: q.difficulty,
      function_name: "solve",
      input_type: "auto",
      output_type: "auto",
      topic: q.topic,
      company_tags: [],
      pattern_tags: [],
      acceptance_rate: 0,
      description: q.description,
      examples: q.examples,
      testcases: q.testcases,
      starter_code: {
        cpp: STARTER_CODE.cpp,
        java: STARTER_CODE.java,
        python: STARTER_CODE.python,
      },
    }));

    const { error } = await supabase.from("questions").upsert(payload, { onConflict: "id" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, seeded: payload.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to seed questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
