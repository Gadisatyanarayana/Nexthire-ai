const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, 'src', 'scripts');
if (fs.existsSync(scriptsDir)) {
  const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.ts'));

  files.forEach(f => {
    const filePath = path.join(scriptsDir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Fix imports for prr-1-import.ts
    if (content.includes('../services/import/')) {
      content = content.replace(/\.\.\/services\/import\//g, '@/platform/import-engine/');
      changed = true;
    }

    // Fix imports for prr-2-questions.ts
    if (content.includes('../services/question/')) {
      content = content.replace(/\.\.\/services\/question\//g, '@/platform/question-bank/');
      changed = true;
    }

    // Fix imports for prr-3-assessment.ts
    if (content.includes('../services/assessment/')) {
      content = content.replace(/\.\.\/services\/assessment\//g, '@/platform/assessment/');
      changed = true;
    }

    // Fix TS implicitly any for forensics.ts and migrate_m2.ts
    if (f === 'forensics.ts') {
      content = content.replace('r =>', '(r: any) =>');
      content = content.replace('catch (e) {', 'catch (e: any) {');
      changed = true;
    }
    
    if (f === 'migrate_m2.ts') {
      content = content.replace('catch (e) {', 'catch (e: any) {');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log('Fixed imports in', f);
    }
  });
}
