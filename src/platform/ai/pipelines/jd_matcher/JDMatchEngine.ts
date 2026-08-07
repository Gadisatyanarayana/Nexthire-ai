import { ResumeIntelligence } from '../../../../components/resume-builder/types';
import { JDMatchResult } from '../../models/JDMatchSchemas';
import { AIProviderRouter } from '../../router/AIProviderRouter';
import { AILogger } from '../../observability/AILogger';

export class JDMatchEngine {
  static async analyze(
    resumeIntelligence: ResumeIntelligence,
    jobDescriptionText: string,
    requestId: string = crypto.randomUUID()
  ): Promise<JDMatchResult> {
    
    AILogger.info('Starting JD Match Analysis', { 
      requestId, 
      resumeId: resumeIntelligence.metadata?.resumeHash || 'unknown'
    });

    const prompt = `You are an expert technical recruiter and ATS parsing system.
    
    Analyze the candidate's Resume Intelligence against the provided Job Description.
    Output your analysis as a strict JSON object that matches exactly the following structure:
    {
      "overallMatch": number (0-100),
      "roleFit": number (0-100),
      "technicalFit": number (0-100),
      "softSkillsMatch": number (0-100),
      "missingKeywords": string[],
      "recommendedKeywords": string[],
      "matchingProjects": string[]
    }
    
    Job Description:
    ${jobDescriptionText}
    
    Candidate Resume Intelligence:
    ${JSON.stringify({
      skills: resumeIntelligence.resumeProfile.primaryStack,
      roles: resumeIntelligence.resumeProfile.targetRoles,
      summary: resumeIntelligence.resumeProfile.careerSummary,
      yearsOfExperience: resumeIntelligence.resumeProfile.estimatedExperience,
      careerLevel: resumeIntelligence.resumeProfile.careerLevel
    })}
    `;

    try {
      const response = await AIProviderRouter.execute('JD_MATCH', prompt, { 
        requestId,
        systemInstruction: "You are a precise JSON-only ATS scoring system. Output only valid JSON."
      });
      
      AILogger.info('JD Match Analysis Complete', { 
        requestId, 
        overallMatch: response.result?.overallMatch 
      });

      // The router already parsed the JSON
      return response.result as JDMatchResult;

    } catch (error: any) {
      AILogger.error('JD Match Pipeline Failed', error, { requestId });
      throw error;
    }
  }
}
