import { useState, useEffect, useCallback } from 'react';
import type { Quiz, QuizDetail, QuizAttemptRecord } from '../types';
import type { QuizPublicDetail } from '@lms/types';
import { quizApi } from '../api';

export function useQuizList(classroomId?: string) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await quizApi.list(classroomId);
      setQuizzes(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  return {
    quizzes,
    loading,
    error,
    refresh: fetchQuizzes,
  };
}

export function useQuizDetail(uid: string) {
  const [quiz, setQuiz] = useState<QuizPublicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuiz = useCallback(async () => {
    if (!uid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await quizApi.retrieve(uid);
      setQuiz(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  return {
    quiz,
    loading,
    error,
    refresh: fetchQuiz,
  };
}

export function useQuizAttempts(uid: string, classroomId: string) {
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAttempts = useCallback(async () => {
    if (!uid || !classroomId) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await quizApi.getAttempts(uid, classroomId);
      setAttempts(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid, classroomId]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  return {
    attempts,
    loading,
    error,
    refresh: fetchAttempts,
  };
}

export function useQuizDelete() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deleteQuiz = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      setError('');
      await quizApi.deleteQuiz(uid);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteQuiz,
    loading,
    error,
  };
}

export function useQuizAssign() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const assignToClassroom = useCallback(async (
    uid: string,
    classroomId: string,
    settings?: any
  ) => {
    try {
      setLoading(true);
      setError('');
      const res = await quizApi.assignToClassroom(uid, classroomId, settings);
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    assignToClassroom,
    loading,
    error,
  };
}
