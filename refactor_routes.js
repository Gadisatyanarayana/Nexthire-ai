const fs = require('fs');
const path = require('path');

const directories = ['src/app/api/v1/aptitude', 'src/components/aptitude', 'src/app/aptitude'];

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
    
    // Check if it has legacy imports
    if (!content.includes('@/lib/aptitude/')) return;

    let hasLearningServiceImport = content.includes('LearningService');
    const importLines = [];
    const exportsToDestructure = new Set();
    let newContent = [];
    
    const lines = content.split('\n');
    for(let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const staticMatch = line.match(/import\s+{([^}]+)}\s+from\s+['"]@\/lib\/aptitude\/([^'"]+)['"]/);
      if (staticMatch) {
        staticMatch[1].split(',').forEach(e => exportsToDestructure.add(e.trim()));
        continue; // skip the import line
      }
      
      const dynamicMatch = line.match(/(const\s+)?{\s*([^}]+)\s*}\s*=\s*(?:await\s+)?(?:import|require)\(['"]@\/lib\/aptitude\/([^'"]+)['"]\);?/);
      if (dynamicMatch) {
        dynamicMatch[2].split(',').forEach(e => exportsToDestructure.add(e.trim()));
        continue; // skip the import line
      }
      
      newContent.push(line);
    }
    
    if (exportsToDestructure.size > 0) {
      let finalContent = newContent.join('\n');
      
      // Add the import at the top (after other imports)
      let injectionPoint = 0;
      for (let i = 0; i < newContent.length; i++) {
        if (!newContent[i].startsWith('import ')) {
          injectionPoint = i;
          break;
        }
      }
      
      let destructureLine = 'const { ' + Array.from(exportsToDestructure).join(', ') + ' } = LearningService;';
      
      if (!hasLearningServiceImport) {
        newContent.splice(injectionPoint, 0, 'import { LearningService } from "@/lib/learning/services/LearningService";');
        injectionPoint++;
      }
      
      newContent.splice(injectionPoint, 0, destructureLine);
      
      fs.writeFileSync(file, newContent.join('\n'));
      console.log('Refactored:', file);
    }
  });
});
