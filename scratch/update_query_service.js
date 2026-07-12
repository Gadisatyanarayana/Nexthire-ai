const fs = require('fs');

const path = 'src/lib/learning/services/LearningQueryService.ts';
let code = fs.readFileSync(path, 'utf8');

// Modify getModules
code = code.replace(
  /public static async getModules\(\): Promise<AptitudeModule\[\]> \{[\s\S]*?const \{ data, error \} = await supabase\.from\(\"apt_modules\"\)\.select\(\"\*\"\)\.order\(\"level_order\", \{ ascending: true \}\);/g,
  `public static async getModules(subject: string = "aptitude"): Promise<AptitudeModule[]> {
    const supabase = this.getRawClient();
    const table = subject === "reasoning" ? "reasoning_modules" : "apt_modules";
    const { data, error } = await supabase.from(table).select("*").order("level_order", { ascending: true });`
);

// Modify getModule
code = code.replace(
  /public static async getModule\(id: string\): Promise<AptitudeModule \| null> \{[\s\S]*?const \{ data, error \} = await supabase\.from\(\"apt_modules\"\)\.select\(\"\*\"\)\.eq\(\"id\", id\)\.single\(\);/g,
  `public static async getModule(id: string, subject: string = "aptitude"): Promise<AptitudeModule | null> {
    const supabase = this.getRawClient();
    const table = subject === "reasoning" ? "reasoning_modules" : "apt_modules";
    const { data, error } = await supabase.from(table).select("*").eq("id", id).single();`
);

// Modify getLesson
code = code.replace(
  /public static async getLesson\(id: string\): Promise<AptitudeLesson \| null> \{[\s\S]*?const repo = RepositoryFactory\.getLessonRepository\(\);/g,
  `public static async getLesson(id: string, subject: string = "aptitude"): Promise<AptitudeLesson | null> {
    const repo = RepositoryFactory.getLessonRepository(subject);`
);

// Modify getLessonsByModule
code = code.replace(
  /public static async getLessonsByModule\(moduleId: string\): Promise<AptitudeLesson\[\]> \{[\s\S]*?const repo = RepositoryFactory\.getLessonRepository\(\);/g,
  `public static async getLessonsByModule(moduleId: string, subject: string = "aptitude"): Promise<AptitudeLesson[]> {
    const repo = RepositoryFactory.getLessonRepository(subject);`
);

// Modify getAllLessons
code = code.replace(
  /public static async getAllLessons\(\): Promise<AptitudeLesson\[\]> \{[\s\S]*?const repo = RepositoryFactory\.getLessonRepository\(\);/g,
  `public static async getAllLessons(subject: string = "aptitude"): Promise<AptitudeLesson[]> {
    const repo = RepositoryFactory.getLessonRepository(subject);`
);

// Modify getFormula
code = code.replace(
  /public static async getFormula\(id: string\): Promise<AptitudeFormula \| null> \{[\s\S]*?const \{ data, error \} = await supabase\.from\(\"apt_formulas\"\)\.select\(\"\*\"\)\.eq\(\"id\", id\)\.single\(\);/g,
  `public static async getFormula(id: string, subject: string = "aptitude"): Promise<AptitudeFormula | null> {
    const supabase = this.getRawClient();
    const table = subject === "reasoning" ? "reasoning_formulas" : "apt_formulas";
    const { data, error } = await supabase.from(table).select("*").eq("id", id).single();`
);

// Modify getFormulasByLesson
code = code.replace(
  /public static async getFormulasByLesson\(lessonId: string\): Promise<AptitudeFormula\[\]> \{[\s\S]*?const \{ data, error \} = await supabase\.from\(\"apt_formulas\"\)\.select\(\"\*\"\)\.eq\(\"topic_id\", lessonId\)/g,
  `public static async getFormulasByLesson(lessonId: string, subject: string = "aptitude"): Promise<AptitudeFormula[]> {
    const supabase = this.getRawClient();
    const table = subject === "reasoning" ? "reasoning_formulas" : "apt_formulas";
    const { data, error } = await supabase.from(table).select("*").eq("topic_id", lessonId)`
);

// Modify getQuestionPreview
code = code.replace(
  /public static async getQuestionPreview\(lessonId: string, limit: number = 3\): Promise<AptitudeQuestion\[\]> \{[\s\S]*?const repo = RepositoryFactory\.getQuestionRepository\(\);/g,
  `public static async getQuestionPreview(lessonId: string, limit: number = 3, subject: string = "aptitude"): Promise<AptitudeQuestion[]> {
    const repo = RepositoryFactory.getQuestionRepository(subject);`
);

// Modify getUserTopicMastery
code = code.replace(
  /public static async getUserTopicMastery\(userId: string\): Promise<any\[\]> \{[\s\S]*?const repo = RepositoryFactory\.getMasteryRepository\(\);/g,
  `public static async getUserTopicMastery(userId: string, subject: string = "aptitude"): Promise<any[]> {
    const repo = RepositoryFactory.getMasteryRepository(subject);`
);

// Modify getUserRevisionQueue
code = code.replace(
  /public static async getUserRevisionQueue\(userId: string\): Promise<any\[\]> \{[\s\S]*?const \{ data, error \} = await supabase\.from\(\"apt_revision_queue\"\)/g,
  `public static async getUserRevisionQueue(userId: string, subject: string = "aptitude"): Promise<any[]> {
    const supabase = this.getRawClient();
    const table = subject === "reasoning" ? "reasoning_revision_queue" : "apt_revision_queue";
    const { data, error } = await supabase.from(table).select("*")`
);

// Add searchReasoningLessons and searchReasoningFormulas
if (!code.includes('searchReasoningLessons')) {
  const insertionIndex = code.lastIndexOf('}');
  const searchMethods = `
  public static async searchReasoningLessons(query: string): Promise<AptitudeLesson[]> {
    return this.searchAptitudeLessons(query, "reasoning");
  }

  public static async searchReasoningFormulas(query: string): Promise<AptitudeFormula[]> {
    return this.searchAptitudeFormulas(query, "reasoning");
  }
`;
  code = code.slice(0, insertionIndex) + searchMethods + code.slice(insertionIndex);
}

// Modify searchAptitudeLessons to accept subject
code = code.replace(
  /public static async searchAptitudeLessons\(query: string\): Promise<AptitudeLesson\[\]> \{/g,
  `public static async searchAptitudeLessons(query: string, subject: string = "aptitude"): Promise<AptitudeLesson[]> {`
);
code = code.replace(/from\(\"apt_lessons\"\)/g, `from(subject === "reasoning" ? "reasoning_lessons" : "apt_lessons")`);
code = code.replace(/from\(\"apt_company_tags\"\)/g, `from(subject === "reasoning" ? "reasoning_company_tags" : "apt_company_tags")`);
code = code.replace(/apt_questions!inner/g, `reasoning_questions!inner`); // wait, if it's reasoning it needs reasoning_questions!inner
// let's do table name dynamic translation inside searchAptitudeLessons
code = code.replace(
  /\.from\(\"apt_company_tags\"\)\s*\.select\(\"apt_questions!inner\(lesson_id\)\"\)/g,
  `.from(subject === "reasoning" ? "reasoning_company_tags" : "apt_company_tags").select(subject === "reasoning" ? "reasoning_questions!inner(lesson_id)" : "apt_questions!inner(lesson_id)")`
);
code = code.replace(
  /const lId = \(tag as any\)\.apt_questions\?\.lesson_id;/g,
  `const lId = (tag as any).apt_questions?.lesson_id || (tag as any).reasoning_questions?.lesson_id;`
);

// Modify searchAptitudeFormulas to accept subject
code = code.replace(
  /public static async searchAptitudeFormulas\(query: string\): Promise<AptitudeFormula\[\]> \{/g,
  `public static async searchAptitudeFormulas(query: string, subject: string = "aptitude"): Promise<AptitudeFormula[]> {`
);
code = code.replace(/from\(\"apt_formulas\"\)/g, `from(subject === "reasoning" ? "reasoning_formulas" : "apt_formulas")`);

fs.writeFileSync(path, code);
console.log('Modified LearningQueryService.ts successfully!');
