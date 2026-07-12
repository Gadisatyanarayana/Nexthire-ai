const fs = require('fs');
const path = require('path');

const sourcePath = 'src/lib/learning/repositories/SupabaseRepositories.ts';
const targetPath = 'src/lib/plugins/reasoning/SupabaseReasoningRepositories.ts';

let content = fs.readFileSync(sourcePath, 'utf8');

// Rename classes
content = content.replace(/class SupabaseBaseRepository/g, 'class SupabaseReasoningBaseRepository');
content = content.replace(/extends SupabaseBaseRepository/g, 'extends SupabaseReasoningBaseRepository');
content = content.replace(/class SupabaseLessonRepository/g, 'class SupabaseReasoningLessonRepository');
content = content.replace(/class SupabaseQuestionRepository/g, 'class SupabaseReasoningQuestionRepository');
content = content.replace(/class SupabaseMockRepository/g, 'class SupabaseReasoningMockRepository');
content = content.replace(/class SupabaseMasteryRepository/g, 'class SupabaseReasoningMasteryRepository');
content = content.replace(/class SupabaseCompanyRepository/g, 'class SupabaseReasoningCompanyRepository');

// Rename tables
content = content.replace(/\"apt_lessons\"/g, '"reasoning_lessons"');
content = content.replace(/\"apt_modules\"/g, '"reasoning_modules"');
content = content.replace(/\"apt_formulas\"/g, '"reasoning_formulas"');
content = content.replace(/\"apt_questions\"/g, '"reasoning_questions"');
content = content.replace(/\"apt_mock_sessions\"/g, '"reasoning_mock_sessions"');
content = content.replace(/\"apt_topic_mastery\"/g, '"reasoning_topic_mastery"');
content = content.replace(/\"apt_question_attempts\"/g, '"reasoning_question_attempts"');
content = content.replace(/\"apt_revision_queue\"/g, '"reasoning_revision_queue"');
content = content.replace(/\"apt_companies\"/g, '"reasoning_companies"');
content = content.replace(/\"apt_company_tags/g, '"reasoning_company_tags');

fs.writeFileSync(targetPath, content);
console.log('Successfully re-created SupabaseReasoningRepositories.ts');
