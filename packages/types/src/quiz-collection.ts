export type QuizCollectionItem = {
  quiz_id: string;
  order: number;
  added_at: string;
};

export type QuizCollectionAssignment = {
  collection_id: string;
  classroom_id: string;
  assigned_by: string;
  assigned_at: string;
};

export type QuizCollection = {
  uid: string;
  created_by: string;
  title: string;
  description: string;
  quiz_count: number;
  certificate_id: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
};

export type QuizCollectionDetail = QuizCollection & {
  items: QuizCollectionItem[];
  assignments: QuizCollectionAssignment[];
};

export type QuizCollectionProgress = {
  total: number;
  passed: number;
  is_completed: boolean;
  percent: number;
  passed_quiz_ids: string[];
  missing_quiz_ids: string[];
};

export type CreateQuizCollectionRequest = {
  title: string;
  description?: string;
  certificate_id?: string | null;
};

export type UpdateQuizCollectionRequest = {
  title?: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
  certificate_id?: string | null;
};

export type AddQuizToCollectionRequest = {
  quiz_ids: string[];
};

export type ReorderCollectionRequest = {
  ordered_quiz_ids: string[];
};

export type AssignCollectionRequest = {
  classroom_id: string;
};
