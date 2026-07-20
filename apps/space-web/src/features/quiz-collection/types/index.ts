export interface QuizCollectionItem {
  quiz_id: string;
  order: number;
  added_at: string;
}

export interface QuizCollectionAssignment {
  collection_id: string;
  classroom_id: string;
  assigned_by: string;
  assigned_at: string;
}

export interface QuizCollection {
  uid: string;
  created_by: string;
  title: string;
  description: string;
  quiz_count: number;
  certificate_id: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface QuizCollectionDetail extends QuizCollection {
  items: QuizCollectionItem[];
  assignments: QuizCollectionAssignment[];
}

export interface Certificate {
  uid: string;
  created_by: string;
  name: string;
  description: string;
  template_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateQuizCollectionRequest {
  title: string;
  description?: string;
  certificate_id?: string | null;
}

export interface UpdateQuizCollectionRequest {
  title?: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
  certificate_id?: string | null;
}

export interface AddQuizToCollectionRequest {
  quiz_ids: string[];
}

export interface ReorderCollectionRequest {
  ordered_quiz_ids: string[];
}

export interface AssignCollectionRequest {
  classroom_id: string;
}

export interface CreateCertificateRequest {
  name: string;
  description?: string;
  template_url?: string;
  is_active?: boolean;
}

export interface UpdateCertificateRequest {
  name?: string;
  description?: string;
  template_url?: string | null;
  is_active?: boolean;
}
