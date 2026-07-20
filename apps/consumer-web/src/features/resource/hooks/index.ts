import { useState, useEffect, useCallback } from 'react';
import type { Resource, ResourceFolder } from '../types';
import { resourceApi } from '../api';

export function useResourceList(classroomId: string, folderId?: string) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResources = useCallback(async () => {
    if (!classroomId) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await resourceApi.list(classroomId, folderId);
      setResources(Array.isArray(res) ? res : (res as any).results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classroomId, folderId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    resources,
    loading,
    error,
    refresh: fetchResources,
  };
}

export function useFolderList(classroomId: string, parentId?: string | null) {
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFolders = useCallback(async () => {
    if (!classroomId) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await resourceApi.listFolders(classroomId, parentId);
      setFolders(Array.isArray(res) ? res : (res as any).results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classroomId, parentId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return {
    folders,
    loading,
    error,
    refresh: fetchFolders,
  };
}
