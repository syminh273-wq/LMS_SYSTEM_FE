export type Certificate = {
  uid: string;
  created_by: string;
  name: string;
  description: string;
  template_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateCertificateRequest = {
  name: string;
  description?: string;
  template_url?: string;
  is_active?: boolean;
};

export type UpdateCertificateRequest = {
  name?: string;
  description?: string;
  template_url?: string | null;
  is_active?: boolean;
};

export type IssuedCertificate = {
  uid: string;
  student_id: string;
  certificate_id: string;
  collection_id: string;
  classroom_id: string;
  issued_by: string | null;
  issued_at: string | null;
  issued_at_display?: string;
  pdf_url: string | null;
  verification_code: string;
  title?: string;
  description?: string;
  template_url?: string | null;
  collection_title?: string;
  collection_description?: string;
  student_name?: string;
  student_pid?: string;
  student_avatar_url?: string;
  classroom_name?: string;
};
