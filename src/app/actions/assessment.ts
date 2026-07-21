"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AssessmentAttemptService } from "@/platform/assessment/services/AssessmentAttemptService";

// Helper to mock or retrieve user/tenant (reusing the logic from progress.ts)
async function getAuthContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { 
      userId: "00000000-0000-0000-0000-000000000000", 
      tenantId: "00000000-0000-0000-0000-000000000000" 
    };
  }
  return { 
    userId: "11111111-1111-1111-1111-111111111111", 
    tenantId: "11111111-1111-1111-1111-111111111111" 
  };
}

const service = new AssessmentAttemptService();

export async function startAssessmentAction(assessmentId: string) {
  try {
    const { userId, tenantId } = await getAuthContext();
    const attempt = await service.startAttempt(tenantId, userId, assessmentId);
    return { success: true, attempt };
  } catch (error: any) {
    console.error("startAssessmentAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function resumeAssessmentAction(assessmentId: string) {
  try {
    const { userId, tenantId } = await getAuthContext();
    const attempt = await service.resumeAttempt(tenantId, userId, assessmentId);
    return { success: true, attempt };
  } catch (error: any) {
    console.error("resumeAssessmentAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveAssessmentAnswerAction(
  attemptId: string, 
  questionId: string, 
  answerData: any, 
  timeElapsedSeconds: number
) {
  try {
    const { userId, tenantId } = await getAuthContext();
    await service.saveAnswer(tenantId, userId, attemptId, questionId, answerData, timeElapsedSeconds);
    return { success: true };
  } catch (error: any) {
    console.error("saveAssessmentAnswerAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function submitAssessmentAction(attemptId: string, timeElapsedSeconds: number) {
  try {
    const { userId, tenantId } = await getAuthContext();
    const gradedAttempt = await service.submitAttempt(tenantId, userId, attemptId, timeElapsedSeconds);
    return { success: true, attempt: gradedAttempt };
  } catch (error: any) {
    console.error("submitAssessmentAction error:", error);
    return { success: false, error: error.message };
  }
}
