const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
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
      
      // Replace URL paths /api/v1/aptitude -> /api/v1/reasoning
      content = content.replace(/\/api\/v1\/aptitude/g, '/api/v1/reasoning');
      
      // Replace apt_ table prefixes to reasoning_
      content = content.replace(/apt_lessons/g, 'reasoning_lessons');
      content = content.replace(/apt_modules/g, 'reasoning_modules');
      content = content.replace(/apt_formulas/g, 'reasoning_formulas');
      content = content.replace(/apt_questions/g, 'reasoning_questions');
      content = content.replace(/apt_mock_sessions/g, 'reasoning_mock_sessions');
      content = content.replace(/apt_topic_mastery/g, 'reasoning_topic_mastery');
      content = content.replace(/apt_question_attempts/g, 'reasoning_question_attempts');
      content = content.replace(/apt_revision_queue/g, 'reasoning_revision_queue');
      content = content.replace(/apt_companies/g, 'reasoning_companies');
      content = content.replace(/apt_company_tags/g, 'reasoning_company_tags');
      
      // Replace specific URLs like /aptitude/learn -> /reasoning/learn
      content = content.replace(/\/aptitude/g, '/reasoning');

      fs.writeFileSync(filePath, content);
      console.log('Processed', filePath);
    }
  });
}

replaceInDir('src/app/reasoning');
replaceInDir('src/app/api/v1/reasoning');
