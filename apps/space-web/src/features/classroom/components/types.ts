export interface ClassroomDoc {
  uid: string;
  name: string;
  url: string;
  file_type?: string;
  size?: number;
  folder_id?: string | null;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClassroomFolder {
  uid: string;
  name: string;
  parent_folder_id?: string | null;
  classroom_id: string;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FolderNode extends ClassroomFolder {
  children: FolderNode[];
}

export type SortField = 'name' | 'created_at' | 'size' | 'file_type';
export type SortDir = 'asc' | 'desc';
