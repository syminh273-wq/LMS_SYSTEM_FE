import { useState, useEffect, useCallback } from 'react';
import type { QuizCollection, QuizCollectionDetail, Certificate } from '../types';
import { quizCollectionApi, certificateApi } from '../api';

export function useQuizCollectionList() {
  const [collections, setCollections] = useState<QuizCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await quizCollectionApi.list();
      setCollections(Array.isArray(res) ? res : (res as any).results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    loading,
    error,
    refresh: fetchCollections,
  };
}

export function useQuizCollectionDetail(uid: string) {
  const [collection, setCollection] = useState<QuizCollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCollection = useCallback(async () => {
    if (!uid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await quizCollectionApi.retrieve(uid);
      setCollection(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  return {
    collection,
    loading,
    error,
    refresh: fetchCollection,
  };
}

export function useCertificateList() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await certificateApi.list();
      setCertificates(Array.isArray(res) ? res : (res as any).results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  return {
    certificates,
    loading,
    error,
    refresh: fetchCertificates,
  };
}

export function useQuizCollectionDelete() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deleteCollection = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      setError('');
      await quizCollectionApi.deleteCollection(uid);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteCollection,
    loading,
    error,
  };
}

export function useQuizCollectionAssign() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const assignToClassroom = useCallback(async (uid: string, classroomId: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await quizCollectionApi.assignToClassroom(uid, classroomId);
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
