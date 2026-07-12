const fs = require('fs');
const path = require('path');

const routes = [
  'src/app/api/v1/aptitude/ai/coach/route.ts',
  'src/app/api/v1/aptitude/ai/history/route.ts',
  'src/app/api/v1/aptitude/ai/quiz/route.ts',
  'src/app/api/v1/aptitude/ai/review/route.ts',
  'src/app/api/v1/aptitude/ai/tutor/route.ts',
  'src/app/api/v1/aptitude/analytics/route.ts',
  'src/app/api/v1/aptitude/company/route.ts',
  'src/app/api/v1/aptitude/company/seed/route.ts',
  'src/app/api/v1/aptitude/company-readiness/route.ts',
  'src/app/api/v1/aptitude/lesson-status/route.ts',
  'src/app/api/v1/aptitude/mastery/route.ts',
  'src/app/api/v1/aptitude/mock-history/route.ts',
  'src/app/api/v1/aptitude/mock-submit/route.ts',
  'src/app/api/v1/aptitude/mock-tests/route.ts',
  'src/app/api/v1/aptitude/revision/route.ts',
  'src/app/api/v1/aptitude/submit/route.ts',
  'src/app/api/v1/aptitude/weak-topics/route.ts'
];

for (const routePath of routes) {
  if (!fs.existsSync(routePath)) continue;
  let content = fs.readFileSync(routePath, 'utf8');

  // Remove the direct supabase-js import
  content = content.replace(/import \{ createClient \} from "@supabase\/supabase-js";\r?\n?/g, '');
  
  // Make sure LearningQueryService is imported
  if (!content.includes('LearningQueryService')) {
    if (content.includes('LearningService')) {
       content = content.replace(/import \{ LearningService \} from "@\/lib\/learning\/services\/LearningService";/g, 'import { LearningService } from "@/lib/learning/services/LearningService";\nimport { LearningQueryService } from "@/lib/learning/services/LearningQueryService";');
    } else {
       content = content.replace(/import \{ authOptions \} from "@\/lib\/auth";/g, 'import { authOptions } from "@/lib/auth";\nimport { LearningQueryService } from "@/lib/learning/services/LearningQueryService";');
    }
  }

  // Replace the initialization
  const initRegex = /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL!;\r?\n\s*const supabaseKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY \|\| process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!;\r?\n\s*const supabase = createClient\(supabaseUrl, supabaseKey\);/g;
  content = content.replace(initRegex, 'const supabase = LearningQueryService.getRawClient();');

  fs.writeFileSync(routePath, content);
  console.log('Refactored', routePath);
}
