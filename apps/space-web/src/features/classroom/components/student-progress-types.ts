export interface StudentProgress {
  student_id: string;
  read_progress: number;
  is_completed: boolean;
  note_count: number;
}

export interface StudentNote {
  uid: string;
  student_id: string;
  content: string;
  page?: number | null;
  progress_at?: number;
  created_at?: string;
}
