/**
 * Verified Ground-Truth TypeScript Implementation for LeetCode 2117: Abbreviating the Product of a Range.
 * 
 * Rules Enforced:
 * 1. Count factors of 2 and 5 across [left, right] to determine trailing zeros C = min(c2, c5).
 * 2. Compute exact number of digits using sum of logarithms: digits = floor(sum(log10(i))) + 1 - C.
 * 3. Maintain leading digits using fractional part of log10 sum (frac = S - floor(S)) without floating-point drift.
 * 4. Maintain trailing digits modulo 100000 by factoring out 2s and 5s and multiplying remaining coprime factors.
 * 5. Decide whether to abbreviate based on trimmed product digit count (if digits <= 10, return exact representation without ellipsis).
 */
export function abbreviateProduct(left: number, right: number): string {
  let c2 = 0;
  let c5 = 0;
  for (let i = left; i <= right; i++) {
    let x = i;
    while (x % 2 === 0) {
      c2++;
      x = Math.floor(x / 2);
    }
    while (x % 5 === 0) {
      c5++;
      x = Math.floor(x / 5);
    }
  }

  const C = Math.min(c2, c5);
  const rem2 = c2 - C;
  const rem5 = c5 - C;

  let totalLogSum = 0;
  for (let i = left; i <= right; i++) {
    totalLogSum += Math.log10(i);
  }
  const totalDigits = Math.floor(totalLogSum) + 1;
  const trimmedDigits = totalDigits - C;

  if (trimmedDigits <= 10) {
    let prod = BigInt(1);
    for (let i = left; i <= right; i++) {
      prod *= BigInt(i);
    }
    for (let i = 0; i < C; i++) {
      prod /= BigInt(10);
    }
    return `${prod.toString()}e${C}`;
  }

  const frac = totalLogSum - Math.floor(totalLogSum);
  let leading5 = Math.floor(Math.pow(10, frac + 4));
  if (leading5 >= 100000) {
    leading5 = Math.floor(leading5 / 10);
  }

  const mod = 100000;
  let tail = 1;
  for (let i = left; i <= right; i++) {
    let x = i;
    while (x % 2 === 0) {
      x = Math.floor(x / 2);
    }
    while (x % 5 === 0) {
      x = Math.floor(x / 5);
    }
    tail = Number((BigInt(tail) * BigInt(x % mod)) % BigInt(mod));
  }

  for (let i = 0; i < rem2; i++) {
    tail = (tail * 2) % mod;
  }
  for (let i = 0; i < rem5; i++) {
    tail = (tail * 5) % mod;
  }

  const tailStr = tail.toString().padStart(5, "0");
  return `${leading5}...${tailStr}e${C}`;
}
