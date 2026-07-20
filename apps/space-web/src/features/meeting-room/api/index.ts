import BaseRestApiClient from '@/core/api/client';
import type { MeetingSession } from '../types';

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

export type CreateMeetingRoomRequest = {
  classroom_uid: string;
  title: string;
  description?: string;
  max_participants?: number;
};

export class MeetingRoomApiClient extends BaseRestApiClient {
  public async list(classroomUid?: string): Promise<MeetingRoom[]> {
    if (!classroomUid) return [];
    return this.get<MeetingRoom[]>(
      `/api/v1/space/course/meeting-rooms/?classroom_uid=${encodeURIComponent(classroomUid)}`
    );
  }

  public async getByClassroom(classroomUid: string): Promise<MeetingRoom[]> {
    return this.list(classroomUid);
  }

  public async listSessions(roomUid: string): Promise<MeetingSession[]> {
    return this.get<MeetingSession[]>(
      `/api/v1/space/course/meeting-rooms/${roomUid}/sessions/`
    );
  }

  public async create(data: CreateMeetingRoomRequest): Promise<MeetingRoom> {
    return this.post<MeetingRoom>('/api/v1/space/course/meeting-rooms/', data);
  }

  public async quickStart(data: CreateMeetingRoomRequest): Promise<MeetingRoom> {
    return this.post<MeetingRoom>('/api/v1/space/course/meeting-rooms/quick_start/', data);
  }

  public async start(uid: string): Promise<MeetingRoom> {
    return this.post<MeetingRoom>(`/api/v1/space/course/meeting-rooms/${uid}/start/`);
  }

  public async end(uid: string): Promise<MeetingRoom> {
    return this.post<MeetingRoom>(`/api/v1/space/course/meeting-rooms/${uid}/end/`);
  }
}

export const meetingRoomApi = new MeetingRoomApiClient();
