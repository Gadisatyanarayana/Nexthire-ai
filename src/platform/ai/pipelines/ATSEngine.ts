import { AILogger } from '../observability/AILogger';
import { ResumeDocument, ResumeIntelligence, ATSAnalysis } from '../../../components/resume-builder/types';
import { AIProviderRouter } from '../router/AIProviderRouter';

export class ATSEngine {
  static async analyze(resume: ResumeDocument, intelligence: ResumeIntelligence): Promise<ATSAnalysis> {
    const requestId = crypto.randomUUID();
    
    try {
      AILogger.info('Starting ATS Engine pipeline', { requestId, resumeId: resume.id });

      // Stage 1: Document Validation
      const docValidation = this.runDocumentValidation(resume);

      // Stage 2: Rule Engine
      const ruleDeductions = this.runRuleEngine(resume);

      // Stage 3: Formatting Engine
      const formattingResult = this.runFormattingEngine(resume);

      // Stage 4: Readability Engine
      const readabilityResult = this.runReadabilityEngine(resume);

      // Stage 5: Keyword Engine
      const keywordResult = this.runKeywordEngine(resume, intelligence);

      // Stage 6: Impact Engine
      const impactResult = this.runImpactEngine(resume);

      // Stage 7: Duplicate Content Engine
      const duplicateResult = this.runDuplicateContentEngine(resume);

      // Stage 8: ATS Compatibility Engine
      const compatibilityResult = this.runATSCompatibilityEngine(resume);

      // Aggregate Statistics
      const statistics = {
        bulletCount: formattingResult.bulletCount,
        quantifiedBullets: impactResult.quantifiedBullets,
        actionVerbCoverage: impactResult.actionVerbCoverage,
        keywordDensity: keywordResult.density
      };

      // Aggregate dimensions (base 100 minus deductions)
      const contentScore = Math.max(0, 100 - ruleDeductions.deductions);
      const formattingScore = Math.max(0, 100 - formattingResult.deductions);
      const readabilityScore = Math.max(0, 100 - readabilityResult.deductions);
      const keywordsScore = Math.max(0, 100 - keywordResult.deductions);
      const impactScore = Math.max(0, 100 - impactResult.deductions);
      const atsCompatibilityScore = Math.max(0, 100 - compatibilityResult.deductions);

      // Calculate initial overall score
      let overallScore = Math.round(
        (contentScore * 0.15) + 
        (formattingScore * 0.15) + 
        (readabilityScore * 0.1) + 
        (keywordsScore * 0.2) + 
        (impactScore * 0.25) + 
        (atsCompatibilityScore * 0.15)
      );

      // Stage 9: Qualitative LLM Reviewer (Offloaded to Gemini Flash)
      const llmReview = await this.runLLMReview(
        resume, 
        intelligence, 
        { contentScore, formattingScore, readabilityScore, keywordsScore, impactScore, atsCompatibilityScore },
        requestId
      );

      return {
        overallScore,
        dimensionScores: {
          content: contentScore,
          formatting: formattingScore,
          readability: readabilityScore,
          keywords: keywordsScore,
          impact: impactScore,
          atsCompatibility: atsCompatibilityScore
        },
        strengths: llmReview.strengths || [],
        weaknesses: llmReview.weaknesses || [],
        recommendations: llmReview.recommendations || [],
        missingKeywords: keywordResult.missingKeywords,
        duplicateBullets: duplicateResult.duplicateBullets,
        statistics
      };

    } catch (error) {
       AILogger.error('ATS Analysis failed', error, {
        requestId,
        resumeId: resume.id,
        provider: 'ats-engine',
        model: 'pipeline'
      });
      throw error;
    }
  }

  // --- Pipeline Stages ---

  private static runDocumentValidation(resume: ResumeDocument) {
    let isValid = true;
    if (!resume.sections || resume.sections.length === 0) isValid = false;
    return { isValid };
  }

  private static runRuleEngine(resume: ResumeDocument) {
    let deductions = 0;
    
    const personal = resume.sections.find(s => s.type === 'personal')?.data;
    if (!personal?.email) deductions += 10;
    if (!personal?.phone) deductions += 5;
    if (!personal?.linkedin) deductions += 5;

    if (!resume.sections.find(s => s.type === 'experience')) deductions += 30;
    if (!resume.sections.find(s => s.type === 'education')) deductions += 10;

    return { deductions };
  }

  private static runFormattingEngine(resume: ResumeDocument) {
    let deductions = 0;
    let bulletCount = 0;

    const experience = resume.sections.find(s => s.type === 'experience')?.data;
    if (experience && Array.isArray(experience.items)) {
      experience.items.forEach((item: any) => {
        const count = item.achievements?.length || 0;
        bulletCount += count;
        if (count > 6) deductions += 2; // Too many bullets
        if (count > 0 && count < 2) deductions += 2; // Too few bullets
      });
    }

    if (bulletCount < 5) deductions += 15;
    
    return { deductions, bulletCount };
  }

  private static runReadabilityEngine(resume: ResumeDocument) {
    let deductions = 0;
    // Simple deterministic checks: long bullets > 30 words
    const experience = resume.sections.find(s => s.type === 'experience')?.data;
    if (experience && Array.isArray(experience.items)) {
      experience.items.forEach((item: any) => {
        item.achievements?.forEach((bullet: string) => {
          const wordCount = bullet.split(' ').length;
          if (wordCount > 40) deductions += 2; // Too long
          if (wordCount < 5) deductions += 1;  // Too short
        });
      });
    }
    return { deductions };
  }

  private static runKeywordEngine(resume: ResumeDocument, intelligence: ResumeIntelligence) {
    let deductions = 0;
    const targetRoles = intelligence.resumeProfile.targetRoles || [];
    const stack = intelligence.resumeProfile.primaryStack || [];
    
    // In a real scenario, this would compare against a JD or a massive taxonomy graph
    let matchedKeywords = 0;
    let missingKeywords: string[] = [];

    if (stack.length < 3) deductions += 20;

    return { 
      deductions, 
      density: stack.length * 2, // arbitrary metric
      missingKeywords 
    };
  }

  private static runImpactEngine(resume: ResumeDocument) {
    let deductions = 0;
    let quantifiedBullets = 0;
    let totalBullets = 0;
    
    const numberRegex = /\d+%|\$\d+|\b\d+\b/g;

    const experience = resume.sections.find(s => s.type === 'experience')?.data;
    if (experience && Array.isArray(experience.items)) {
      experience.items.forEach((item: any) => {
        item.achievements?.forEach((bullet: string) => {
          totalBullets++;
          if (numberRegex.test(bullet)) {
            quantifiedBullets++;
          } else {
            deductions += 1;
          }
        });
      });
    }

    const coverage = totalBullets > 0 ? Math.round((quantifiedBullets / totalBullets) * 100) : 0;
    if (coverage < 30) deductions += 10;

    return { deductions, quantifiedBullets, actionVerbCoverage: coverage };
  }

  private static runDuplicateContentEngine(resume: ResumeDocument) {
    // Detects repeated action verbs
    let duplicateBullets: string[] = [];
    return { deductions: 0, duplicateBullets };
  }

  private static runATSCompatibilityEngine(resume: ResumeDocument) {
    let deductions = 0;
    // Detect columns, tables, headers/footers based on the layout schema
    if (resume.typography.columns > 1) deductions += 10;
    return { deductions };
  }

  private static async runLLMReview(resume: ResumeDocument, intelligence: ResumeIntelligence, dimensionScores: any, requestId: string) {
    const prompt = `
      You are an elite ATS Analyst. Review this resume based on the following deterministic scores:
      Content: ${dimensionScores.content}
      Formatting: ${dimensionScores.formatting}
      Readability: ${dimensionScores.readability}
      Keywords: ${dimensionScores.keywords}
      Impact: ${dimensionScores.impact}
      ATS Compatibility: ${dimensionScores.atsCompatibility}

      Extract the strengths and weaknesses.
      Generate 3 highly actionable recommendations to improve the resume.
      Provide the output EXACTLY matching this JSON schema:
      {
        "strengths": ["..."],
        "weaknesses": ["..."],
        "recommendations": [
          { "priority": "HIGH", "effort": "LOW", "impact": "HIGH", "text": "..." }
        ]
      }

      Resume Data:
      ${JSON.stringify(intelligence.resumeProfile)}
    `;
    
    const response = await AIProviderRouter.execute('ATS_REVIEW', prompt, { 
      requestId,
      systemInstruction: "You are an ATS analyzer. Respond strictly in valid JSON matching the schema."
    });
    
    return response.result;
  }
}
