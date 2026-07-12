const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix imports & function names
  content = content.replace(/Logical ReasoningQuestion/g, 'ReasoningQuestion');
  content = content.replace(/Logical ReasoningModule/g, 'ReasoningModule');
  content = content.replace(/Logical ReasoningLesson/g, 'ReasoningLesson');
  content = content.replace(/Logical ReasoningFormula/g, 'ReasoningFormula');
  content = content.replace(/Logical ReasoningHubPage/g, 'LogicalReasoningHubPage');
  
  // Fix function name where space got added: "function Logical Reasoning"
  content = content.replace(/function Logical Reasoning/g, 'function LogicalReasoning');

  fs.writeFileSync(filePath, content);
  console.log('Cleaned syntax in', filePath);
}

function cleanDir(dir) {
  walkDir(dir, (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      cleanFile(filePath);
    }
  });
}

cleanDir('src/app/reasoning');
cleanDir('src/components/reasoning');
cleanDir('src/app/api/v1/reasoning');
cleanFile('src/lib/api/reasoningV2.ts');
