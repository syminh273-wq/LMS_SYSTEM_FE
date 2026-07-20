import BaseRestApiClient from '@/core/api/client';

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

export interface CreateMeetingRoomRequest {
  classroom_uid: string;
  title: string;
}

export class MeetingRoomApiClient extends BaseRestApiClient {
  constructor() {
    super();
  }

  public async list(classroomUid?: string): Promise<MeetingRoom[]> {
    const params = classroomUid ? `?classroom_uid=${classroomUid}` : '';
    return this.get<MeetingRoom[]>(`/api/v1/consumer/course/meeting-rooms/${params}`);
  }

  public async getByClassroom(classroomUid: string): Promise<MeetingRoom[]> {
    return this.get<MeetingRoom[]>(`/api/v1/consumer/course/meeting-rooms/?classroom_uid=${classroomUid}`);
  }

  public async listSessions(roomUid: string): Promise<any[]> {
    return this.get<any[]>(`/api/v1/consumer/course/meeting-rooms/${roomUid}/sessions/`);
  }

  public async create(data: CreateMeetingRoomRequest): Promise<MeetingRoom> {
    return this.post<MeetingRoom>('/api/v1/consumer/course/meeting-rooms/', data);
  }
}

export const meetingRoomApi = new MeetingRoomApiClient();
