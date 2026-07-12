const fs = require('fs');
const path = require('path');

const directories = ['src/app', 'src/components'];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

directories.forEach(dir => {
  const files = walkDir(dir);
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('@/lib/aptitude/')) {
      content = content.replace(/@\/lib\/aptitude\/SmartRevisionEngine/g, '@/lib/learning/engines/RevisionEngine');
      content = content.replace(/@\/lib\/aptitude\/WeakTopicCoach/g, '@/lib/learning/engines/AITutorEngine');
      content = content.replace(/@\/lib\/aptitude\/AIReviewEngine/g, '@/lib/learning/engines/AITutorEngine');
      content = content.replace(/@\/lib\/aptitude\/QuizGenerator/g, '@/lib/learning/engines/QuestionEngine');
      content = content.replace(/@\/lib\/aptitude\/HintEngine/g, '@/lib/learning/engines/AIPromptManager');
      content = content.replace(/@\/lib\/aptitude\/MemoryManager/g, '@/lib/learning/engines/AIPromptManager');
      content = content.replace(/@\/lib\/aptitude\/ReportingEngine/g, '@/lib/learning/engines/AnalyticsEngine');
      content = content.replace(/@\/lib\/aptitude\/PlacementReadinessEngine/g, '@/lib/learning/engines/CompanyEngine');
      content = content.replace(/@\/lib\/aptitude\/MockAnalyticsEngine/g, '@/lib/learning/engines/AnalyticsEngine');
      content = content.replace(/@\/lib\/aptitude\/CompanyReadinessEngine/g, '@/lib/learning/engines/CompanyEngine');
      content = content.replace(/@\/lib\/aptitude\/CertificationEngine/g, '@/lib/learning/engines/AnalyticsEngine');
      content = content.replace(/@\/lib\/aptitude\/GamificationEngine/g, '@/lib/learning/engines/AnalyticsEngine');
      content = content.replace(/@\/lib\/aptitude\/FormulaEngine/g, '@/lib/learning/engines/KnowledgeGraphEngine');
      content = content.replace(/@\/lib\/aptitude\/SpacedRepetitionEngine/g, '@/lib/learning/engines/AdaptiveLearningEngine');
      content = content.replace(/@\/lib\/aptitude\/FeatureFlags/g, '@/lib/learning/engines/AnalyticsEngine');
      content = content.replace(/@\/lib\/aptitude\//g, '@/lib/learning/engines/');
      fs.writeFileSync(file, content);
      console.log('Fixed:', file);
    }
  });
});
