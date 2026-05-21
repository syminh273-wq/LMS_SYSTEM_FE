import BaseRestApiClient from './client';

export interface MeetingRoom {
  uid: string;
  classroom_uid?: string;
  title: string;
  description?: string;
  host_id: string;
  host_type: string;
  host_name: string;
  status: 'waiting' | 'active' | 'ended';
  max_participants: number;
  participant_count: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

export class MeetingRoomApiClient extends BaseRestApiClient {
  constructor() {
    super();
  }

  public async getByClassroom(classroomUid: string): Promise<MeetingRoom[]> {
    return this.get<MeetingRoom[]>(`/api/v1/consumer/course/meeting-rooms/?classroom_uid=${classroomUid}`);
  }
}

export const meetingRoomApi = new MeetingRoomApiClient();
