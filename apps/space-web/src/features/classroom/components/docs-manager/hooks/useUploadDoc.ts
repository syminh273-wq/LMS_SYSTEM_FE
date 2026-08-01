import { useState } from 'react';
import { toast } from 'sonner';
import { uploadDoc, type ApiCtx } from '@/features/classroom/components/docs-manager/api';
import type { ClassroomDoc } from '@/features/classroom/components/docs-manager/types';

export function useUploadDoc(ctx: ApiCtx, t: (key: string, fallback?: string) => string) {
  const [uploading, setUploading] = useState(false);

  const upload = async (payload: { file: File; section: string; folderId: string | null }): Promise<ClassroomDoc | null> => {
    setUploading(true);
    try {
      const newDoc = await uploadDoc(ctx, payload.file, {
        section: payload.section,
        folder_id: payload.folderId,
      });
      toast.success(t('classroom.docs.uploaded', 'Đã tải lên'));
      return newDoc;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải lên');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadDoc: upload, uploading };
}

export default useUploadDoc;
