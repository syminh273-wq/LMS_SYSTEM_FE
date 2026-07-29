import { useState } from 'react';
import { toast } from 'sonner';
import { reorderDocs, type ApiCtx } from '../api';

export function useReorderDocs(ctx: ApiCtx) {
  const [reordering, setReordering] = useState(false);

  const reorder = async (items: Array<{ uid: string; folder_id: string | null; order_index: number }>): Promise<boolean> => {
    setReordering(true);
    try {
      await reorderDocs(ctx, items);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu thứ tự');
      return false;
    } finally {
      setReordering(false);
    }
  };

  return { reorderDocs: reorder, reordering };
}

export default useReorderDocs;
