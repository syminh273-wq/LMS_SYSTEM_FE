'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { spaceApi, Classroom } from '@/lib/api';
import type { MeetingRoom } from '@/lib/api/meeting-room';
import { toast } from 'sonner';

export interface UseClassroomMeetingsArgs {
  uid: string;
  activeTab: string;
  classroom: Classroom | null;
  t: (key: string) => string;
  startMediaShare: (source: 'screen' | 'camera') => Promise<void>;
  stopScreenShare: () => void;
}

export interface UseClassroomMeetingsResult {
  meetingRooms: MeetingRoom[];
  loadingMeetings: boolean;
  meetingAction: 'start' | 'end' | null;
  activeMeeting: MeetingRoom | null;
  handleStartMeeting: (source: 'screen' | 'camera') => Promise<void>;
  handleEndMeeting: () => Promise<void>;
  fetchMeetingRooms: () => Promise<void>;
}

export function useClassroomMeetings({
  uid,
  activeTab,
  classroom,
  t,
  startMediaShare,
  stopScreenShare,
}: UseClassroomMeetingsArgs): UseClassroomMeetingsResult {
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [meetingAction, setMeetingAction] = useState<'start' | 'end' | null>(null);

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

  const handleStartMeeting = async (source: 'screen' | 'camera') => {
    if (!classroom || meetingAction) return;
    if (!classroom || meetingAction) return;

    setMeetingAction('start');
    try {
      const room = activeMeeting || await spaceApi.meetingRooms.quickStart({
        classroom_uid: uid,
        title: `Buổi học trực tuyến - ${classroom.name}`,
        description: `Phòng học trực tuyến cho lớp ${classroom.name}`,
        max_participants: classroom.max_students,
      });
      setMeetingRooms(prev => [room, ...prev.filter(item => item.uid !== room.uid)]);
      await startMediaShare(source);
      toast.success(source === 'screen' ? t('classroom.ui.meeting_start_success_screen') : t('classroom.ui.meeting_start_success_camera'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.meeting_start_error'));
    } finally {
      setMeetingAction(null);
    }
  };

  const handleEndMeeting = async () => {
    if (!activeMeeting || meetingAction) return;

    setMeetingAction('end');
    try {
      stopScreenShare();
      const ended = await spaceApi.meetingRooms.end(activeMeeting.uid);
      setMeetingRooms(prev => prev.map(room => room.uid === ended.uid ? ended : room));
      toast.success(t('classroom.ui.meeting_ended_toast'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.meeting_end_error'));
    } finally {
      setMeetingAction(null);
    }
  };

  return {
    meetingRooms,
    loadingMeetings,
    meetingAction,
    activeMeeting,
    handleStartMeeting,
    handleEndMeeting,
    fetchMeetingRooms,
  };
}

export default useClassroomMeetings;
