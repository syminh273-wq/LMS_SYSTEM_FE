import { useState } from 'react';
import { toast } from 'sonner';
import { updateFolder, type ApiCtx } from '@/features/classroom/components/docs-manager/api';
import type { ClassroomFolder } from '@/features/classroom/components/docs-manager/types';

export function useRenameFolder(ctx: ApiCtx, t: (key: string, fallback?: string) => string) {
  const [renaming, setRenaming] = useState(false);

  const rename = async (folderUid: string, payload: { name: string; is_preview_only: boolean }): Promise<ClassroomFolder | null> => {
    setRenaming(true);
    try {
      const folder = await updateFolder(ctx, folderUid, payload);
      toast.success(t('classroom.docs.folder_renamed', 'Đã đổi tên'));
      return folder;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi đổi tên');
      return null;
    } finally {
      setRenaming(false);
    }
  };

  return { renameFolder: rename, renaming };
}

export default useRenameFolder;
