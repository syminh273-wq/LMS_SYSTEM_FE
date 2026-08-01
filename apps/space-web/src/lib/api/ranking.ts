import AbstractRestApiClient from './client';

type ClassroomLeaderboardEntry = {
  rank: number;
  student_id: string;
  student_name: string;
  student_avatar: string;
  total_score: number;
  exam_count: number;
  explanation: string;
};

export type ClassroomLeaderboardResponse = {
  classroom_uid: string;
  total_students: number;
  my_rank: number | null;
  my_score: number | null;
  entries: ClassroomLeaderboardEntry[];
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

class SpaceRankingApiClient extends AbstractRestApiClient {
  constructor() {
    super();
  }

  public async getClassroomLeaderboard(
    classroomUid: string,
    limit: number = 20,
  ): Promise<ClassroomLeaderboardResponse> {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    return this.get<ClassroomLeaderboardResponse>(
      `/api/v1/space/ranking/classrooms/${classroomUid}/leaderboard/?limit=${safeLimit}`,
    );
  }
}

export const spaceRankingApi = new SpaceRankingApiClient();
