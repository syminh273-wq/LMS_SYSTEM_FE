import { useState, useEffect, useCallback } from 'react';
import type { Classroom, PaginatedResponse } from '../types';
import { classroomApi } from '../api';

export function useClassroomList(initialPage: number = 1) {
  const [data, setData] = useState<PaginatedResponse<Classroom> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(initialPage);

  const fetchClassrooms = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError('');
      const res = await classroomApi.list(page);
      setData(res);
      setCurrentPage(res.current_page);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms(currentPage);
  }, [currentPage, fetchClassrooms]);

  const handlePageChange = useCallback((newPage: number) => {
    if (data && newPage >= 1 && newPage <= data.total_pages) {
      setCurrentPage(newPage);
    }
  }, [data]);

  const refresh = useCallback(() => {
    fetchClassrooms(currentPage);
  }, [currentPage, fetchClassrooms]);

  return {
    data,
    loading,
    error,
    currentPage,
    classrooms: data?.results || [],
    handlePageChange,
    refresh,
  };
}

export function useClassroomDetail(uid: string) {
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClassroom = useCallback(async () => {
    if (!uid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await classroomApi.retrieve(uid);
      setClassroom(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchClassroom();
  }, [fetchClassroom]);

  return {
    classroom,
    loading,
    error,
    refresh: fetchClassroom,
  };
}

export function useClassroomDelete() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deleteClassroom = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      setError('');
      await classroomApi.delete(uid);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteClassroom,
    loading,
    error,
  };
}

export function useClassroomMembers(uid: string) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMembers = useCallback(async () => {
    if (!uid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await classroomApi.members(uid);
      setMembers(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refresh: fetchMembers,
  };
}
