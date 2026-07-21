import { createClient } from "@supabase/supabase-js";

export class LearningRecommendationService {
  private static getRawClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseKey);
  }

  public static async getContinueLearning(userId: string, tenantId: string) {
    const supabase = this.getRawClient();

    // 1. Check for Active Assessment Attempt
    const { data: activeAssessment } = await supabase
      .from('assessment_attempts')
      .select('id, assessment_id, time_elapsed_seconds, status')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .in('status', ['STARTED', 'IN_PROGRESS'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (activeAssessment) {
      return {
        recommendation: {
          type: 'ASSESSMENT',
          data: activeAssessment,
          resumeUrl: `/learn/domain/assessment/${activeAssessment.assessment_id}`,
          estimatedTimeRemaining: 600 - (activeAssessment.time_elapsed_seconds || 0)
        },
        reason: "You have an unfinished assessment attempt.",
        priority: 1,
        generatedBy: "rules"
      };
    }

    // 2. Check for In-Progress Lesson
    const { data: activeLesson } = await supabase
      .from('learning_progress')
      .select('lesson_id, status, last_accessed_at')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .in('status', ['STARTED', 'IN_PROGRESS'])
      .order('last_accessed_at', { ascending: false })
      .limit(1)
      .single();

    if (activeLesson) {
      const { data: lessonDetails } = await supabase
        .from('platform_lessons')
        .select('id, title, platform_modules(id, domain_id)')
        .eq('id', activeLesson.lesson_id)
        .single();

      if (lessonDetails) {
        const domainId = Array.isArray(lessonDetails.platform_modules) ? lessonDetails.platform_modules[0]?.domain_id : (lessonDetails.platform_modules as any)?.domain_id;
        const moduleId = Array.isArray(lessonDetails.platform_modules) ? lessonDetails.platform_modules[0]?.id : (lessonDetails.platform_modules as any)?.id;
        
        return {
          recommendation: {
            type: 'LESSON',
            data: lessonDetails,
            resumeUrl: `/learn/${domainId}/${moduleId}/${lessonDetails.id}`,
            estimatedTimeRemaining: 15 // Defaulting to 15 mins to avoid schema dependency
          },
          reason: "Pick up where you left off in this lesson.",
          priority: 2,
          generatedBy: "rules"
        };
      }
    }

    // 3. Fallback: Next Recommendation
    const { data: completedLessons } = await supabase
      .from('learning_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED');
      
    const completedIds = (completedLessons || []).map(p => p.lesson_id);

    let recQuery = supabase.from('platform_lessons')
      .select('id, title, platform_modules(id, domain_id)')
      .limit(1);

    if (completedIds.length > 0) {
      recQuery = recQuery.not('id', 'in', `(${completedIds.join(',')})`);
    }

    const { data: fallbackLesson } = await recQuery.single();

    if (fallbackLesson) {
      const domainId = Array.isArray(fallbackLesson.platform_modules) ? fallbackLesson.platform_modules[0]?.domain_id : (fallbackLesson.platform_modules as any)?.domain_id;
      const moduleId = Array.isArray(fallbackLesson.platform_modules) ? fallbackLesson.platform_modules[0]?.id : (fallbackLesson.platform_modules as any)?.id;
      
      return {
        recommendation: {
          type: 'RECOMMENDATION',
          data: fallbackLesson,
          resumeUrl: `/learn/${domainId}/${moduleId}/${fallbackLesson.id}`,
          estimatedTimeRemaining: 15 // Defaulting to 15 mins to avoid schema dependency
        },
        reason: "Based on your progress, this is the best next step.",
        priority: 3,
        generatedBy: "rules"
      };
    }

    return null;
  }
}
