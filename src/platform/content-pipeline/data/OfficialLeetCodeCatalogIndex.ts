import { CanonicalLeetCodeProblem } from "./OfficialLeetCodeCatalog";
import { CATALOG_6902_LEETCODE_PROBLEMS } from "./Official4000Catalog";

export { type CanonicalLeetCodeProblem } from "./OfficialLeetCodeCatalog";

export const ALL_OFFICIAL_LEETCODE_PROBLEMS: CanonicalLeetCodeProblem[] = CATALOG_6902_LEETCODE_PROBLEMS;

/**
 * Searches the official LeetCode catalog across all 6,902 problems by matching normalized ID, Title, Slug, or official function name.
 */
export function matchCanonicalLeetCodeProblem(titleOrId: string): CanonicalLeetCodeProblem | null {
  if (!titleOrId) return null;
  const norm = String(titleOrId).toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // Direct match first
  const direct = ALL_OFFICIAL_LEETCODE_PROBLEMS.find(p => {
    const pIdNorm = p.id.toLowerCase().replace(/[^a-z0-9]/g, "");
    return pIdNorm === norm || p.id.toLowerCase() === titleOrId.toLowerCase();
  });
  if (direct) return direct;

  // Title / function name match
  return ALL_OFFICIAL_LEETCODE_PROBLEMS.find(p => {
    const pIdNorm = p.id.toLowerCase().replace(/[^a-z0-9]/g, "");
    const pTitleNorm = p.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    const pFnNorm = (p.official_function_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return norm.includes(pIdNorm) || norm.includes(pTitleNorm) || norm.includes(pFnNorm) || pTitleNorm.includes(norm) || pIdNorm.includes(norm);
  }) || null;
}

/**
 * Returns true if the function name is an official LeetCode function name in our catalog.
 */
export function isOfficialLeetCodeFunctionName(fnName: string): boolean {
  return ALL_OFFICIAL_LEETCODE_PROBLEMS.some(p => p.official_function_name === fnName);
}
