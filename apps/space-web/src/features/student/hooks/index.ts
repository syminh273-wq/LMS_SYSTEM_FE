import { useState, useEffect, useCallback } from 'react';
import type { Consumer } from '../types';
import { consumerApi } from '../api';

export function useConsumerList() {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConsumers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await consumerApi.list();
      setConsumers(Array.isArray(res) ? res : (res as any).results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsumers();
  }, [fetchConsumers]);

  return {
    consumers,
    loading,
    error,
    refresh: fetchConsumers,
  };
}

export function useConsumerDetail(uid: string) {
  const [consumer, setConsumer] = useState<Consumer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConsumer = useCallback(async () => {
    if (!uid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await consumerApi.retrieve(uid);
      setConsumer(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchConsumer();
  }, [fetchConsumer]);

  return {
    consumer,
    loading,
    error,
    refresh: fetchConsumer,
  };
}
