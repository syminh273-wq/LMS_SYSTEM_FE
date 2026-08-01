import { useState } from 'react';
import { toast } from 'sonner';
import { deleteFolder, type ApiCtx } from '@/features/classroom/components/docs-manager/api';

export function useDeleteFolder(ctx: ApiCtx, t: (key: string, fallback?: string) => string) {
  const [deleting, setDeleting] = useState(false);

  const remove = async (folderUid: string): Promise<boolean> => {
    setDeleting(true);
    try {
      await deleteFolder(ctx, folderUid);
      toast.success(t('classroom.docs.folder_deleted', 'Đã xóa thư mục'));
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa thư mục');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteFolder: remove, deleting };
}

export default useDeleteFolder;
