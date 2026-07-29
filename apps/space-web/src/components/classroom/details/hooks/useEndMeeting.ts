import { useState } from 'react';
import { spaceApi } from '@/lib/api';
import type { MeetingRoom } from '@/lib/api/meeting-room';
import { toast } from 'sonner';

export interface UseEndMeetingArgs {
  t: (key: string) => string;
}

export interface UseEndMeetingResult {
  endMeeting: (meetingUid: string) => Promise<MeetingRoom | null>;
  ending: boolean;
}

export function useEndMeeting({ t }: UseEndMeetingArgs): UseEndMeetingResult {
  const [ending, setEnding] = useState(false);

  const endMeeting = async (meetingUid: string) => {
    setEnding(true);
    try {
      const ended = await spaceApi.meetingRooms.end(meetingUid);
      return ended;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.meeting_end_error'));
      return null;
    } finally {
      setEnding(false);
    }
  };

  return { endMeeting, ending };
}

export default useEndMeeting;
