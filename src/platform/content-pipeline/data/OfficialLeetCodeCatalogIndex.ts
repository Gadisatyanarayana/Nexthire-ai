import { OFFICIAL_LEETCODE_CATALOG, CanonicalLeetCodeProblem } from "./OfficialLeetCodeCatalog";
import { OFFICIAL_LEETCODE_CATALOG_PART2 } from "./OfficialLeetCodeCatalogPart2";
import { OFFICIAL_LEETCODE_CATALOG_PART3 } from "./OfficialLeetCodeCatalogPart3";

export const ALL_OFFICIAL_LEETCODE_PROBLEMS: CanonicalLeetCodeProblem[] = [
  ...OFFICIAL_LEETCODE_CATALOG,
  ...OFFICIAL_LEETCODE_CATALOG_PART2,
  ...OFFICIAL_LEETCODE_CATALOG_PART3
];

/**
 * Searches the official LeetCode catalog by matching normalized ID, Title, or official function name.
 */
export function matchCanonicalLeetCodeProblem(titleOrId: string): CanonicalLeetCodeProblem | null {
  if (!titleOrId) return null;
  const norm = titleOrId.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ALL_OFFICIAL_LEETCODE_PROBLEMS.find(p => {
    const pIdNorm = p.id.toLowerCase().replace(/[^a-z0-9]/g, "");
    const pTitleNorm = p.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    const pFnNorm = p.official_function_name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return norm.includes(pIdNorm) || norm.includes(pTitleNorm) || norm.includes(pFnNorm) || pTitleNorm.includes(norm) || pIdNorm.includes(norm);
  }) || null;
}

/**
 * Returns true if the function name is an official LeetCode function name in our catalog.
 */
export function isOfficialLeetCodeFunctionName(fnName: string): boolean {
  return ALL_OFFICIAL_LEETCODE_PROBLEMS.some(p => p.official_function_name === fnName);
}
