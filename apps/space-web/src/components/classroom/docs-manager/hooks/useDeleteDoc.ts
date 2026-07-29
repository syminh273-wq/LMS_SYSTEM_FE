import { useState } from 'react';
import { toast } from 'sonner';
import { deleteDoc, type ApiCtx } from '../api';

export function useDeleteDoc(ctx: ApiCtx, t: (key: string, fallback?: string) => string) {
  const [deleting, setDeleting] = useState(false);

  const remove = async (docUid: string): Promise<boolean> => {
    setDeleting(true);
    try {
      await deleteDoc(ctx, docUid);
      toast.success(t('classroom.docs.doc_deleted', 'Đã xóa tài liệu'));
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa tài liệu');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteDoc: remove, deleting };
}

export default useDeleteDoc;
