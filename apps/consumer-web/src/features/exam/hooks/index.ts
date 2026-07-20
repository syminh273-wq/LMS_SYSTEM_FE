import { useState, useEffect, useCallback } from 'react';
import type { Exam, ExamSubmission } from '../types';
import { examApi } from '../api';

export function useExamList(classroomUid: string, params?: { status?: string | string[]; exam_mode?: string }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExams = useCallback(async () => {
    if (!classroomUid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await examApi.listByClassroom(classroomUid, params);
      setExams(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classroomUid, params]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  return {
    exams,
    loading,
    error,
    refresh: fetchExams,
  };
}

export function useExamDetail(uid: string) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExam = useCallback(async () => {
    if (!uid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await examApi.retrieve(uid);
      setExam(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  return {
    exam,
    loading,
    error,
    refresh: fetchExam,
  };
}

export function useExamSubmissions(examUid: string) {
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubmissions = useCallback(async () => {
    if (!examUid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await examApi.listSubmissions(examUid);
      setSubmissions(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [examUid]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    submissions,
    loading,
    error,
    refresh: fetchSubmissions,
  };
}

export function useExamDelete() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deleteExam = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      setError('');
      await examApi.deleteExam(uid);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteExam,
    loading,
    error,
  };
}

export function useExamGrade() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gradeSubmission = useCallback(async (
    submissionUid: string,
    data: { grade?: number; feedback?: string }
  ) => {
    try {
      setLoading(true);
      setError('');
      const res = await examApi.gradeSubmission(submissionUid, data);
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    gradeSubmission,
    loading,
    error,
  };
}
