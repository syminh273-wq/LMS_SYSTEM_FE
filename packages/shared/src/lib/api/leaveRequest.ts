export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  uid: string;
  student_id: string;
  student_name?: string | null;
  student_email?: string | null;
  space_id: string;
  event_id?: string | null;
  event_title?: string | null;
  classroom_id?: string | null;
  classroom_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  reason: string;
  evidence_url?: string | null;
  status: LeaveRequestStatus;
  processed_by?: string | null;
  processed_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveRequestEventOption {
  uid: string;
  title: string;
  start_time: string;
  end_time: string;
  classroom_name?: string | null;
}

export interface CreateLeaveRequestInput {
  event_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  reason: string;
  evidence?: File | null;
}

export interface ProcessLeaveRequestInput {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

export interface ListLeaveRequestsParams {
  status?: LeaveRequestStatus;
  student_id?: string;
  classroom_id?: string;
}
