import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchDocsTree } from '../api';
import { flattenTree, collectDocsByFolder } from '../tree-utils';
import type { ClassroomDoc, ClassroomFolder } from '../types';

export type UseDocsTreeArgs = {
  classroomUid: string;
  apiBase: string;
  accessToken: string | null;
};

export function useDocsTree({ classroomUid, apiBase, accessToken }: UseDocsTreeArgs) {
  const [allFolders, setAllFolders] = useState<ClassroomFolder[]>([]);
  const [rootDocs, setRootDocs] = useState<ClassroomDoc[]>([]);
  const [docsByFolder, setDocsByFolder] = useState<Record<string, ClassroomDoc[]>>({});
  const [previewFolderUid, setPreviewFolderUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ctx = useMemo(
    () => ({ apiBase, accessToken, classroomUid }),
    [apiBase, accessToken, classroomUid],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDocsTree(ctx);
      setAllFolders(flattenTree(data.folders));
      setDocsByFolder(collectDocsByFolder(data.folders));
      setRootDocs(data.docs_root);
      setPreviewFolderUid(data.preview_folder_uid ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải tài liệu');
    } finally {
      setLoading(false);
    }
  }, [ctx]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps --
       data-fetch on mount: refresh internally sets loading/error state. */
    void refresh();
  }, [classroomUid]);

  const updateFolderDocs = useCallback(
    (folderId: string, updater: (prev: ClassroomDoc[]) => ClassroomDoc[]) => {
      setDocsByFolder((prev) => ({ ...prev, [folderId]: updater(prev[folderId] ?? []) }));
    },
    [],
  );

  return {
    ctx,
    allFolders,
    rootDocs,
    setRootDocs,
    docsByFolder,
    updateFolderDocs,
    previewFolderUid,
    loading,
    refresh,
  };
}

export default useDocsTree;
