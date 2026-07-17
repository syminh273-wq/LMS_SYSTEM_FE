export type StudentProgress = {
  student_id: string;
  read_progress: number;
  is_completed: boolean;
  note_count: number;
  completed_at?: string | null;
  last_opened_at?: string | null;
};

export type StudentNote = {
  uid: string;
  student_id: string;
  content: string;
  page?: number | null;
  x_pct?: number | null;
  y_pct?: number | null;
  progress_at: number;
  color: string;
  created_at?: string | null;
};
