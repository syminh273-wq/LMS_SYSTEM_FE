import { useState } from 'react';
import { toast } from 'sonner';
import { createFolder, type ApiCtx } from '../api';
import type { ClassroomFolder } from '../types';

export function useCreateFolder(ctx: ApiCtx, t: (key: string, fallback?: string) => string) {
  const [creating, setCreating] = useState(false);

  const create = async (payload: { name: string; parent_folder_id: string | null; is_preview_only: boolean }): Promise<ClassroomFolder | null> => {
    setCreating(true);
    try {
      const folder = await createFolder(ctx, payload);
      toast.success(t('classroom.docs.folder_created', 'Đã tạo thư mục'));
      return folder;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo thư mục');
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { createFolder: create, creating };
}

export default useCreateFolder;
