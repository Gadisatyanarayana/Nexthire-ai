"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  startAssessmentAction, 
  resumeAssessmentAction, 
  saveAssessmentAnswerAction, 
  submitAssessmentAction 
} from '@/app/actions/assessment';

type ViewState = 'START' | 'IN_PROGRESS' | 'REVIEW' | 'RESULTS';

export default function AssessmentPlayer({ assessmentId, title, timeLimitSeconds, questions }: any) {
  const [viewState, setViewState] = useState<ViewState>('START');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(timeLimitSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!attemptId) return;
    setIsSubmitting(true);
    const elapsed = timeLimitSeconds - timeRemaining;
    const res = await submitAssessmentAction(attemptId, elapsed);
    if (res.success) {
      setResults(res.attempt);
      setViewState('RESULTS');
    } else {
      setError(res.error || "Unknown error");
    }
    setIsSubmitting(false);
  };

  const handleAutoSubmit = () => {
    if (viewState === 'IN_PROGRESS' && !isSubmitting) {
      alert("Time is up! Auto-submitting your assessment.");
      handleSubmit();
    }
  };

  // Timer logic
  useEffect(() => {
    if (viewState === 'IN_PROGRESS' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [viewState, timeRemaining]);

  // Check for active attempt on mount to resume
  useEffect(() => {
    resumeAssessmentAction(assessmentId).then(res => {
      if (res.success && res.attempt) {
        setAttemptId(res.attempt.id);
        setTimeRemaining(Math.max(0, timeLimitSeconds - res.attempt.time_elapsed_seconds));
        // We'd ideally fetch existing answers here as well
        setViewState('IN_PROGRESS');
      }
    });
  }, [assessmentId, timeLimitSeconds]);

  const handleStart = async () => {
    const res = await startAssessmentAction(assessmentId);
    if (res.success && res.attempt) {
      setAttemptId(res.attempt.id);
      setViewState('IN_PROGRESS');
    } else {
      alert("Error starting assessment: " + res.error);
    }
  };

  const handleAnswerChange = async (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // Auto-save debounce logic
    if (attemptId) {
      const elapsed = timeLimitSeconds - timeRemaining;
      await saveAssessmentAnswerAction(attemptId, questionId, value, elapsed);
    }
  };



  if (viewState === 'START') {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-12 text-center">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This assessment has a strict time limit of {Math.floor(timeLimitSeconds / 60)} minutes. 
          Once you start, the timer cannot be paused.
        </p>
        <button 
          onClick={handleStart}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors"
        >
          Start Assessment
        </button>
      </div>
    );
  }

  if (viewState === 'RESULTS') {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Assessment Complete</h1>
        <div className="text-6xl mb-6">
          {results?.is_passed ? '🎉' : '📚'}
        </div>
        <p className="text-xl font-semibold mb-2">Score: {results?.score} / {results?.max_score}</p>
        <p className={`text-lg font-bold ${results?.is_passed ? 'text-green-500' : 'text-red-500'}`}>
          {results?.is_passed ? 'PASSED' : 'NOT PASSED'}
        </p>
        <p className="mt-6 text-gray-500">Your XP and learning progress have been updated!</p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="mt-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 mt-8 p-4">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-1/4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
        <div className="text-center mb-6">
          <div className="text-sm text-gray-500 uppercase tracking-wide">Time Remaining</div>
          <div className={`text-3xl font-mono font-bold ${timeRemaining < 60 ? 'text-red-500 animate-pulse' : 'text-gray-800 dark:text-white'}`}>
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        </div>
        
        <h3 className="font-semibold mb-3 border-b pb-2">Questions</h3>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {questions.map((_: any, idx: number) => {
            const isAnswered = !!answers[_.id];
            const isCurrent = idx === currentQuestionIndex;
            return (
              <button
                key={idx}
                onClick={() => { setViewState('IN_PROGRESS'); setCurrentQuestionIndex(idx); }}
                className={`h-10 rounded text-sm font-semibold flex items-center justify-center transition-colors
                  ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  ${isAnswered ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'}
                `}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        
        <button 
          onClick={() => setViewState('REVIEW')}
          className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
        >
          Review & Submit
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow">
        {viewState === 'IN_PROGRESS' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-blue-500 font-medium">{Math.round((answeredCount / questions.length) * 100)}% Answered</span>
            </div>
            
            <h2 className="text-xl font-semibold mb-6">{currentQ.text}</h2>
            
            <div className="space-y-3 mb-8">
              {currentQ.options?.map((opt: string, i: number) => (
                <label key={i} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${answers[currentQ.id] === opt ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                  <input 
                    type="radio" 
                    name={currentQ.id} 
                    value={opt}
                    checked={answers[currentQ.id] === opt}
                    onChange={() => handleAnswerChange(currentQ.id, opt)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3">{opt}</span>
                </label>
              ))}
            </div>
            
            <div className="flex justify-between mt-auto">
              <button 
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 font-medium text-gray-600 disabled:opacity-50"
              >
                Previous
              </button>
              {currentQuestionIndex < questions.length - 1 ? (
                <button 
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700"
                >
                  Next Question
                </button>
              ) : (
                <button 
                  onClick={() => setViewState('REVIEW')}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700"
                >
                  Review Answers
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Submit?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && " You still have unanswered questions!"}
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setViewState('IN_PROGRESS')}
                className="px-6 py-2 border border-gray-300 font-medium rounded-lg hover:bg-gray-50"
              >
                Return to Assessment
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Final Submit'}
              </button>
            </div>
            {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg whitespace-pre-wrap">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
