'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { CodingQuestion } from '@/lib/codingQuestions';
import { supabase } from '@/lib/supabase';
import { useLeaderboardStream } from '@/lib/useLeaderboardStream';

type Contest = {
  id: string;
  title: string;
  description: string | null;
  mode: 'public' | 'private';
  duration_minutes: number;
  status: string;
  starts_at: string | null;
  created_at: string;
};

type ContestApiPayload = {
  contest?: Contest;
  participants?: Array<{ user_id: string; joined_at: string; finished_at: string | null; score: number | null; rank: number | null }>;
  contestQuestionIds?: string[];
  isOwner?: boolean;
  isParticipant?: boolean;
  questionSetLocked?: boolean;
  leaderboard?: Array<{
    rank: number;
    userId: string;
    name: string | null;
    email: string | null;
    score: number;
    joinedAt: string | null;
    finishedAt: string | null;
    timeTakenSeconds?: number | null;
    avgMemoryKb?: number;
    avgRuntimeMs?: number;
    totalCodeChars?: number;
    timedOut?: boolean;
  }>;
  submissionStats?: {
    attemptedCount: number;
    acceptedCount: number;
    acceptedQuestionIds: string[];
  };
  error?: string;
  details?: string;
};

type CompletionSummary = {
  rating: number;
  acceptanceRate: number;
  acceptedCount: number;
  attemptedCount: number;
  timeTakenSeconds?: number | null;
  timeTakenMinutes?: number | null;
  questionBreakdown?: Array<{
    questionId: string;
    attempts: number;
    accepted: boolean;
    lastResult: string;
  }>;
  suggestions: string[];
  timedOut: boolean;
};

type AttemptState = {
  startedAt: string;
  endsAt: string;
  selectedQuestionIds: string[];
  finished: boolean;
};



function contestGrade(points: number, totalQuestions: number): string {
  const safeTotal = Math.max(1, totalQuestions);
  const ratio = Math.max(0, points) / safeTotal;
  if (ratio >= 0.9) return 'A+';
  if (ratio >= 0.75) return 'A';
  if (ratio >= 0.6) return 'B';
  if (ratio >= 0.4) return 'C';
  return 'D';
}

const AUTO_FINALIZE_SECONDS = 0;

function timerColor(seconds: number | null, isDark: boolean): string {
  if (seconds === null) return isDark ? 'text-white/75' : 'text-black/75';
  if (seconds <= 0) return isDark ? 'text-red-300' : 'text-red-700';
  if (seconds <= 5 * 60) return isDark ? 'text-red-300' : 'text-red-700';
  if (seconds <= 10 * 60) return isDark ? 'text-orange-300' : 'text-orange-700';
  if (seconds <= 15 * 60) return isDark ? 'text-amber-300' : 'text-amber-700';
  return isDark ? 'text-emerald-300' : 'text-emerald-700';
}

function formatTime(seconds: number | null): string {
  if (seconds === null) return '--:--:--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDurationSeconds(totalSeconds: number | null | undefined): string {
  if (typeof totalSeconds !== 'number' || !Number.isFinite(totalSeconds)) return '-';
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function remainingSecondsFromEndsAt(endsAt: string): number {
  const endMs = Date.parse(endsAt);
  if (!Number.isFinite(endMs)) return 0;
  return Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
}

function difficultyBadgeClass(difficulty: string, isDark: boolean): string {
  const level = difficulty.toLowerCase();
  if (level === 'easy') {
    return isDark ? 'bg-emerald-500/25 text-emerald-200' : 'bg-emerald-100 text-emerald-700';
  }
  if (level === 'medium') {
    return isDark ? 'bg-orange-500/25 text-orange-200' : 'bg-orange-100 text-orange-700';
  }
  if (level === 'hard') {
    return isDark ? 'bg-red-500/25 text-red-200' : 'bg-red-100 text-red-700';
  }
  return isDark ? 'bg-white/15 text-white' : 'bg-black/10 text-black';
}

function evaluateQuestionReadiness(question: CodingQuestion): { ready: boolean; reason: string } {
  if (!String(question.title || '').trim()) {
    return { ready: false, reason: 'Missing title' };
  }

  if (!String(question.description || '').trim()) {
    return { ready: false, reason: 'Missing description' };
  }

  if (!Array.isArray(question.testcases) || question.testcases.length === 0) {
    return { ready: false, reason: 'Missing test cases' };
  }

  const hasBadCase = question.testcases.some((tc) => !String(tc.input || '').trim() || !String(tc.expectedOutput || '').trim());
  if (hasBadCase) {
    return { ready: false, reason: 'Invalid test case data' };
  }

  return { ready: true, reason: 'Ready' };
}

export default function ContestWorkspacePage() {
  const params = useParams<{ id?: string | string[] }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contestId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [fixedContestQuestionIds, setFixedContestQuestionIds] = useState<string[]>([]);
  const [attemptState, setAttemptState] = useState<AttemptState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submittingSummary, setSubmittingSummary] = useState(false);
  const [completionSummary, setCompletionSummary] = useState<CompletionSummary | null>(null);
  const [acceptedQuestionIds, setAcceptedQuestionIds] = useState<string[]>([]);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [isLeaderboardFrozen, setIsLeaderboardFrozen] = useState(false);
  const [questionSetLocked, setQuestionSetLocked] = useState(false);
  const [creatorDraftQuestionIds, setCreatorDraftQuestionIds] = useState<string[]>([]);
  const [savingCreatorQuestions, setSavingCreatorQuestions] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryDifficulty, setLibraryDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [libraryCodingPattern, setLibraryCodingPattern] = useState('all');
  const [libraryAptitudeTopic, setLibraryAptitudeTopic] = useState('all');
  const [libraryReasoningTopic, setLibraryReasoningTopic] = useState('all');
  const [libraryCompany, setLibraryCompany] = useState('all');
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [createQuestionForm, setCreateQuestionForm] = useState({
    title: '',
    difficulty: 'easy',
    description: '',
    topics: '',
    testcases: [{ input: '', expectedOutput: '' }],
  });
  const leaderboardRef = useRef<HTMLDivElement | null>(null);
  const autoFinalizeTriggeredRef = useRef(false);

  // Use SSE for real-time leaderboard updates
  const { leaderboard, isConnected: leaderboardConnected } = useLeaderboardStream(contestId);

  const storageKey = contestId ? `contest-attempt:${contestId}` : null;
  const safeDurationMinutes = useMemo(() => {
    const raw = Number(contest?.duration_minutes || 0);
    if (!Number.isFinite(raw) || raw <= 0) return 90;
    return Math.floor(raw);
  }, [contest?.duration_minutes]);

  const contestCategory = useMemo(() => {
    const desc = contest?.description || '';
    const match = desc.match(/^\[(coding|sql|aptitude|combined)\]/i);
    return match ? match[1].toLowerCase() : 'coding';
  }, [contest?.description]);

  const cleanDescription = useMemo(() => {
    const desc = contest?.description || '';
    const match = desc.match(/^\[(coding|sql|aptitude|combined)\]\s*(.*)/i);
    return match ? match[2] : desc;
  }, [contest?.description]);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute('data-theme') === 'dark');
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const contestRes = await fetch(`/api/contests/${contestId}`);
        const contestData = (await contestRes.json().catch(() => ({}))) as ContestApiPayload;

        if (!contestRes.ok) {
          const errorDetails = contestData.details || contestData.error || `HTTP ${contestRes.status}`;
          throw new Error(`Failed to load contest: ${errorDetails}`);
        }

        if (cancelled) return;
        setContest(contestData.contest ?? null);
        setQuestionSetLocked(Boolean(contestData.questionSetLocked));
        const fixedQuestionIds = Array.isArray(contestData.contestQuestionIds) ? contestData.contestQuestionIds : [];
        const canManageContest = Boolean(contestData.isOwner);
        setIsOwner(canManageContest);

        if (contestData.contest?.mode === 'public' && !canManageContest) {
          void fetch(`/api/contests/${contestId}/join`, { method: 'POST' });
        }

        if (fixedQuestionIds.length > 0) {
          setFixedContestQuestionIds(fixedQuestionIds);
          setSelectedQuestionIds(fixedQuestionIds);
          setCreatorDraftQuestionIds(fixedQuestionIds);
        } else {
          setFixedContestQuestionIds([]);
          setCreatorDraftQuestionIds([]);
        }
        // Leaderboard now loaded via SSE stream in useLeaderboardStream hook
        setAcceptedQuestionIds(contestData.submissionStats?.acceptedQuestionIds || []);
        setAttemptedCount(contestData.submissionStats?.attemptedCount || 0);

        setLoading(false);

        if (storageKey) {
          const raw = localStorage.getItem(storageKey);
          const contestStatus = String(contestData.contest?.status || "").toLowerCase();
          if (contestStatus === "completed" || contestStatus === "ended" || contestStatus === "cancelled") {
            localStorage.removeItem(storageKey);
            setAttemptState(null);
            setTimeRemaining(null);
            setCompletionSummary(null);
          }
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as AttemptState;
              if (parsed && parsed.startedAt && parsed.endsAt && Array.isArray(parsed.selectedQuestionIds)) {
                const endMs = Date.parse(parsed.endsAt);
                const expired = !Number.isFinite(endMs) || endMs <= Date.now();
                if (parsed.finished || expired) {
                  localStorage.removeItem(storageKey);
                  setAttemptState(null);
                  if (fixedQuestionIds.length > 0) {
                    setSelectedQuestionIds(fixedQuestionIds);
                  }
                } else {
                  setAttemptState(parsed);
                  setTimeRemaining(remainingSecondsFromEndsAt(parsed.endsAt));
                  setSelectedQuestionIds(parsed.selectedQuestionIds);
                }
              }
            } catch {
              // Ignore malformed local storage
            }
          }
        }

        setQuestionsLoading(true);
        const questionsRes = await fetch('/api/questions?limit=300');
        const questionsData = await questionsRes.json().catch(() => ({}));
        if (cancelled) return;
        if (questionsRes.ok) {
          const qs = Array.isArray(questionsData.questions) ? (questionsData.questions as CodingQuestion[]) : [];
          const questionMap = new Map(qs.map((q) => [q.id, q]));
          const requiredIds = fixedQuestionIds.length > 0 ? fixedQuestionIds : [];

          for (const qid of requiredIds) {
            if (questionMap.has(qid)) continue;
            const byIdRes = await fetch(`/api/questions/${qid}`);
            const byIdData = await byIdRes.json().catch(() => ({}));
            const byIdQuestion = (byIdData as { question?: CodingQuestion }).question;
            if (byIdRes.ok && byIdQuestion?.id) questionMap.set(byIdQuestion.id, byIdQuestion);
          }

          setQuestions(Array.from(questionMap.values()));
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load contest workspace');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setQuestionsLoading(false);
        }
      }
    };

    if (contestId) {
      void load();
    } else {
      setLoading(false);
      setError('Invalid contest id');
    }

    return () => {
      cancelled = true;
    };
  }, [contestId, storageKey]);

  useEffect(() => {
    if (!attemptState || attemptState.finished) {
      setTimeRemaining(null);
      return;
    }

    const tick = () => {
      const seconds = remainingSecondsFromEndsAt(attemptState.endsAt);
      setTimeRemaining(seconds);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [attemptState]);

  useEffect(() => {
    const hasOpenModal = showLibraryModal || showCreateModal;
    if (!hasOpenModal) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowLibraryModal(false);
        setShowCreateModal(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showCreateModal, showLibraryModal]);

  useEffect(() => {
    if (!successToast) return;
    const timer = window.setTimeout(() => setSuccessToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [successToast]);





  useEffect(() => {
    if (!attemptState || attemptState.finished) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [attemptState]);



  const isContestStarted = Boolean(attemptState) && !attemptState?.finished;
  const isTimeOver =
    isContestStarted &&
    Number.isFinite(Date.parse(attemptState?.endsAt || '')) &&
    Date.now() >= Date.parse(attemptState?.endsAt || '') &&
    timeRemaining !== null &&
    timeRemaining <= AUTO_FINALIZE_SECONDS;
  const isReadOnly =
    contest?.status === 'completed' ||
    contest?.status === 'ended' ||
    (attemptState ? attemptState.finished : false) ||
    isTimeOver;
  const effectiveSelectedQuestionIds = useMemo(() => {
    if (Array.isArray(attemptState?.selectedQuestionIds) && attemptState.selectedQuestionIds.length > 0) {
      return attemptState.selectedQuestionIds;
    }
    if (fixedContestQuestionIds.length > 0) return fixedContestQuestionIds;
    return selectedQuestionIds;
  }, [attemptState?.selectedQuestionIds, fixedContestQuestionIds, selectedQuestionIds]);

  const contestEndAt = useMemo(() => {
    if (!attemptState?.startedAt) return null;
    const startedMs = Date.parse(attemptState.startedAt);
    if (!Number.isFinite(startedMs)) return null;
    return new Date(startedMs + safeDurationMinutes * 60 * 1000);
  }, [attemptState?.startedAt, safeDurationMinutes]);

  const joinedParticipants = useMemo(() => {
    const seen = new Set<string>();
    return leaderboard
      .filter((row) => {
        if (!row.userId || seen.has(row.userId)) return false;
        seen.add(row.userId);
        return true;
      })
      .sort((a, b) => {
        const aTime = a.joinedAt ? Date.parse(a.joinedAt) : Number.MAX_SAFE_INTEGER;
        const bTime = b.joinedAt ? Date.parse(b.joinedAt) : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
  }, [leaderboard]);



  const codingPatternOptions = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) {
      if (q.input_type !== 'aptitude') {
        for (const t of q.topic || []) set.add(String(t || '').toLowerCase());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const aptitudeTopicOptions = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) {
      if (q.input_type === 'aptitude') {
        for (const t of q.topic || []) {
          const lower = String(t || '').toLowerCase();
          if (!lower.includes('reasoning') && !lower.includes('logic') && lower !== 'aptitude') {
            set.add(lower);
          }
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const reasoningTopicOptions = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) {
      if (q.input_type === 'aptitude') {
        for (const t of q.topic || []) {
          const lower = String(t || '').toLowerCase();
          if (lower.includes('reasoning') || lower.includes('logic')) {
            set.add(lower);
          }
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const companyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) {
      for (const c of q.company_tags || []) set.add(String(c || '').toLowerCase());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const libraryQuestions = useMemo(() => {
    return questions.filter((q) => {
      const bySearch = !librarySearch || q.title.toLowerCase().includes(librarySearch.toLowerCase());
      const byDifficulty = libraryDifficulty === 'all' || q.difficulty.toLowerCase() === libraryDifficulty;
      const byCompany = libraryCompany === 'all' || (q.company_tags || []).map((x) => x.toLowerCase()).includes(libraryCompany);
      
      const qTopics = (q.topic || []).map((x) => x.toLowerCase());
      const matchCoding = libraryCodingPattern === 'all' || qTopics.includes(libraryCodingPattern);
      const matchAptitude = libraryAptitudeTopic === 'all' || qTopics.includes(libraryAptitudeTopic);
      const matchReasoning = libraryReasoningTopic === 'all' || qTopics.includes(libraryReasoningTopic);

      return bySearch && byDifficulty && byCompany && matchCoding && matchAptitude && matchReasoning;
    });
  }, [questions, librarySearch, libraryDifficulty, libraryCodingPattern, libraryAptitudeTopic, libraryReasoningTopic, libraryCompany]);

  const creatorPreviewQuestions = useMemo(
    () => questions.filter((q) => creatorDraftQuestionIds.includes(q.id)),
    [creatorDraftQuestionIds, questions]
  );

  const ownerPrimaryQuestions = useMemo(() => {
    const ids = fixedContestQuestionIds.length > 0 ? fixedContestQuestionIds : creatorDraftQuestionIds;
    return questions.filter((q) => ids.includes(q.id));
  }, [creatorDraftQuestionIds, fixedContestQuestionIds, questions]);

  useEffect(() => {
    if (!attemptState || attemptState.finished) return;
    if (attemptState.selectedQuestionIds.length > 0) return;
    if (fixedContestQuestionIds.length === 0) return;

    const repairedAttempt: AttemptState = {
      ...attemptState,
      selectedQuestionIds: fixedContestQuestionIds,
    };

    setAttemptState(repairedAttempt);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(repairedAttempt));
    }
  }, [attemptState, fixedContestQuestionIds, storageKey]);

  function toggleQuestionSelection(questionId: string) {
    if (isContestStarted) return;
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  }

  function startContestNow() {
    if (!contest || !storageKey) return;
    if (fixedContestQuestionIds.length === 0) {
      setError(isOwner
        ? 'Contest creator/admin must add contest questions in workspace before starting.'
        : 'Contest question set is not published yet. Wait for creator/admin to save the set.');
      return;
    }
    const startSelection = fixedContestQuestionIds.length > 0 ? fixedContestQuestionIds : selectedQuestionIds;
    if (startSelection.length === 0) {
      setError('Select at least one question to start the contest.');
      return;
    }

    const startedAt = new Date().toISOString();
    const endsAt = new Date(Date.now() + safeDurationMinutes * 60 * 1000).toISOString();
    const nextAttempt: AttemptState = {
      startedAt,
      endsAt,
      selectedQuestionIds: startSelection,
      finished: false,
    };

    localStorage.setItem(storageKey, JSON.stringify(nextAttempt));
    setSelectedQuestionIds(startSelection);
    setTimeRemaining(remainingSecondsFromEndsAt(endsAt));
    setAttemptState(nextAttempt);
    autoFinalizeTriggeredRef.current = false;
    setCompletionSummary(null);
    setError(null);
  }

  const handleComplete = useCallback(
    async (timedOut = false) => {
      if (!contestId || !attemptState || submittingSummary) return;

      try {
        setSubmittingSummary(true);
        setError(null);

        const res = await fetch(`/api/contests/${contestId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedQuestionIds: effectiveSelectedQuestionIds,
            attemptedCount,
            acceptedCount: acceptedQuestionIds.length,
            acceptedQuestionIds,
            startedAt: attemptState.startedAt,
            endedAt: new Date().toISOString(),
            timedOut,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to complete contest');

        const summary = data.summary as CompletionSummary;
        setCompletionSummary(summary);

        const finishedAttempt: AttemptState = {
          ...attemptState,
          finished: true,
        };
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(finishedAttempt));
        setAttemptState(finishedAttempt);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to complete contest');
      } finally {
        setSubmittingSummary(false);
      }
    },
    [acceptedQuestionIds, attemptState, attemptedCount, contestId, effectiveSelectedQuestionIds, storageKey, submittingSummary]
  );

  useEffect(() => {
    if (!isTimeOver || !attemptState || completionSummary || autoFinalizeTriggeredRef.current) return;
    autoFinalizeTriggeredRef.current = true;
    void handleComplete(true);
  }, [attemptState, completionSummary, handleComplete, isTimeOver]);

  useEffect(() => {
    if (!attemptState || attemptState.finished) {
      autoFinalizeTriggeredRef.current = false;
    }
  }, [attemptState]);

  useEffect(() => {
    const viewParam = searchParams?.get('view');
    const shouldAutoScroll = (attemptState?.finished || completionSummary) || viewParam === 'results';
    
    if (!shouldAutoScroll) return;
    
    const timer = window.setTimeout(() => {
      leaderboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [attemptState?.finished, completionSummary, searchParams]);

  function openQuestion(q: CodingQuestion) {
    if (!contestId || !attemptState || isReadOnly) return;
    if (!effectiveSelectedQuestionIds.includes(q.id)) return;

    router.push(
      `/question/${q.id}?contestId=${contestId}&contestEndsAt=${encodeURIComponent(attemptState.endsAt)}&contestStartedAt=${encodeURIComponent(attemptState.startedAt)}`
    );
  }

  async function saveCreatorQuestions() {
    if (!contestId) return;
    if (creatorDraftQuestionIds.length === 0) {
      setError('Select at least one question and save it to contest.');
      return;
    }

    try {
      setSavingCreatorQuestions(true);
      setError(null);
      const res = await fetch(`/api/contests/${contestId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: creatorDraftQuestionIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save contest questions');

      setFixedContestQuestionIds(creatorDraftQuestionIds);
      setSelectedQuestionIds(creatorDraftQuestionIds);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save contest questions');
    } finally {
      setSavingCreatorQuestions(false);
    }
  }

  const reloadQuestionCatalog = useCallback(async () => {
    try {
      const qRes = await fetch('/api/questions?limit=300');
      const qData = await qRes.json().catch(() => ({}));
      if (!qRes.ok) throw new Error(qData.error || 'Failed to reload questions');
      const qs = Array.isArray(qData.questions) ? (qData.questions as CodingQuestion[]) : [];
      setQuestions(qs);
      if (qs.length > 0 && creatorDraftQuestionIds.length === 0 && fixedContestQuestionIds.length === 0) {
        setCreatorDraftQuestionIds([qs[0].id]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reload questions');
    }
  }, [creatorDraftQuestionIds.length, fixedContestQuestionIds.length]);

  async function createCustomQuestion() {
    const nextErrors: Record<string, string> = {};
    if (!createQuestionForm.title.trim()) nextErrors.title = 'Title is required.';
    if (!createQuestionForm.description.trim()) nextErrors.description = 'Description is required.';
    if (!createQuestionForm.topics.trim()) nextErrors.topics = 'Add at least one topic.';

    const hasBadCase = createQuestionForm.testcases.some(
      (tc) => !tc.input.trim() || !tc.expectedOutput.trim()
    );
    if (createQuestionForm.testcases.length === 0 || hasBadCase) {
      nextErrors.testcases = 'Each test case must have both input and expected output.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setCreateFormErrors(nextErrors);
      return;
    }

    try {
      setCreatingQuestion(true);
      setCreateFormErrors({});
      setError(null);

      const topicList = createQuestionForm.topics
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: createQuestionForm.title,
        difficulty: createQuestionForm.difficulty,
        description: createQuestionForm.description,
        topic: topicList,
        testcases: createQuestionForm.testcases,
      };

      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create question');

      await reloadQuestionCatalog();
      if (data.question?.id) {
        setCreatorDraftQuestionIds((prev) => (prev.includes(data.question.id) ? prev : [...prev, data.question.id]));
      }
      setShowCreateModal(false);
      const validationNote = data.validation?.aiSummary ? ` AI: ${data.validation.aiSummary}` : '';
      setSuccessToast(`Question created and added to your contest draft.${validationNote}`);
      setCreateQuestionForm({
        title: '',
        difficulty: 'easy',
        description: '',
        topics: '',
        testcases: [{ input: '', expectedOutput: '' }],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setCreatingQuestion(false);
    }
  }

  return (
    <main className={`min-h-screen px-4 pb-10 pt-4 md:px-6 ${isDark ? 'bg-black text-white' : 'bg-slate-50 text-black'}`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/contests"
            className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold ${
              isDark ? 'border-white/20 bg-white/8 hover:bg-white/15' : 'border-black/15 bg-white hover:bg-black/5'
            }`}
          >
            Back To Contests
          </Link>
        </div>

        {loading && <p className={isDark ? 'text-white/70' : 'text-black/70'}>Loading contest workspace...</p>}
        {error && <p className={`text-sm ${isDark ? 'text-white/80' : 'text-black/75'}`}>{error}</p>}

        {!loading && !error && contest && (
          <section className={`space-y-5 rounded-3xl border p-6 md:p-7 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Contest Workspace • <span className="text-cyan-400 font-bold">{contestCategory.toUpperCase()} ROUND</span>
                </p>
                <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{contest.title}</h1>
                {cleanDescription && (
                  <p className={`mt-2 text-sm ${isDark ? 'text-white/75' : 'text-black/70'}`}>{cleanDescription}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl border px-4 py-3 text-center ${isDark ? 'border-white/10 bg-black/40' : 'border-black/10 bg-white'}`}>
                  <p className={`text-xs uppercase tracking-wide font-semibold ${timerColor(timeRemaining, isDark)}`}>
                    {attemptState ? (attemptState.finished ? 'Finalized' : (isTimeOver ? 'Time Exceeded' : 'Time Left')) : 'Duration'}
                  </p>
                  <p className={`mt-2 font-mono text-3xl font-bold ${timerColor(timeRemaining, isDark)}`}>
                    {attemptState ? (attemptState.finished ? formatTime(0) : formatTime(timeRemaining)) : formatTime(safeDurationMinutes * 60)}
                  </p>
                </div>


              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`rounded-xl border px-4 py-3 ${isDark ? 'border-white/10 bg-black/35' : 'border-black/10 bg-white'}`}>
                <p className={`text-[11px] uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>Selected</p>
                <p className="mt-1 text-lg font-semibold">{effectiveSelectedQuestionIds.length}</p>
              </div>
              <div className={`rounded-xl border px-4 py-3 ${isDark ? 'border-white/10 bg-black/35' : 'border-black/10 bg-white'}`}>
                <p className={`text-[11px] uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>Accepted</p>
                <p className="mt-1 text-lg font-semibold">{acceptedQuestionIds.length}</p>
              </div>
              <div className={`rounded-xl border px-4 py-3 ${isDark ? 'border-white/10 bg-black/35' : 'border-black/10 bg-white'}`}>
                <p className={`text-[11px] uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>Attempts</p>
                <p className="mt-1 text-lg font-semibold">{attemptedCount}</p>
              </div>
              <div className={`rounded-xl border px-4 py-3 ${isDark ? 'border-white/10 bg-black/35' : 'border-black/10 bg-white'}`}>
                <p className={`text-[11px] uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>Participants</p>
                <p className="mt-1 text-lg font-semibold">{joinedParticipants.length}</p>
              </div>
            </div>

            {completionSummary && (
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/20 bg-white/5' : 'border-black/15 bg-black/5'}`}>
                <p className="text-sm font-semibold">{completionSummary.timedOut ? 'Your time exceeded.' : 'Contest completed successfully.'}</p>
                <p className="mt-1 text-sm">Rating: <strong>{completionSummary.rating}</strong> | Accuracy: <strong>{completionSummary.acceptanceRate}%</strong></p>
                <p className="mt-1 text-sm">Time To Finish: <strong>{formatDurationSeconds(completionSummary.timeTakenSeconds)}</strong>{typeof completionSummary.timeTakenMinutes === 'number' ? ` (${completionSummary.timeTakenMinutes} min)` : ''}</p>
                <p className="mt-1 text-sm">Accepted: {completionSummary.acceptedCount} / Attempted: {completionSummary.attemptedCount}</p>
                {completionSummary.questionBreakdown && completionSummary.questionBreakdown.length > 0 && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="font-semibold">Question-by-question analysis</p>
                    {completionSummary.questionBreakdown.map((item) => (
                      <div key={`qa-${item.questionId}`} className={`rounded-lg border px-3 py-2 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-white'}`}>
                        <p>Question: {item.questionId}</p>
                        <p>Attempts: {item.attempts} | Last Result: {item.lastResult} | Passed: {item.accepted ? 'Yes' : 'No'}</p>
                      </div>
                    ))}
                  </div>
                )}
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {completionSummary.suggestions.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-[1.75fr_1fr]">
              <div className={`rounded-2xl border p-4 lg:p-5 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold">Curated Contest Set</h2>
                  <span className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    {isOwner && !attemptState ? ownerPrimaryQuestions.length : effectiveSelectedQuestionIds.length} selected
                  </span>
                </div>

                {isOwner && !attemptState ? (
                  ownerPrimaryQuestions.length === 0 ? (
                    <div className={`rounded-xl border p-3 text-sm ${isDark ? 'border-white/15 bg-black/40 text-white/80' : 'border-black/10 bg-white text-black/75'}`}>
                      No curated questions yet. Open Question Library below and add questions to build your contest set.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {ownerPrimaryQuestions.map((q) => (
                        <div
                          key={`owner-primary-${q.id}`}
                          className={
                            isDark
                              ? 'rounded-xl border border-white/15 bg-black/40 px-3 py-2.5'
                              : 'rounded-xl border border-black/10 bg-white px-3 py-2.5'
                          }
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold">{q.title}</p>
                            {(() => {
                              const readiness = evaluateQuestionReadiness(q);
                              return (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${readiness.ready ? (isDark ? 'bg-emerald-500/20 text-emerald-200' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'bg-rose-500/20 text-rose-200' : 'bg-rose-100 text-rose-700')}`} title={readiness.reason}>
                                  {readiness.ready ? 'Ready' : 'Invalid'}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${difficultyBadgeClass(q.difficulty, isDark)}`}>
                              {q.difficulty}
                            </span>
                            {(q.topic || []).slice(0, 4).map((tag) => (
                              <span key={`owner-topic-${q.id}-${tag}`} className={`rounded-full px-2 py-0.5 text-[10px] ${isDark ? 'bg-white/10 text-white/75' : 'bg-black/5 text-black/70'}`}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : questionsLoading ? (
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>Loading contest questions...</p>
                ) : questions.length === 0 ? (
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>No questions available yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {(fixedContestQuestionIds.length > 0
                      ? questions.filter((q) => fixedContestQuestionIds.includes(q.id))
                      : questions
                    ).map((q) => {
                      const checked = effectiveSelectedQuestionIds.includes(q.id);
                      const isAccepted = acceptedQuestionIds.includes(q.id);
                      const fixedSelection = fixedContestQuestionIds.length > 0;
                      const canChangeQuestionSelection = isOwner && !attemptState && !fixedSelection;
                      const disabledBySelection = attemptState && !checked;

                      return (
                        <div
                          key={q.id}
                          className={
                            isDark
                              ? 'rounded-xl border border-white/15 bg-black/40 px-3 py-2.5'
                              : 'rounded-xl border border-black/10 bg-white px-3 py-2.5'
                          }
                        >
                          <div className="flex items-start justify-between gap-2">
                            <label className="flex cursor-pointer items-start gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!canChangeQuestionSelection}
                                onChange={() => toggleQuestionSelection(q.id)}
                                className="mt-1"
                              />
                              <span>
                                {q.title}
                                <span className={`ml-2 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>{q.difficulty}</span>
                              </span>
                            </label>
                            <div className="flex flex-col items-end gap-1">
                              {isAccepted && <span className={`text-xs font-semibold ${isDark ? 'text-white/80' : 'text-black/80'}`}>Accepted</span>}
                              {(() => {
                                const readiness = evaluateQuestionReadiness(q);
                                return (
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${readiness.ready ? (isDark ? 'bg-emerald-500/20 text-emerald-200' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'bg-rose-500/20 text-rose-200' : 'bg-rose-100 text-rose-700')}`} title={readiness.reason}>
                                    {readiness.ready ? 'Ready' : 'Invalid'}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                          {attemptState && checked && (
                            <div className="mt-2">
                              <button
                                type="button"
                                disabled={isReadOnly || submittingSummary}
                                onClick={() => openQuestion(q)}
                                className={
                                  isDark
                                    ? 'rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20 disabled:opacity-50'
                                    : 'rounded-lg border border-black/15 bg-white px-3 py-1 text-xs font-semibold hover:bg-black/5 disabled:opacity-50'
                                }
                              >
                                Solve Now
                              </button>
                            </div>
                          )}

                          {attemptState && disabledBySelection && (
                            <p className={`mt-1 text-[11px] ${isDark ? 'text-white/55' : 'text-black/55'}`}>
                              Not part of your started contest selection.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={`rounded-2xl border p-4 lg:sticky lg:top-4 lg:self-start ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
                <h2 className="text-base font-semibold">Contest Control</h2>
                <p className={`mt-2 text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                  Select questions first, then click Start Now. After time ends, submissions are locked and result is finalized.
                </p>
                {!isOwner && fixedContestQuestionIds.length === 0 && !attemptState && (
                  <p className={`mt-2 text-xs ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>
                    You cannot edit this contest. Waiting for creator/admin to publish the contest question set.
                  </p>
                )}
                <p className={`mt-2 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Duration: {safeDurationMinutes} minutes
                </p>
                {attemptState?.startedAt && (
                  <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    Started: {new Date(attemptState.startedAt).toLocaleString()}
                  </p>
                )}
                {contestEndAt && (
                  <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    Contest Stops At: {contestEndAt.toLocaleString()}
                  </p>
                )}
                <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Accepted: {acceptedQuestionIds.length} | Attempts logged: {attemptedCount}
                </p>
                {attemptState && !isReadOnly && (
                  <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    Contest timer runs continuously after Start. Leaving this page will not pause time.
                  </p>
                )}

                {!attemptState ? (
                  <button
                    type="button"
                    onClick={startContestNow}
                    disabled={(fixedContestQuestionIds.length > 0 ? fixedContestQuestionIds.length : selectedQuestionIds.length) === 0 || (!isOwner && fixedContestQuestionIds.length === 0)}
                    className={
                      isDark
                        ? 'mt-4 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50'
                        : 'mt-4 w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-50'
                    }
                  >
                    Start Now
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleComplete(isReadOnly)}
                    disabled={isReadOnly || submittingSummary}
                    className={
                      isDark
                        ? 'mt-4 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50'
                        : 'mt-4 w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-50'
                    }
                  >
                    {isReadOnly ? 'Contest Finalized' : submittingSummary ? 'Finalizing...' : 'Finish Contest'}
                  </button>
                )}

                {isTimeOver && !completionSummary && (
                  <p className={`mt-2 text-xs ${isDark ? 'text-white/75' : 'text-black/70'}`}>Time is over. Auto-submitting and preparing full analysis...</p>
                )}
                {attemptState?.finished && (
                  <p className={`mt-2 text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    Attempt is finalized. See leaderboard below for final rank and results.
                  </p>
                )}

                <div className={`mt-4 rounded-xl border p-3 ${isDark ? 'border-white/15 bg-black/40' : 'border-black/10 bg-white'}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">Joined Users</p>
                  <p className={`mt-1 text-[11px] ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                    {joinedParticipants.length} participant{joinedParticipants.length === 1 ? '' : 's'} joined this contest.
                  </p>
                  {joinedParticipants.length === 0 ? (
                    <p className={`mt-2 text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>No one has joined yet.</p>
                  ) : (
                    <div className="mt-2 max-h-36 space-y-1 overflow-y-auto pr-1">
                      {joinedParticipants.slice(0, 30).map((row) => (
                        <div key={`joined-${row.userId}`} className={`flex items-center justify-between rounded-md px-2 py-1 text-xs ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                          <span className="truncate pr-2">{row.name || row.email || 'Participant'}</span>
                          <span className={isDark ? 'text-white/60' : 'text-black/60'}>{row.joinedAt ? new Date(row.joinedAt).toLocaleTimeString() : '-'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


              </div>
            </div>

            {isOwner && !attemptState && (
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/20 bg-white/5' : 'border-black/15 bg-black/5'}`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold">Creator Question Setup (Mandatory)</h2>
                  <span className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>{creatorDraftQuestionIds.length} selected</span>
                </div>
                {questionSetLocked && (
                  <div className={`mb-3 rounded-lg border px-3 py-2 text-xs ${isDark ? 'border-white/20 bg-white/10 text-white/80' : 'border-black/15 bg-white text-black/75'}`}>
                    Question Set Locked: participants already joined this contest, so creator edits are disabled.
                  </div>
                )}
                <p className={`mb-3 text-xs ${isDark ? 'text-white/65' : 'text-black/65'}`}>
                  Save your contest questions here. Participants can only solve this saved set.
                </p>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLibraryModal(true);
                      void reloadQuestionCatalog();
                    }}
                    disabled={questionSetLocked}
                    className={isDark ? 'rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50' : 'rounded-lg border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-black/5 disabled:opacity-50'}
                  >
                    Open Question Library
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    disabled={questionSetLocked}
                    className={isDark ? 'rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50' : 'rounded-lg border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-black/5 disabled:opacity-50'}
                  >
                    Create New Question
                  </button>

                </div>
                <div className={`rounded-xl border p-3 ${isDark ? 'border-white/10 bg-black/40' : 'border-black/10 bg-white'}`}>
                  {creatorPreviewQuestions.length === 0 ? (
                    <p className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                      No questions selected yet. Open Question Library and add questions to your contest set.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {creatorPreviewQuestions.slice(0, 12).map((q) => (
                        <span key={`selected-${q.id}`} className={`rounded-lg border px-2 py-1 text-xs ${isDark ? 'border-white/20 bg-white/10' : 'border-black/15 bg-black/5'}`}>
                          {q.title}
                        </span>
                      ))}
                      {creatorPreviewQuestions.length > 12 && (
                        <span className={`rounded-lg border px-2 py-1 text-xs ${isDark ? 'border-white/20 bg-white/10' : 'border-black/15 bg-black/5'}`}>
                          +{creatorPreviewQuestions.length - 12} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void saveCreatorQuestions()}
                    disabled={questionSetLocked || savingCreatorQuestions || creatorDraftQuestionIds.length === 0}
                    className={
                      isDark
                        ? 'rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50'
                        : 'rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/90 disabled:opacity-50'
                    }
                  >
                    {savingCreatorQuestions ? 'Saving...' : 'Save Contest Questions'}
                  </button>
                  {fixedContestQuestionIds.length > 0 && (
                    <span className={`text-xs ${isDark ? 'text-white/75' : 'text-black/70'}`}>Saved and locked for participants</span>
                  )}
                </div>
              </div>
            )}

            {showLibraryModal && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 md:p-6 backdrop-blur-[1px]">
                <div className={`no-scrollbar max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-3xl border p-4 shadow-2xl ${isDark ? 'border-white/20 bg-black' : 'border-black/15 bg-white'}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-white/70' : 'text-black/60'}`}>Curate Set</p>
                      <h3 className="text-lg font-semibold">Question Library</h3>
                      <p className={`mt-1 text-xs ${isDark ? 'text-white/65' : 'text-black/65'}`}>{creatorDraftQuestionIds.length} selected</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLibraryModal(false)}
                      className={isDark ? 'rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20' : 'rounded-lg border border-black/20 bg-white px-3 py-1 text-xs font-semibold text-black hover:bg-black/5'}
                    >
                      Back
                    </button>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-2 items-center justify-between">
                    <input
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      placeholder="Search questions..."
                      className={`flex-1 min-w-[200px] rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40' : 'border-black/15 bg-white'}`}
                    />
                    <div className="flex flex-wrap gap-2">
                      <select value={libraryCodingPattern} onChange={(e) => setLibraryCodingPattern(e.target.value)} className={`rounded-xl border px-3 py-2 text-xs outline-none backdrop-blur-xl ${isDark ? 'border-white/20 bg-white/10 text-white' : 'border-black/15 bg-white/85 text-black'}`}>
                        <option value="all">All Coding Patterns</option>
                        {codingPatternOptions.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <select value={libraryAptitudeTopic} onChange={(e) => setLibraryAptitudeTopic(e.target.value)} className={`rounded-xl border px-3 py-2 text-xs outline-none backdrop-blur-xl ${isDark ? 'border-white/20 bg-white/10 text-white' : 'border-black/15 bg-white/85 text-black'}`}>
                        <option value="all">All Aptitude</option>
                        {aptitudeTopicOptions.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <select value={libraryReasoningTopic} onChange={(e) => setLibraryReasoningTopic(e.target.value)} className={`rounded-xl border px-3 py-2 text-xs outline-none backdrop-blur-xl ${isDark ? 'border-white/20 bg-white/10 text-white' : 'border-black/15 bg-white/85 text-black'}`}>
                        <option value="all">All Reasoning</option>
                        {reasoningTopicOptions.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3 grid gap-2 md:grid-cols-2">
                    <select value={libraryDifficulty} onChange={(e) => setLibraryDifficulty(e.target.value as 'all' | 'easy' | 'medium' | 'hard')} className={`rounded-xl border px-3 py-2 text-sm outline-none backdrop-blur-xl ${isDark ? 'border-white/20 bg-white/10 text-white' : 'border-black/15 bg-white/85 text-black'}`}>
                      <option value="all">All Levels</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <select value={libraryCompany} onChange={(e) => setLibraryCompany(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm outline-none backdrop-blur-xl ${isDark ? 'border-white/20 bg-white/10 text-white' : 'border-black/15 bg-white/85 text-black'}`}>
                      <option value="all">All Companies</option>
                      {companyOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    {libraryQuestions.map((q) => {
                      const added = creatorDraftQuestionIds.includes(q.id);
                      return (
                        <div key={`lib-${q.id}`} className={`rounded-2xl border p-3 ${isDark ? 'border-white/15 bg-black/40' : 'border-black/10 bg-white'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold leading-tight">{q.title}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${difficultyBadgeClass(q.difficulty, isDark)}`}>
                                  {q.difficulty}
                                </span>
                                {(q.topic || []).slice(0, 3).map((tag) => (
                                  <span key={`${q.id}-${tag}`} className={`rounded-full px-2 py-0.5 text-[10px] ${isDark ? 'bg-white/10 text-white/75' : 'bg-black/5 text-black/70'}`}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={questionSetLocked}
                              onClick={() => {
                                setCreatorDraftQuestionIds((prev) => (added ? prev.filter((id) => id !== q.id) : [...prev, q.id]));
                              }}
                              className={added ? (isDark ? 'rounded-lg border border-white/20 bg-white px-3 py-1 text-xs font-semibold text-black' : 'rounded-lg border border-black/20 bg-black px-3 py-1 text-xs font-semibold text-white') : (isDark ? 'rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20' : 'rounded-lg border border-black/20 bg-white px-3 py-1 text-xs font-semibold hover:bg-black/5')}
                            >
                              {added ? 'Added' : '+ Add'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {libraryQuestions.length === 0 && <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>No questions match these filters.</p>}
                  </div>

                  <div className={`mt-4 flex items-center justify-between border-t pt-3 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <p className={`text-xs ${isDark ? 'text-white/65' : 'text-black/65'}`}>Selected Questions: {creatorDraftQuestionIds.length}</p>
                    <button
                      type="button"
                      onClick={() => setShowLibraryModal(false)}
                      className={isDark ? 'rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-white/90' : 'rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/90'}
                    >
                      Done And Back
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showCreateModal && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 md:p-6 backdrop-blur-[1px]">
                <div className={`max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-3xl border p-4 shadow-2xl ${isDark ? 'border-white/20 bg-black' : 'border-black/15 bg-white'}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-white/70' : 'text-black/60'}`}>Authoring</p>
                      <h3 className="text-lg font-semibold">Create New Question</h3>
                    </div>
                    <button type="button" onClick={() => setShowCreateModal(false)} className={isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'}>✕</button>
                  </div>

                  <div className="space-y-3">
                    <input value={createQuestionForm.title} onChange={(e) => setCreateQuestionForm({ ...createQuestionForm, title: e.target.value })} placeholder="Question title" className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40' : 'border-black/15 bg-white'}`} />
                    {createFormErrors.title && <p className={`text-xs ${isDark ? 'text-white/80' : 'text-black/75'}`}>{createFormErrors.title}</p>}
                    <div className="grid grid-cols-3 gap-2">
                      {['easy', 'medium', 'hard'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setCreateQuestionForm({ ...createQuestionForm, difficulty: d })}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${
                            createQuestionForm.difficulty === d
                              ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                              : isDark ? 'border border-white/20 bg-white/10 hover:bg-white/15' : 'border border-black/15 bg-white hover:bg-black/5'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    <textarea value={createQuestionForm.description} onChange={(e) => setCreateQuestionForm({ ...createQuestionForm, description: e.target.value })} rows={4} placeholder="Question description" className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40' : 'border-black/15 bg-white'}`} />
                    {createFormErrors.description && <p className={`text-xs ${isDark ? 'text-white/80' : 'text-black/75'}`}>{createFormErrors.description}</p>}
                    <input value={createQuestionForm.topics} onChange={(e) => setCreateQuestionForm({ ...createQuestionForm, topics: e.target.value })} placeholder="Topics (comma separated), e.g. array, hash-map" className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/20 bg-black/40' : 'border-black/15 bg-white'}`} />
                    {createFormErrors.topics && <p className={`text-xs ${isDark ? 'text-white/80' : 'text-black/75'}`}>{createFormErrors.topics}</p>}

                    <div className={`space-y-2 rounded-lg border p-3 ${isDark ? 'border-white/15 bg-black/40' : 'border-black/10 bg-white/50'}`}>
                      <p className="text-sm font-semibold">Test Cases</p>
                      {createQuestionForm.testcases.map((tc, idx) => (
                        <div key={`newtc-${idx}`} className="grid gap-2 md:grid-cols-2">
                          <textarea rows={2} value={tc.input} onChange={(e) => {
                            const next = [...createQuestionForm.testcases];
                            next[idx] = { ...next[idx], input: e.target.value };
                            setCreateQuestionForm({ ...createQuestionForm, testcases: next });
                          }} placeholder="Input" className={`rounded-lg border px-3 py-2 text-xs outline-none ${isDark ? 'border-white/20 bg-black/40' : 'border-black/15 bg-white'}`} />
                          <textarea rows={2} value={tc.expectedOutput} onChange={(e) => {
                            const next = [...createQuestionForm.testcases];
                            next[idx] = { ...next[idx], expectedOutput: e.target.value };
                            setCreateQuestionForm({ ...createQuestionForm, testcases: next });
                          }} placeholder="Expected Output" className={`rounded-lg border px-3 py-2 text-xs outline-none ${isDark ? 'border-white/20 bg-black/40' : 'border-black/15 bg-white'}`} />
                        </div>
                      ))}
                      <button type="button" onClick={() => setCreateQuestionForm({ ...createQuestionForm, testcases: [...createQuestionForm.testcases, { input: '', expectedOutput: '' }] })} className={isDark ? 'rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20' : 'rounded-lg border border-black/20 bg-white px-3 py-1 text-xs font-semibold hover:bg-black/5'}>
                        + Add Test Case
                      </button>
                      {createFormErrors.testcases && <p className={`text-xs ${isDark ? 'text-white/80' : 'text-black/75'}`}>{createFormErrors.testcases}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => void createCustomQuestion()} disabled={creatingQuestion || questionSetLocked} className={isDark ? 'rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50' : 'rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/90 disabled:opacity-50'}>
                        {creatingQuestion ? 'Creating...' : 'Create Question'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {successToast && (
              <div className="pointer-events-none fixed bottom-5 right-5 z-50">
                <div className={`rounded-xl border px-4 py-2 text-xs font-semibold shadow-xl ${isDark ? 'border-white/20 bg-white/10 text-white' : 'border-black/20 bg-white text-black'}`}>
                  {successToast}
                </div>
              </div>
            )}

            <div ref={leaderboardRef} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-black/30' : 'border-black/10 bg-black/5'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">Leaderboard</h2>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setIsLeaderboardFrozen(prev => !prev)}
                      className={`ml-2 rounded-lg border px-2 py-0.5 text-[10px] font-bold transition ${isLeaderboardFrozen ? 'border-amber-500 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'border-cyan-500 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'}`}
                    >
                      {isLeaderboardFrozen ? 'Unfreeze' : 'Freeze'}
                    </button>
                  )}
                  {isLeaderboardFrozen && (
                    <span className="rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] px-2 py-0.5 font-bold animate-pulse">
                      FROZEN
                    </span>
                  )}
                </div>
                <span className={`flex items-center gap-1.5 text-xs ${leaderboardConnected ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-amber-400' : 'text-amber-600')}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${leaderboardConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  {leaderboardConnected ? 'Live' : 'Reconnecting...'}
                </span>
              </div>

              {isLeaderboardFrozen && !isOwner ? (
                <div className="mt-4 p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
                  <p className="text-xs text-amber-500 font-semibold italic">
                    The leaderboard is currently frozen by the administrator. Rankings are locked and final scores will be revealed after completion.
                  </p>
                </div>
              ) : leaderboard.length === 0 ? (
                <p className={`mt-2 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>No participants scored yet.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-160 text-left text-xs">
                    <thead>
                      <tr className={isDark ? 'text-white/60' : 'text-black/60'}>
                        <th className="py-2 pr-3">Rank</th>
                        <th className="py-2 pr-3">Participant</th>
                        <th className="py-2 pr-3">Points</th>
                        <th className="py-2 pr-3">Grade</th>
                        <th className="py-2 pr-3">Avg Runtime</th>
                        <th className="py-2 pr-3">Avg Memory</th>
                        <th className="py-2 pr-3">Code Size</th>
                        <th className="py-2 pr-3">Time To Finish</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.slice(0, 20).map((row) => (
                        <tr key={`${row.userId}-${row.rank}`} className={`border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                          <td className="py-2 pr-3">#{row.rank}</td>
                          <td className="py-2 pr-3">{row.name || row.email || 'Participant'}</td>
                          <td className="py-2 pr-3 font-semibold">{row.score}</td>
                          <td className="py-2 pr-3 font-semibold">{contestGrade(row.score, Math.max(1, fixedContestQuestionIds.length || effectiveSelectedQuestionIds.length || 1))}</td>
                          <td className="py-2 pr-3">{row.avgRuntimeMs ? `${row.avgRuntimeMs} ms` : '-'}</td>
                          <td className="py-2 pr-3">{row.avgMemoryKb ? `${row.avgMemoryKb} KB` : '-'}</td>
                          <td className="py-2 pr-3">{row.totalCodeChars ? `${row.totalCodeChars} chars` : '-'}</td>
                          <td className="py-2 pr-3">
                            {row.timedOut ? (
                              <span className="text-red-400 font-semibold">DNF / Over Limit</span>
                            ) : row.finishedAt && row.joinedAt ? (
                              formatDurationSeconds(Math.max(0, Math.round((Date.parse(row.finishedAt) - Date.parse(row.joinedAt)) / 1000)))
                            ) : row.finishedAt ? (
                              new Date(row.finishedAt).toLocaleTimeString()
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
