import { useState, useEffect, useCallback } from 'react';
import type { Space, SpaceSettings } from '../types';
import { spaceApi } from '../api/space';

export function useSpaceSettings() {
  const [settings, setSettings] = useState<SpaceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await spaceApi.getSettings();
      setSettings(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
  };
}

export function useUpdateSpaceSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateSettings = useCallback(async (data: SpaceSettings) => {
    try {
      setLoading(true);
      setError('');
      const res = await spaceApi.updateSettings(data);
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateSettings,
    loading,
    error,
  };
}

export function useSpaceDetail(uid: string) {
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSpace = useCallback(async () => {
    if (!uid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await spaceApi.retrieve(uid);
      setSpace(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchSpace();
  }, [fetchSpace]);

  return {
    space,
    loading,
    error,
    refresh: fetchSpace,
  };
}
