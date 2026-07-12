const fs = require('fs');

const path = 'src/lib/api/reasoningV2.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/queries\.getModules\(\)/g, 'queries.getModules("reasoning")');
code = code.replace(/queries\.getModule\(id\)/g, 'queries.getModule(id, "reasoning")');
code = code.replace(/queries\.getLesson\(id\)/g, 'queries.getLesson(id, "reasoning")');
code = code.replace(/queries\.getLessonsByModule\(moduleId\)/g, 'queries.getLessonsByModule(moduleId, "reasoning")');
code = code.replace(/queries\.getAllLessons\(\)/g, 'queries.getAllLessons("reasoning")');
code = code.replace(/queries\.getFormula\(id\)/g, 'queries.getFormula(id, "reasoning")');
code = code.replace(/queries\.getFormulasByLesson\(lessonId\)/g, 'queries.getFormulasByLesson(lessonId, "reasoning")');
code = code.replace(/queries\.getQuestionPreview\(lessonId, limit\)/g, 'queries.getQuestionPreview(lessonId, limit, "reasoning")');
code = code.replace(/queries\.getUserTopicMastery\(userId\)/g, 'queries.getUserTopicMastery(userId, "reasoning")');
code = code.replace(/queries\.getUserRevisionQueue\(userId\)/g, 'queries.getUserRevisionQueue(userId, "reasoning")');

fs.writeFileSync(path, code);
console.log('Successfully updated reasoningV2.ts to pass subject parameter!');
