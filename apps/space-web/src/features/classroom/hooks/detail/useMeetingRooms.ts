import { useState, useEffect, useCallback } from 'react';
import { spaceApi } from '@/lib/api';
import type { MeetingRoom } from '@/lib/api/meeting-room';
import { toast } from 'sonner';

export interface UseMeetingRoomsArgs {
  uid: string;
  activeTab: string;
  t: (key: string) => string;
}

export interface UseMeetingRoomsResult {
  meetingRooms: MeetingRoom[];
  setMeetingRooms: React.Dispatch<React.SetStateAction<MeetingRoom[]>>;
  loadingMeetings: boolean;
  activeMeeting: MeetingRoom | null;
  fetchMeetingRooms: () => Promise<void>;
}

export function useMeetingRooms({
  uid,
  activeTab,
  t,
}: UseMeetingRoomsArgs): UseMeetingRoomsResult {
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  const fetchMeetingRooms = useCallback(async () => {
    setLoadingMeetings(true);
    try {
      const rooms = await spaceApi.meetingRooms.getByClassroom(uid);
      setMeetingRooms(rooms);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.meetings_load_error'));
    } finally {
      setLoadingMeetings(false);
    }
  }, [uid]);

  useEffect(() => {
    if (activeTab === 'meeting') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Entering the tab initiates its request.
      void fetchMeetingRooms();
    }
  }, [activeTab, fetchMeetingRooms]);

  const activeMeeting = meetingRooms.find(room => room.status === 'active') || null;

  return {
    meetingRooms,
    setMeetingRooms,
    loadingMeetings,
    activeMeeting,
    fetchMeetingRooms,
  };
}

export default useMeetingRooms;
