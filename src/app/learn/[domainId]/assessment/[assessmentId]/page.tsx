import AssessmentPlayer from '@/components/learning/assessment/AssessmentPlayer';
import { notFound } from 'next/navigation';

export default async function AssessmentPage({ params }: { params: Promise<{ domainId: string, assessmentId: string }> }) {
  // In a real application, we would fetch the Assessment Blueprint/Questions from the database here
  // based on the assessmentId slug.
  // For Phase 2 Step 6, we'll mock an assessment config to feed the AssessmentPlayer.
  
  const resolvedParams = await params;

  const mockAssessment = {
    assessmentId: resolvedParams.assessmentId,
    title: `Assessment: ${resolvedParams.assessmentId}`,
    timeLimitSeconds: 600, // 10 minutes
    questions: [
      {
        id: "q1",
        text: "What is the primary purpose of an Assessment Attempt record in an LMS?",
        options: [
          "To store user profiles",
          "To record the start, duration, and score of a test session",
          "To generate new lessons",
          "To send marketing emails"
        ],
        type: "MCQ"
      },
      {
        id: "q2",
        text: "Which of the following database paradigms is used for 'Upserting' answers?",
        options: [
          "INSERT OR IGNORE",
          "ON CONFLICT DO UPDATE",
          "DELETE then INSERT",
          "APPEND ONLY"
        ],
        type: "MCQ"
      },
      {
        id: "q3",
        text: "What does RLS stand for in Supabase?",
        options: [
          "Relational Learning System",
          "Row Level Security",
          "Rapid Lesson Sync",
          "Remote Local Storage"
        ],
        type: "MCQ"
      }
    ]
  };

  if (!mockAssessment) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <AssessmentPlayer 
        assessmentId={mockAssessment.assessmentId} 
        title={mockAssessment.title} 
        timeLimitSeconds={mockAssessment.timeLimitSeconds} 
        questions={mockAssessment.questions} 
      />
    </div>
  );
}
