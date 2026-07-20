const fs = require('fs');

function replaceFile(path, replacer) {
  if (fs.existsSync(path)) {
    const content = fs.readFileSync(path, 'utf8');
    const newContent = replacer(content);
    if (content !== newContent) {
      fs.writeFileSync(path, newContent);
      console.log('Fixed lint in', path);
    }
  }
}

// 1. analyze_imports.js
replaceFile('analyze_imports.js', c => c.replace(/const module = /g, 'const mod = ').replace(/module\.path/g, 'mod.path'));

// 2. src/scripts/seedReasoningV2.ts
replaceFile('src/scripts/seedReasoningV2.ts', c => 
  c.replace(/for \(const module of modules\)/g, 'for (const mod of modules)')
   .replace(/module\.id/g, 'mod.id')
   .replace(/module\.title/g, 'mod.title')
);

// 3. src/scripts/seed_curriculum.ts
replaceFile('src/scripts/seed_curriculum.ts', c => 
  c.replace(/for \(const module of domain.modules\)/g, 'for (const mod of domain.modules)')
   .replace(/module\.title/g, 'mod.title')
   .replace(/module\.description/g, 'mod.description')
   .replace(/module\.lessons/g, 'mod.lessons')
);

// 4. scratch/clean_syntax_errors.js
replaceFile('scratch/clean_syntax_errors.js', c => c.replace(/changed;/g, ''));
// 5. scratch/replace_reasoning.js
replaceFile('scratch/replace_reasoning.js', c => c.replace(/changed;/g, ''));
// 6. scratch/replace_reasoning_components.js
replaceFile('scratch/replace_reasoning_components.js', c => c.replace(/changed;/g, ''));
// 7. scratch/replace_text_reasoning.js
replaceFile('scratch/replace_text_reasoning.js', c => c.replace(/changed;/g, ''));

// 8. k6 default exports
replaceFile('tests/k6/assessment-load.js', c => c.replace(/export default function \(\)/g, 'export default function loadTest()'));
replaceFile('tests/k6/coding-load.js', c => c.replace(/export default function \(\)/g, 'export default function loadTest()'));
