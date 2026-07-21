import { createClient } from "@supabase/supabase-js";
import { LearningQueryService } from "./LearningQueryService";

export interface CatalogSearchFilters {
  query?: string;
  domainId?: string;
  difficulty?: string;
  status?: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  maxDurationMinutes?: number;
  tags?: string[];
}

export class LearningCatalogService {
  private static getRawClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseKey);
  }

  public static async searchCatalog(userId: string | null, filters: CatalogSearchFilters) {
    const supabase = this.getRawClient();
    
    // We are going to query modules and lessons
    // For this implementation, we will query `platform_lessons` as the granular course unit, 
    // joining `platform_modules` and `platform_domains` for rich filtering.
    let queryBuilder = supabase
      .from('platform_lessons')
      .select(`
        id, 
        title, 
        description, 
        module_id,
        platform_modules!inner (
          id,
          title,
          domain_id,
          platform_domains!inner (
            id,
            title
          )
        )
      `);

    if (filters.domainId) {
      queryBuilder = queryBuilder.eq('platform_modules.domain_id', filters.domainId);
    }
    
    if (filters.query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
    }

    const { data: lessons, error } = await queryBuilder.limit(50);
    
    if (error) {
      console.error("LearningCatalogService search error:", error);
      throw error;
    }

    let results = lessons || [];

    // If a user is logged in, attach completion status to filter by it
    if (userId) {
      // Fetch user's progress records
      const { data: progress } = await supabase
        .from('learning_progress')
        .select('lesson_id, status')
        .eq('user_id', userId);

      const progressMap = new Map((progress || []).map(p => [p.lesson_id, p.status]));

      results = results.map((lesson: any) => ({
        ...lesson,
        status: progressMap.get(lesson.id) || 'NOT_STARTED'
      }));

      if (filters.status) {
        results = results.filter((lesson: any) => lesson.status === filters.status);
      }
    } else {
      results = results.map((lesson: any) => ({
        ...lesson,
        status: 'NOT_STARTED'
      }));
    }

    return results;
  }
}
