'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchDocsTree,
  fetchDocsInFolder,
  createFolder,
  updateFolder,
  deleteFolder,
  reorderDocs,
  uploadDoc,
  deleteDoc,
} from '../api';
import { findPathToFolder } from '../tree-utils';
import type { ClassroomDoc, ClassroomFolder, SortField, SortDir } from '../types';

type UseDocsTreeArgs = {
  classroomUid: string;
  apiBase: string;
  accessToken: string | null;
  canManage: boolean;
  t: (key: string, fallback?: string) => string;
};

export function useDocsTree({
  classroomUid,
  apiBase,
  accessToken,
  canManage,
  t,
}: UseDocsTreeArgs) {
  const [allFolders, setAllFolders] = useState<ClassroomFolder[]>([]);
  const [rootDocs, setRootDocs] = useState<ClassroomDoc[]>([]);
  const [folderDocs, setFolderDocs] = useState<ClassroomDoc[]>([]);
  const [docsByFolder, setDocsByFolder] = useState<Record<string, ClassroomDoc[]>>({});
  const [previewFolderUid, setPreviewFolderUid] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<ClassroomFolder | null>(null);
  const [progressDoc, setProgressDoc] = useState<ClassroomDoc | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<ClassroomFolder | null>(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState<{ uid: string; name: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ClassroomDoc | null>(null);

  const ctx = useMemo(
    () => ({ apiBase, accessToken, classroomUid }),
    [apiBase, accessToken, classroomUid],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDocsTree(ctx);
      setAllFolders(data.folders);
      setRootDocs(data.docs_root);
      setPreviewFolderUid(data.preview_folder_uid ?? null);
      const folderDocsMap: Record<string, ClassroomDoc[]> = {};
      await Promise.all(
        data.folders.map(async (f) => {
          try {
            const docs = await fetchDocsInFolder(ctx, f.uid);
            folderDocsMap[f.uid] = docs;
          } catch {
            folderDocsMap[f.uid] = [];
          }
        }),
      );
      setDocsByFolder(folderDocsMap);
      if (selectedFolderId) {
        const docs = await fetchDocsInFolder(ctx, selectedFolderId);
        setFolderDocs(docs);
      } else {
        setFolderDocs([]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải tài liệu');
    } finally {
      setLoading(false);
    }
  }, [ctx, selectedFolderId]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps --
       data-fetch on mount: refresh internally sets loading/error state. */
    void refresh();
  }, [classroomUid]);

  useEffect(() => {
    if (selectedFolderId === null) {
      return;
    }
    let cancelled = false;
    fetchDocsInFolder(ctx, selectedFolderId)
      .then((docs) => {
        if (!cancelled) setFolderDocs(docs);
      })
      .catch(() => {
        if (!cancelled) setFolderDocs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx, selectedFolderId]);

  const currentDocs = selectedFolderId === null ? rootDocs : folderDocs;
  const currentBreadcrumb = useMemo(() => {
    if (selectedFolderId === null) return [];
    return findPathToFolder(allFolders, selectedFolderId);
  }, [allFolders, selectedFolderId]);

  const handleCreateFolder = async ({
    name,
    parentFolderId,
    isPreviewOnly,
  }: {
    name: string;
    parentFolderId: string | null;
    isPreviewOnly: boolean;
  }) => {
    if (!canManage) return;
    const resolvedParent = parentFolderId ?? createParentId ?? null;
    try {
      await createFolder(ctx, { name, parent_folder_id: resolvedParent, is_preview_only: isPreviewOnly });
      toast.success(t('classroom.docs.folder_created', 'Đã tạo thư mục'));
      setCreateOpen(false);
      setCreateParentId(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo thư mục');
    }
  };

  const handleRename = async ({
    name,
    isPreviewOnly,
  }: {
    name: string;
    parentFolderId: string | null;
    isPreviewOnly: boolean;
  }) => {
    if (!renameTarget) return;
    try {
      await updateFolder(ctx, renameTarget.uid, { name, is_preview_only: isPreviewOnly });
      toast.success(t('classroom.docs.folder_renamed', 'Đã đổi tên'));
      setRenameTarget(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi đổi tên');
    }
  };

  const requestDeleteFolder = (folder: ClassroomFolder) => {
    if (!canManage) return;
    setDeleteFolderTarget(folder);
  };

  const confirmDeleteFolder = async () => {
    const folder = deleteFolderTarget;
    if (!folder) return;
    try {
      await deleteFolder(ctx, folder.uid);
      if (selectedFolderId === folder.uid) setSelectedFolderId(null);
      toast.success(t('classroom.docs.folder_deleted', 'Đã xóa thư mục'));
      setDeleteFolderTarget(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa thư mục');
    }
  };

  const requestDeleteDoc = (doc: ClassroomDoc) => {
    if (!canManage) return;
    setDeleteDocTarget({ uid: doc.uid, name: doc.name });
  };

  const confirmDeleteDoc = async () => {
    const target = deleteDocTarget;
    if (!target) return;
    try {
      await deleteDoc(ctx, target.uid);
      if (selectedFolderId === null) {
        setRootDocs((prev) => prev.filter((d) => d.uid !== target.uid));
      } else {
        setFolderDocs((prev) => prev.filter((d) => d.uid !== target.uid));
      }
      toast.success(t('classroom.docs.doc_deleted', 'Đã xóa tài liệu'));
      setDeleteDocTarget(null);
      setPreviewDoc(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa tài liệu');
    }
  };

  const handlePreviewDelete = (doc: ClassroomDoc) => {
    requestDeleteDoc(doc);
  };

  const handleReorder = async (orderedUids: string[]) => {
    if (!canManage) return;
    const items = orderedUids.map((uid, idx) => ({
      uid,
      folder_id: selectedFolderId,
      order_index: idx,
    }));
    try {
      await reorderDocs(ctx, items);
      if (selectedFolderId === null) {
        setRootDocs((prev) => {
          const map = new Map(prev.map((d) => [d.uid, d]));
          return orderedUids.map((uid, idx) => ({ ...(map.get(uid) as ClassroomDoc), order_index: idx }));
        });
      } else {
        setFolderDocs((prev) => {
          const map = new Map(prev.map((d) => [d.uid, d]));
          return orderedUids.map((uid, idx) => ({ ...(map.get(uid) as ClassroomDoc), order_index: idx }));
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu thứ tự');
    }
  };

  const handleDeleteDoc = (doc: ClassroomDoc) => {
    requestDeleteDoc(doc);
  };

  const handleUpload = async (payload: { file: File; section: string; folderId: string | null }) => {
    try {
      const newDoc = await uploadDoc(ctx, payload.file, {
        section: payload.section,
        folder_id: payload.folderId,
      });
      if (payload.folderId === selectedFolderId || (payload.folderId === null && selectedFolderId === null)) {
        if (selectedFolderId === null) {
          setRootDocs((prev) => [newDoc, ...prev]);
        } else {
          setFolderDocs((prev) => [newDoc, ...prev]);
        }
      }
      toast.success(t('classroom.docs.uploaded', 'Đã tải lên'));
      setUploadOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải lên');
    }
  };

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return {
    allFolders,
    rootDocs,
    folderDocs,
    docsByFolder,
    previewFolderUid,
    selectedFolderId,
    setSelectedFolderId,
    loading,
    search,
    setSearch,
    sortField,
    sortDir,
    handleSortChange,
    currentDocs,
    currentBreadcrumb,
    refresh,
    uploadOpen,
    setUploadOpen,
    createOpen,
    setCreateOpen,
    createParentId,
    setCreateParentId,
    renameTarget,
    setRenameTarget,
    progressDoc,
    setProgressDoc,
    deleteFolderTarget,
    setDeleteFolderTarget,
    deleteDocTarget,
    setDeleteDocTarget,
    previewDoc,
    setPreviewDoc,
    handleCreateFolder,
    handleRename,
    requestDeleteFolder,
    confirmDeleteFolder,
    requestDeleteDoc,
    confirmDeleteDoc,
    handleReorder,
    handleUpload,
    handlePreviewDelete,
    handleDeleteDoc,
  };
}
