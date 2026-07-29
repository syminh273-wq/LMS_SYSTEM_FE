'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { quizApi } from '@/lib/api/quiz';
import type { Quiz } from '@/lib/api/types';
import { toast } from 'sonner';

export interface UseClassroomQuizzesArgs {
  uid: string;
  activeTab: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseClassroomQuizzesResult {
  assignedQuizzes: Quiz[];
  loadingQuizzes: boolean;
  showAssignModal: boolean;
  setShowAssignModal: React.Dispatch<React.SetStateAction<boolean>>;
  showOpenExamModal: boolean;
  setShowOpenExamModal: React.Dispatch<React.SetStateAction<boolean>>;
  unassigningUid: string | null;
  editingQuiz: Quiz | null;
  setEditingQuiz: React.Dispatch<React.SetStateAction<Quiz | null>>;
  leaderboardQuiz: Quiz | null;
  setLeaderboardQuiz: React.Dispatch<React.SetStateAction<Quiz | null>>;
  fetchAssignedQuizzes: () => Promise<void>;
  handleUnassignQuiz: (quiz: Quiz) => Promise<void>;
}

export function useClassroomQuizzes({
  uid,
  activeTab,
  t,
}: UseClassroomQuizzesArgs): UseClassroomQuizzesResult {
  const [assignedQuizzes, setAssignedQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOpenExamModal, setShowOpenExamModal] = useState(false);
  const [unassigningUid, setUnassigningUid] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [leaderboardQuiz, setLeaderboardQuiz] = useState<Quiz | null>(null);

  const fetchAssignedQuizzes = useCallback(async () => {
    setLoadingQuizzes(true);
    try {
      const data = await quizApi.list(uid);
      setAssignedQuizzes(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.quiz_load_error'));
    } finally {
      setLoadingQuizzes(false);
    }
  }, [uid]);

  useEffect(() => {
    if (activeTab === 'quiz') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Entering the tab initiates its request.
      void fetchAssignedQuizzes();
    }
  }, [activeTab, fetchAssignedQuizzes]);

  const handleUnassignQuiz = async (quiz: Quiz) => {
    if (!window.confirm(t('classroom.ui.quiz_unassign_confirm', undefined, { title: quiz.title }))) return;
    setUnassigningUid(quiz.uid);
    try {
      await quizApi.unassignFromClassroom(quiz.uid, uid);
      setAssignedQuizzes(prev => prev.filter(q => q.uid !== quiz.uid));
      toast.success(t('classroom.ui.quiz_unassign_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.quiz_unassign_error'));
    } finally {
      setUnassigningUid(null);
    }
  };

  return {
    assignedQuizzes,
    loadingQuizzes,
    showAssignModal,
    setShowAssignModal,
    showOpenExamModal,
    setShowOpenExamModal,
    unassigningUid,
    editingQuiz,
    setEditingQuiz,
    leaderboardQuiz,
    setLeaderboardQuiz,
    fetchAssignedQuizzes,
    handleUnassignQuiz,
  };
}

export default useClassroomQuizzes;
