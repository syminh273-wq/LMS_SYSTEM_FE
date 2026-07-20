import { useState, useEffect, useCallback } from 'react';
import type { MeetingRoom, MeetingSession } from '../types';
import { meetingRoomApi } from '../api';

export function useMeetingRoomList(classroomId?: string) {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await meetingRoomApi.list(classroomId);
      setRooms(Array.isArray(res) ? res : (res as any).results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    loading,
    error,
    refresh: fetchRooms,
  };
}

export function useMeetingSessionList(roomUid?: string) {
  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSessions = useCallback(async () => {
    if (!roomUid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await meetingRoomApi.listSessions(roomUid);
      setSessions(Array.isArray(res) ? res : (res as any).results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roomUid]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refresh: fetchSessions,
  };
}

export function useCreateMeetingRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createRoom = useCallback(async (data: { name: string; classroom_id: string }) => {
    try {
      setLoading(true);
      setError('');
      const res = await meetingRoomApi.create({ classroom_uid: data.classroom_id, title: data.name });
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createRoom,
    loading,
    error,
  };
}
