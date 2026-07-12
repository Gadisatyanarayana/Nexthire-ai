const fs = require('fs');

const path = 'src/models/reasoning.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/Aptitude/g, 'Reasoning');
content = content.replace(/aptitude/g, 'reasoning');

fs.writeFileSync(path, content);
console.log('Successfully set up src/models/reasoning.ts');
