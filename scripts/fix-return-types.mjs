import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

function readDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, 'utf8');
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    out[key] = val;
  }
  return out;
}

function loadEnv() {
  const root = process.cwd();
  const local = readDotEnvFile(path.join(root, '.env.local'));
  const example = readDotEnvFile(path.join(root, '.env.example'));
  return { ...example, ...local, ...process.env };
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map common wrong outputs to correct ones based on function name patterns
const typeOverridePatterns = [
  {
    namePattern: /^(is|has|contains|valid|check|found)/i,
    correctOutputType: 'boolean',
    description: 'is/has/check prefix suggests boolean output'
  },
  {
    namePattern: /^count/i,
    correctOutputType: 'int',
    description: 'count functions return int'
  },
  {
    namePattern: /find|search|index/i,
    correctOutputType: 'int',
    description: 'find/search/index typically return int (index)'
  },
  {
    namePattern: /sort|compare/i,
    correctOutputType: 'int[]',
    description: 'sort/compare usually return int[]'
  },
  {
    namePattern: /merge|concat|combine|build|construct/i,
    correctOutputType: 'String',
    description: 'merge/build/construct usually return String'
  }
];

async function fixReturnTypes() {
  console.log('Fetching all questions to identify return type issues...');
  
  const { data: questions, error: fetchError } = await supabase
    .from('questions')
    .select('id, title, function_name, output_type, starter_code')
    .limit(5000);

  if (fetchError) {
    console.error('Failed to fetch questions:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${questions.length} questions`);

  const updates = [];

  for (const q of questions) {
    if (!q.output_type || q.output_type.toLowerCase() === 'auto' || !q.function_name) {
      continue;
    }

    const funcName = q.function_name.toLowerCase();
    const currentType = String(q.output_type || '').toLowerCase().trim();
    
    // Detect common patterns and suggest fixes
    for (const pattern of typeOverridePatterns) {
      if (pattern.namePattern.test(funcName)) {
        const suggestedType = pattern.correctOutputType;
        
        // Only update if the current type seems wrong
        if (currentType !== suggestedType.toLowerCase() && 
            !currentType.match(/^(string|int|boolean|double|long|float)/i)) {
          console.log(`   [FIX] ${q.title} (${q.function_name}): ${currentType || 'undefined'} → ${suggestedType}`);
          console.log(`         Reason: ${pattern.description}`);
          
          updates.push({
            id: q.id,
            output_type: suggestedType,
            reason: pattern.description
          });
          break;
        }
      }
    }
  }

  if (updates.length === 0) {
    console.log('No return type mismatches detected.');
    return;
  }

  console.log(`\nApplying ${updates.length} fixes...`);
  
  for (const update of updates) {
    const { error } = await supabase
      .from('questions')
      .update({ output_type: update.output_type })
      .eq('id', update.id);

    if (error) {
      console.error(`Failed to update ${update.id}:`, error);
    }
  }

  console.log(`✓ Fixed ${updates.length} questions with incorrect return types`);
}

await fixReturnTypes().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
