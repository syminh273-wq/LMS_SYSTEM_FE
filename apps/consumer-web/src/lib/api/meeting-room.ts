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

export interface LiveRoomMarker {
  room_uid: string;
  classroom_uid: string;
  title: string;
  host_id: string;
  host_name: string;
  started_at: string;
}

interface LiveRoomResponse {
  live_room: LiveRoomMarker | null;
  room: MeetingRoom | null;
}

interface JoinRoomResponse {
  room: MeetingRoom;
  participant_id: string;
  camera_required: boolean;
}

class MeetingRoomApiClient extends BaseRestApiClient {
  constructor() {
    super();
  }

  public async getByClassroom(classroomUid: string): Promise<MeetingRoom[]> {
    return this.get<MeetingRoom[]>(`/api/v1/consumer/course/meeting-rooms/?classroom_uid=${classroomUid}`);
  }

  public async getLiveRoom(classroomUid: string): Promise<LiveRoomResponse> {
    return this.get<LiveRoomResponse>(
      `/api/v1/consumer/course/meeting-rooms/live/?classroom_uid=${classroomUid}`,
    );
  }

  public async join(roomUid: string): Promise<JoinRoomResponse> {
    return this.post<JoinRoomResponse>(`/api/v1/consumer/course/meeting-rooms/${roomUid}/join/`);
  }

  public async leave(roomUid: string): Promise<void> {
    await this.post(`/api/v1/consumer/course/meeting-rooms/${roomUid}/leave/`);
  }
}

export const meetingRoomApi = new MeetingRoomApiClient();
