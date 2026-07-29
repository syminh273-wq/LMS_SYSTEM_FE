export const VALID_TABS = [
  'info',
  'docs',
  'chat',
  'meeting',
  'exams',
  'final_exams',
  'quiz',
  'students',
  'ai',
  'blacklist',
  'calendar',
  'leave_request',
  'ranking',
] as const;

export type ActiveTab = (typeof VALID_TABS)[number];
export type ActiveTabKey = ActiveTab;
