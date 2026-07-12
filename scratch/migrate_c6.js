const fs = require('fs');
const path = require('path');

const queryPath = 'src/lib/learning/services/LearningQueryService.ts';
let queryServiceCode = fs.readFileSync(queryPath, 'utf8');
const commandPath = 'src/lib/learning/services/LearningCommandService.ts';
let commandServiceCode = fs.readFileSync(commandPath, 'utf8');

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
  'src/app/api/v1/aptitude/weak-topics/route.ts',
  // and [companyId], [id] - let's skip them for now to avoid regex complexity
];

for (const routePath of routes) {
  if (!fs.existsSync(routePath)) continue;
  let content = fs.readFileSync(routePath, 'utf8');
  if (!content.includes('createClient')) continue;
  
  const methodName = routePath.split('/').slice(-2, -1)[0].replace(/-/g, '_') + '_logic';
  const isPost = content.includes('async function POST');
  const serviceCode = isPost ? commandServiceCode : queryServiceCode;
  const insertIndex = serviceCode.lastIndexOf('}');
  
  // Create a new method in the service that executes the exact same logic
  // but using a generic request object
  const newMethod = `
  public static async ${methodName}(request: any, userId?: string): Promise<any> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = require('@supabase/supabase-js').createClient(supabaseUrl, supabaseKey);
    // we use any because we are moving route logic
    throw new Error("unimplemented");
  }
`;
  // This is too messy.
}
