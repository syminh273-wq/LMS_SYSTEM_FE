export type DocProgress = {
  classroom_id: string;
  student_id: string;
  resource_uid: string;
  read_progress: number;
  is_completed: boolean;
  note_count: number;
  completed_at?: string | null;
  last_opened_at?: string | null;
};

export type DocNote = {
  uid: string;
  resource_uid: string;
  classroom_id: string;
  student_id: string;
  content: string;
  page?: number | null;
  x_pct?: number | null;
  y_pct?: number | null;
  progress_at: number;
  color: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateNotePayload = {
  content: string;
  page?: number | null;
  x_pct?: number | null;
  y_pct?: number | null;
  progress_at?: number;
  color?: string;
};

export type UpdateNotePayload = Partial<CreateNotePayload>;
