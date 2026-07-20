export interface Consumer {
  uid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentClassroomStat {
  classroom: {
    uid: string;
    name: string;
    description: string;
    status: string;
    pid: string;
  };
  joined_at: string | null;
  total_exams: number;
  submitted_count: number;
  avg_grade: number | null;
}

export interface StudentDetail {
  consumer: {
    uid: string;
    full_name: string;
    email: string;
    avatar_url: string;
    first_joined_at: string | null;
  };
  classrooms: StudentClassroomStat[];
}

export interface StudentExamRecord {
  exam: {
    uid: string;
    title: string;
    status: string;
    due_date: string | null;
  };
  submission: import('@/features/exam/types').ExamSubmission | null;
}

export interface TeacherContact {
  consumer_uid: string;
  consumer_name: string;
  first_name: string;
  last_name: string;
  consumer_email: string;
  consumer_avatar: string;
  first_joined_at: string | null;
}

export interface UpdateConsumerRequest {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}
