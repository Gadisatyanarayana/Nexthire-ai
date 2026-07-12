import { LearningQueryService } from "./LearningQueryService";
import { LearningCommandService } from "./LearningCommandService";

/**
 * Unified CQRS-Lite Learning Service.
 * React components and Route Handlers should ONLY call this service, never Supabase directly.
 */
export class LearningService {
  // Query Facades
  public static queries = LearningQueryService;
  
  // Command Facades
  public static commands = LearningCommandService;
}
