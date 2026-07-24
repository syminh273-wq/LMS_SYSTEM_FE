// Read-only mirror of backend hardcoded grading rules.
// Source of truth (backend):
//   - features/quiz/services/quiz_log_service.py
//   - features/quiz_collection/services/certificate_issuance_service.py
//   - features/course/exam/models/exam.py
//   - features/course/exam/services/exam_submission_service.py
//   - features/course/exam/services/exam_ai_grading_service.py
//   - features/ranking/defaults.py
//   - features/ranking/services/level_math.py
//   - features/ranking/services/level_service.py
//   - features/course/classroom/services/leaderboard_service.py
// When the backend changes, update this file to match.

export type XpEventCode =
  | 'classroom_joined'
  | 'attendance_present'
  | 'exam_submitted'
  | 'exam_passed'
  | 'quiz_submitted'
  | 'quiz_passed'
  | 'quiz_perfect'
  | 'doc_completed'
  | 'certificate_issued';

export interface XpEventRule {
  code: XpEventCode;
  xp: number;
  counter?: string;
  triggerHint: string;
}

export const QUIZ_RULES = {
  defaultMaxGrade: 10,
  defaultPassingScorePct: 50,
  perfectScorePct: 100,
  formula: 'score = (correct / total) × max_grade',
  maxAttemptsDefault: 0,
} as const;

export const EXAM_RULES = {
  defaultMaxGrade: 10,
  maxGradeRange: { min: 1, max: 100 } as const,
  defaultPassingScorePct: 50,
  mcFormula: 'score = (correct / total) × max_grade',
  aiRubric: [
    { label: 'Độ chính xác', weight: 30 },
    { label: 'Tính đầy đủ', weight: 20 },
    { label: 'Tư duy phản biện', weight: 20 },
    { label: 'Thuật ngữ', weight: 15 },
    { label: 'Hình thức', weight: 15 },
  ] as const,
  rubricTotal: 100,
} as const;

export const XP_RULES: XpEventRule[] = [
  { code: 'classroom_joined',   xp: 10,  counter: 'classrooms_joined_count', triggerHint: 'Khi được duyệt vào lớp' },
  { code: 'attendance_present', xp: 5,   counter: 'attendance_count',         triggerHint: 'Mỗi buổi điểm danh có mặt' },
  { code: 'exam_submitted',     xp: 20,                                        triggerHint: 'Mỗi lần nộp bài thi' },
  { code: 'exam_passed',        xp: 50,  counter: 'exams_passed_count',       triggerHint: 'Khi đạt bài thi (≥ 50%)' },
  { code: 'quiz_submitted',     xp: 10,                                        triggerHint: 'Mỗi lần nộp quiz' },
  { code: 'quiz_passed',        xp: 15,  counter: 'quizzes_passed_count',     triggerHint: 'Khi đạt quiz (≥ 50%)' },
  { code: 'quiz_perfect',       xp: 20,  counter: 'perfect_scores_count',     triggerHint: 'Khi đạt 100% quiz' },
  { code: 'doc_completed',      xp: 10,                                        triggerHint: 'Khi đọc xong tài liệu' },
  { code: 'certificate_issued', xp: 200, counter: 'certificates_count',       triggerHint: 'Khi nhận chứng chỉ' },
];

export const LEVEL_RULES = {
  formula: 'required_xp(N) = 100 × (N-1)^1.5',
  maxLevel: 100,
  examples: [
    { level: 1, requiredXp: 0 },
    { level: 2, requiredXp: 100 },
    { level: 3, requiredXp: 283 },
    { level: 5, requiredXp: 1118 },
    { level: 10, requiredXp: 3162 },
    { level: 20, requiredXp: 8556 },
  ] as { level: number; requiredXp: number }[],
  titles: [
    { level: 1,  title: 'Tân binh' },
    { level: 2,  title: 'Học viên' },
    { level: 3,  title: 'Sơ cấp' },
    { level: 5,  title: 'Trung cấp' },
    { level: 10, title: 'Cao cấp' },
    { level: 15, title: 'Chuyên gia' },
    { level: 20, title: 'Bậc thầy' },
    { level: 30, title: 'Đại sư' },
    { level: 50, title: 'Huyền thoại' },
    { level: 100, title: 'Thần thoại' },
  ] as { level: number; title: string }[],
} as const;

export const LEADERBOARD_RULES = {
  formula: 'total_score = quiz_avg × 0.6 + exam_avg × 0.4',
  quizWeight: 0.6,
  examWeight: 0.4,
  scale: 100,
  note: 'Trọng số cố định, dùng cho bảng xếp hạng nội bộ từng lớp học. Không áp dụng cho ranking tổng (XP).',
} as const;
