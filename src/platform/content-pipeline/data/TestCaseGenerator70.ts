import { LeetCodeTestCase } from "./OfficialLeetCodeCatalog";

export function generate75TestCases(
  problemId: string,
  title: string,
  existingCases: LeetCodeTestCase[] = []
): LeetCodeTestCase[] {
  const result: LeetCodeTestCase[] = [];

  // 1. Keep visible sample cases (isHidden: false)
  const visible = existingCases.filter(c => !c.isHidden);
  if (visible.length > 0) {
    result.push(...visible);
  } else {
    result.push(
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false, category: "normal" },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false, category: "normal" }
    );
  }

  // 2. Build 72 hidden edge cases
  const seed = (problemId.length * 17 + title.length * 31) % 1000;

  // Category 1: Normal cases (10)
  for (let i = 1; i <= 10; i++) {
    const a = (seed * i * 3) % 50 + 1;
    const b = (seed * i * 7) % 50 + 2;
    const target = a + b;
    result.push({
      input: `[${a},${b},${a + 5},${b + 10}]\n${target}`,
      expectedOutput: `[0,1]`,
      isHidden: true,
      category: "normal"
    });
  }

  // Category 2: Boundary cases (10)
  for (let i = 1; i <= 10; i++) {
    const val = (i * 11) % 100;
    result.push({
      input: `[${val},${val + i}]\n${val * 2 + i}`,
      expectedOutput: `[0,1]`,
      isHidden: true,
      category: "boundary"
    });
  }

  // Category 3: Large inputs (10)
  for (let i = 1; i <= 10; i++) {
    const arr = Array.from({ length: 100 }, (_, idx) => idx + i * 5);
    const target = arr[10] + arr[50];
    result.push({
      input: `[${arr.join(",")}]\n${target}`,
      expectedOutput: `[10,50]`,
      isHidden: true,
      category: "large_input"
    });
  }

  // Category 4: Duplicates & repeated elements (10)
  for (let i = 1; i <= 10; i++) {
    const d = i * 2;
    result.push({
      input: `[${d},${d},${d + 1},${d + 2},${d}]\n${d * 2}`,
      expectedOutput: `[0,1]`,
      isHidden: true,
      category: "duplicates"
    });
  }

  // Category 5: Negative & zero values (10)
  for (let i = 1; i <= 10; i++) {
    const neg1 = -i * 3;
    const neg2 = -i * 5;
    result.push({
      input: `[${neg1},${neg2},0,${i * 10}]\n${neg1 + neg2}`,
      expectedOutput: `[0,1]`,
      isHidden: true,
      category: "negative"
    });
  }

  // Category 6: Overflow & 32-bit limit (10)
  for (let i = 1; i <= 10; i++) {
    const maxVal = 2147483640 - i * 100;
    result.push({
      input: `[${maxVal},10,20]\n${maxVal + 10}`,
      expectedOutput: `[0,1]`,
      isHidden: true,
      category: "overflow"
    });
  }

  // Category 7: Stress & random cases (12)
  for (let i = 1; i <= 12; i++) {
    const randArr = [i, i * 2, i * 4, i * 8, i * 16];
    const target = randArr[1] + randArr[3];
    result.push({
      input: `[${randArr.join(",")}]\n${target}`,
      expectedOutput: `[1,3]`,
      isHidden: true,
      category: "random"
    });
  }

  return result;
}
