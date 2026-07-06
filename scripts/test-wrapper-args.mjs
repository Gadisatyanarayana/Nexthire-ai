// Simple test to verify wrapper code generation logic
// This tests the core functions without needing database access

// Mock the wrapper-critical functions
function normalizeRawValue(val) {
  return typeof val === 'string' ? val.trim() : String(val);
}

function quoteIfString(val) {
  return `"${val.replace(/"/g, '\\"')}"`;
}

function toJavaArg(rawInput, declaredType, paramDecl) {
  const raw = normalizeRawValue(rawInput);
  const typeHint = (declaredType || paramDecl || '').toLowerCase().trim();

  // If we have no type hints, just quote it as a string
  if (!typeHint) return quoteIfString(raw);

  const javaArrayLiteral = (ctor) => `${ctor}${raw.replace(/\[/g, '{').replace(/\]/g, '}')}`;

  // Exact type matching (order matters - check broader patterns first)
  if (typeHint.includes('int[][]') && raw.startsWith('[')) return javaArrayLiteral('new int[][]');
  if (typeHint.includes('int[]') && raw.startsWith('[')) return javaArrayLiteral('new int[]');
  if (typeHint.includes('long[][]') && raw.startsWith('[')) return javaArrayLiteral('new long[][]');
  if (typeHint.includes('long[]') && raw.startsWith('[')) return javaArrayLiteral('new long[]');
  if (typeHint.includes('double[][]') && raw.startsWith('[')) return javaArrayLiteral('new double[][]');
  if (typeHint.includes('double[]') && raw.startsWith('[')) return javaArrayLiteral('new double[]');
  if (typeHint.includes('boolean[][]') && raw.startsWith('[')) return javaArrayLiteral('new boolean[][]');
  if (typeHint.includes('boolean[]') && raw.startsWith('[')) return javaArrayLiteral('new boolean[]');
  if (typeHint.includes('string[][]') && raw.startsWith('[')) return javaArrayLiteral('new String[][]');
  if (typeHint.includes('string[]') && raw.startsWith('[')) return javaArrayLiteral('new String[]');

  // Scalars
  if (typeHint.includes('boolean')) return /^(true|false)$/i.test(raw) ? raw.toLowerCase() : 'false';
  if (typeHint.includes('char')) return !raw.startsWith("'") ? `'${raw.replace(/'/g, "\\'")}'` : raw;
  if (typeHint.includes('double') || typeHint.includes('float')) {
    const num = Number(raw);
    return Number.isFinite(num) ? String(num) : '0.0';
  }
  if (typeHint.includes('long')) {
    const num = Number(raw);
    return Number.isFinite(num) ? String(Math.floor(num)) : '0';
  }
  if (typeHint.includes('int')) {
    const num = Number(raw);
    return Number.isFinite(num) ? String(Math.floor(num)) : '0';
  }
  if (typeHint.includes('string')) return quoteIfString(raw);

  return quoteIfString(raw);
}

// Test cases
console.log('=== toJavaArg Test Suite ===\n');

const testCases = [
  ['5', 'int', undefined, '5', 'int scalar (no suffix)'],
  ['3.14', 'double', undefined, '3.14', 'double scalar (no suffix)'],
  ['[1,2,3]', 'int[]', undefined, 'new int[]{1,2,3}', 'int array'],
  ['hello', 'String', undefined, '"hello"', 'string'],
  ['true', 'boolean', undefined, 'true', 'boolean true'],
  ['false', 'boolean', undefined, 'false', 'boolean false'],
  ['42', undefined, undefined, '"42"', 'unknown type defaults to quoted string'],
];

let passed = 0, failed = 0;

testCases.forEach(testCase => {
  const [input, declaredType, paramDecl, expected, desc] = testCase;
  const result = toJavaArg(input, declaredType, paramDecl);
  if (result === expected) {
    console.log(`✅ ${desc}: "${result}"`);
    passed++;
  } else {
    console.log(`❌ ${desc}: got "${result}", expected "${expected}"`);
    failed++;
  }
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed === 0) {
  console.log('✅ All wrapper code tests passed!');
} else {
  console.log(`⚠️  ${failed} test(s) failed - wrapper may need adjustment`);
}
