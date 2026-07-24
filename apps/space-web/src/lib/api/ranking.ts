import BaseRestApiClient from './client';

export type ClassroomXpRankingEntry = {
  rank: number;
  student_id: string;
  student_name: string;
  student_avatar: string;
  total_xp: number;
  level: number;
};

export type ClassroomXpRankingResponse = {
  classroom_uid: string;
  total_students: number;
  entries: ClassroomXpRankingEntry[];
};

export type StudentRankingProfile = {
  student_id: string;
  total_xp: number;
  level: number;
  current_level_xp: number;
  next_level_xp: number;
  progress_pct: number;
  xp_to_next_level: number;
  streak_days: number;
  last_active_date: string | null;
  classrooms_joined_count: number;
  quizzes_passed_count: number;
  exams_passed_count: number;
  perfect_scores_count: number;
  certificates_count: number;
  attendance_count: number;
  level_title: string;
};

export type StudentAchievement = {
  code: string;
  title: string;
  description: string;
  icon: string;
  target_value: number;
  current_value: number;
  progress_pct: number;
  is_unlocked: boolean;
  unlocked_at?: string | null;
};

export class SpaceRankingApiClient extends BaseRestApiClient {
  constructor() {
    super();
  }

  public async getClassroomXpRanking(
    classroomUid: string,
    limit: number = 20,
  ): Promise<ClassroomXpRankingResponse> {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    return this.get<ClassroomXpRankingResponse>(
      `/api/v1/space/ranking/classrooms/${classroomUid}/xp/?limit=${safeLimit}`,
    );
  }

  public async getStudentProfile(studentUid: string): Promise<StudentRankingProfile> {
    return this.get<StudentRankingProfile>(
      `/api/v1/space/ranking/students/${studentUid}/`,
    );
  }

  public async getStudentAchievements(studentUid: string): Promise<StudentAchievement[]> {
    return this.get<StudentAchievement[]>(
      `/api/v1/space/ranking/students/${studentUid}/achievements/`,
    );
  }
}

export const spaceRankingApi = new SpaceRankingApiClient();
