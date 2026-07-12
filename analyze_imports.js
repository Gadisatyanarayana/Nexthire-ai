const fs = require('fs');
const path = require('path');

const directories = ['src/app/api/v1/aptitude', 'src/components/aptitude', 'src/app/aptitude'];

const legacyImports = {};

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

directories.forEach(dir => {
  const files = walkDir(dir);
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const match = line.match(/import\s+{([^}]+)}\s+from\s+['"]@\/lib\/aptitude\/([^'"]+)['"]/);
      if (match) {
        const exports = match[1].split(',').map(s => s.trim());
        const module = match[2];
        if (!legacyImports[module]) legacyImports[module] = new Set();
        exports.forEach(e => legacyImports[module].add(e));
      }
      
      const dynamicMatch = line.match(/const\s+{([^}]+)}\s+=\s+(?:await\s+)?(?:import|require)\(['"]@\/lib\/aptitude\/([^'"]+)['"]\)/);
      if (dynamicMatch) {
        const exports = dynamicMatch[1].split(',').map(s => s.trim());
        const module = dynamicMatch[2];
        if (!legacyImports[module]) legacyImports[module] = new Set();
        exports.forEach(e => legacyImports[module].add(e));
      }
    });
  });
});

const output = {};
for (const [module, exports] of Object.entries(legacyImports)) {
  output[module] = Array.from(exports);
}
console.log(JSON.stringify(output, null, 2));
