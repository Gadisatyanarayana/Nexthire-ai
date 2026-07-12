const fs = require('fs');

const routes = [
  'src/app/api/v1/aptitude/mock-tests/[id]/route.ts',
  'src/app/api/v1/aptitude/company/[companyId]/route.ts',
  'src/app/api/v1/aptitude/ai/tutor/route.ts'
];

for (const routePath of routes) {
  let content = fs.readFileSync(routePath, 'utf8');

  // Remove the direct supabase-js import
  content = content.replace(/import \{ createClient \} from "@supabase\/supabase-js";\r?\n?/g, '');
  
  if (routePath.includes('ai/tutor')) {
     content = content.replace(/const \{ createClient \} = await import\("@supabase\/supabase-js"\);\r?\n\s*const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL \|\| '';\r?\n\s*const supabaseKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY \|\| process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY \|\| '';\r?\n\s*const supabase = createClient\(supabaseUrl, supabaseKey\);/g, 'const supabase = LearningQueryService.getRawClient();');
  } else {
    // Replace the initialization
    const initRegex = /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL!;\r?\n\s*const supabaseKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY \|\| process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!;\r?\n\s*const supabase = createClient\(supabaseUrl, supabaseKey\);/g;
    content = content.replace(initRegex, 'const supabase = LearningQueryService.getRawClient();');
  }

  // Make sure LearningQueryService is imported
  if (!content.includes('LearningQueryService')) {
     if (content.includes('LearningService')) {
       content = content.replace(/import \{ LearningService \} from "@\/lib\/learning\/services\/LearningService";/g, 'import { LearningService } from "@/lib/learning/services/LearningService";\nimport { LearningQueryService } from "@/lib/learning/services/LearningQueryService";');
     } else {
       content = content.replace(/import \{ authOptions \} from "@\/lib\/auth";/g, 'import { authOptions } from "@/lib/auth";\nimport { LearningQueryService } from "@/lib/learning/services/LearningQueryService";');
     }
  }

  fs.writeFileSync(routePath, content);
  console.log('Fixed', routePath);
}
