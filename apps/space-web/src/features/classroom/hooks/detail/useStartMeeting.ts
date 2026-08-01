import { useState } from 'react';
import { spaceApi, ClassroomProps } from '@/lib/api';
import type { MeetingRoom } from '@/lib/api/meeting-room';
import { toast } from 'sonner';

export interface UseStartMeetingArgs {
  uid: string;
  t: (key: string) => string;
}

export interface UseStartMeetingResult {
  startMeeting: (classroom: ClassroomProps, activeMeeting: MeetingRoom | null) => Promise<MeetingRoom | null>;
  starting: boolean;
}

export function useStartMeeting({
  uid,
  t,
}: UseStartMeetingArgs): UseStartMeetingResult {
  const [starting, setStarting] = useState(false);

  const startMeeting = async (classroom: ClassroomProps, activeMeeting: MeetingRoom | null) => {
    setStarting(true);
    try {
      const room = activeMeeting || await spaceApi.meetingRooms.quickStart({
        classroom_uid: uid,
        title: `Buổi học trực tuyến - ${classroom.name}`,
        description: `Phòng học trực tuyến cho lớp ${classroom.name}`,
        max_participants: classroom.max_students,
      });
      return room;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.meeting_start_error'));
      return null;
    } finally {
      setStarting(false);
    }
  };

  return { startMeeting, starting };
}

export default useStartMeeting;
