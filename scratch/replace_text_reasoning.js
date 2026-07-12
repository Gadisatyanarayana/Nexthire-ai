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

function replaceInDir(dir) {
  walkDir(dir, (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace text titles
      content = content.replace(/Aptitude Hub/g, 'Logical Reasoning Hub');
      content = content.replace(/Aptitude/g, 'Logical Reasoning');
      content = content.replace(/aptitude/g, 'reasoning');
      
      // Specifically fix descriptions or headers
      content = content.replace(/Master quantitative reasoning, logical deduction, and verbal ability/g, 'Master syllogisms, blood relations, seating arrangements, and logical deductions');

      fs.writeFileSync(filePath, content);
      console.log('Processed Text in', filePath);
    }
  });
}

replaceInDir('src/app/reasoning');
replaceInDir('src/components/reasoning');
