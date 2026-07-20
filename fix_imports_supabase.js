const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Fix supabaseAdmin imports pointing to @/lib/supabase
  if (content.includes("import { supabaseAdmin } from '@/lib/supabase'")) {
    content = content.replace(
      "import { supabaseAdmin } from '@/lib/supabase'",
      "import { supabaseAdmin } from '@/lib/supabaseAdmin'"
    );
    changed = true;
  }
  
  if (content.includes("import { supabaseAdmin } from \"@/lib/supabase\"")) {
    content = content.replace(
      "import { supabaseAdmin } from \"@/lib/supabase\"",
      "import { supabaseAdmin } from \"@/lib/supabaseAdmin\""
    );
    changed = true;
  }

  // Also fix the QuestionRepository / ImportRepository missing exports or missing stubs
  // Just for the sake of the compiler, we'll patch the missing supabase property if it's complained about.
  // Actually, I'll let tsc complain and fix it properly later if needed.
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed imports in ${file}`);
  }
});
