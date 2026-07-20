export interface Resource {
  uid: string;
  name: string;
  url: string;
  size?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceFolder {
  uid: string;
  name: string;
  parent_id: string | null;
  classroom_id: string;
  created_at: string;
  updated_at: string;
}
