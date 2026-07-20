export interface MeetingRoom {
  uid: string;
  name: string;
  classroom_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeetingSession {
  uid: string;
  room_uid: string;
  started_at: string;
  ended_at: string | null;
  participants: string[];
}
