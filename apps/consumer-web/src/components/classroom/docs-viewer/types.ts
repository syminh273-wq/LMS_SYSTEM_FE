export type ClassroomDoc = {
  uid: string;
  name: string;
  url: string;
  file_type?: string;
  size?: number;
  folder_id?: string | null;
  order_index?: number;
  metadata?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
};

export type ClassroomFolder = {
  uid: string;
  classroom_id: string;
  name: string;
  parent_folder_id: string | null;
  owner_id: string;
  order_index: number;
  color?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type FolderNode = ClassroomFolder & {
  children: FolderNode[];
  docs: ClassroomDoc[];
};

export type DocsTreeResponse = {
  folders: FolderNode[];
  docs_root: ClassroomDoc[];
  preview_only?: boolean;
  requires_payment?: boolean;
};

export type SortField = 'name' | 'created_at' | 'size' | 'file_type';
export type SortDir = 'asc' | 'desc';
