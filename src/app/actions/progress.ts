"use server";

import { LearningProgressFacade } from "@/lib/learning/services/ProgressFacade";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function getAuthContext() {
  const session = await getServerSession(authOptions);
  
  // MOCK USER for testing if not properly set up in NextAuth
  if (!session?.user?.email) {
    return { 
      userId: "00000000-0000-0000-0000-000000000000", 
      tenantId: "00000000-0000-0000-0000-000000000000" 
    };
  }

  // Use email hash or hardcoded mock until NextAuth adapter is fully integrated
  return { 
    userId: "11111111-1111-1111-1111-111111111111", 
    tenantId: "11111111-1111-1111-1111-111111111111" 
  };
}

export async function markLessonCompleteAction(lessonId: string, activeTimeInc: number) {
  try {
    const { userId, tenantId } = await getAuthContext();
    await LearningProgressFacade.markLessonComplete(userId, tenantId, lessonId, activeTimeInc);
    return { success: true };
  } catch (error: any) {
    console.error("markLessonCompleteAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function autoSaveProgressAction(lessonId: string, resumeState: any, activeTimeInc: number) {
  try {
    const { userId, tenantId } = await getAuthContext();
    await LearningProgressFacade.autoSave(userId, tenantId, lessonId, resumeState, activeTimeInc);
    return { success: true };
  } catch (error: any) {
    console.error("autoSaveProgressAction error:", error);
    return { success: false, error: error.message };
  }
}
