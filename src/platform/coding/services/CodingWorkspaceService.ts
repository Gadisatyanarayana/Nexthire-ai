import { ProblemService } from "./ProblemService";
import { EditorSessionService } from "./EditorSessionService";

export class CodingWorkspaceService {
  private problemService = new ProblemService();
  private editorSessionService = new EditorSessionService();

  /**
   * Fetches the problem payload and attempts to attach the user's latest saved session
   * so the frontend can initialize seamlessly.
   */
  async initializeWorkspace(tenantId: string, userId: string, problemId: string) {
    const problem = await this.problemService.getProblemDetails(tenantId, problemId);
    let session = null;
    
    try {
      session = await this.editorSessionService.getSession(tenantId, userId, problemId);
    } catch (e) {
      console.warn("No editor session found or error fetching session:", e);
    }

    return {
      problem,
      session
    };
  }
}
