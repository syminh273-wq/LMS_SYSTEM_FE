'use client';

import * as React from 'react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Plus, Upload, Loader2, Folder as FolderIcon, RefreshCcw } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { DocsTreeSidebar } from './DocsTreeSidebar';
import { DocsListView } from './DocsListView';
import { UploadToFolderDialog } from './UploadToFolderDialog';
import { FolderNameDialog } from './FolderNameDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { DocPreviewModal } from './DocPreviewModal';
import {
  fetchDocsTree,
  fetchDocsInFolder,
  createFolder,
  updateFolder,
  deleteFolder,
  reorderDocs,
  uploadDoc,
  deleteDoc,
} from './api';
import { buildFolderTree, findPathToFolder } from './tree-utils';
import type { ClassroomDoc, ClassroomFolder, SortField, SortDir } from './types';
import { StudentProgressModal } from './StudentProgressModal';

type Props = {
  classroomUid: string;
  apiBase: string;
  accessToken: string | null;
  canManage: boolean;
  t: (key: string, fallback?: string) => string;
};

export function ClassroomDocsManager({
  classroomUid,
  apiBase,
  accessToken,
  canManage,
  t,
}: Props) {
  const [tree, setTree] = useState<ReturnType<typeof buildFolderTree>>([]);
  const [allFolders, setAllFolders] = useState<ClassroomFolder[]>([]);
  const [rootDocs, setRootDocs] = useState<ClassroomDoc[]>([]);
  const [folderDocs, setFolderDocs] = useState<ClassroomDoc[]>([]);
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
      setTree(buildFolderTree(data.folders));
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`px-2 py-1 rounded-md font-bold ${
              selectedFolderId === null
                ? 'bg-indigo-50 text-indigo-700'
                : 'hover:bg-slate-100'
            }`}
          >
            {t('classroom.docs.root_label', 'Tất cả tài liệu')}
          </button>
          {currentBreadcrumb.map((f) => (
            <React.Fragment key={f.uid}>
              <span className="text-slate-300">/</span>
              <button
                type="button"
                onClick={() => setSelectedFolderId(f.uid)}
                className={`px-2 py-1 rounded-md font-bold ${
                  f.uid === selectedFolderId
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-slate-100'
                }`}
              >
                <FolderIcon size={12} className="inline-block mr-1" />
                {f.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => void refresh()}>
            <RefreshCcw size={14} />
          </Button>
          {canManage && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCreateParentId(null);
                  setCreateOpen(true);
                }}
              >
                <Plus size={14} className="mr-1" />
                {t('classroom.docs.new_folder', 'Thư mục')}
              </Button>
              <Button size="sm" onClick={() => setUploadOpen(true)}>
                <Upload size={14} className="mr-1" />
                {t('classroom.docs.upload', 'Tải lên')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <DocsTreeSidebar
          tree={tree}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onCreateFolder={(parentId) => {
            setCreateParentId(parentId);
            setCreateOpen(true);
          }}
          onRenameFolder={(f) => setRenameTarget(f)}
          onDeleteFolder={requestDeleteFolder}
          totalRootDocs={rootDocs.length}
          t={t}
        />
        <div className="flex-1 min-w-0">
          {loading && currentDocs.length === 0 ? (
            <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
              <span className="text-sm font-medium text-slate-500">
                {t('classroom.docs.loading', 'Đang tải...')}
              </span>
            </div>
          ) : (
            <DocsListView
              docs={currentDocs}
              canManage={canManage}
              onReorder={handleReorder}
              onDelete={handleDeleteDoc}
              onShowProgress={(d) => setProgressDoc(d)}
              onOpenPreview={(d) => setPreviewDoc(d)}
              search={search}
              onSearchChange={setSearch}
              sortField={sortField}
              sortDir={sortDir}
              onSortChange={handleSortChange}
              t={t}
            />
          )}
        </div>
      </div>

      <UploadToFolderDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSubmit={handleUpload}
        parentFolders={allFolders}
        currentFolderId={selectedFolderId}
        t={t}
      />

      <FolderNameDialog
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v);
          if (!v) setCreateParentId(null);
        }}
        mode="create"
        onSubmit={handleCreateFolder}
        parentFolders={allFolders}
        initialParentId={createParentId}
        initialIsPreviewOnly={false}
        disablePreviewOption={Boolean(previewFolderUid)}
        t={t}
      />

      <FolderNameDialog
        open={renameTarget !== null}
        onOpenChange={(v) => {
          if (!v) setRenameTarget(null);
        }}
        mode="rename"
        initialName={renameTarget?.name}
        initialIsPreviewOnly={renameTarget?.is_preview_only ?? false}
        disablePreviewOption={
          Boolean(previewFolderUid) && previewFolderUid !== renameTarget?.uid
        }
        onSubmit={handleRename}
        t={t}
      />

      <ConfirmDialog
        open={deleteFolderTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteFolderTarget(null);
        }}
        title={t('classroom.docs.delete_folder_title', 'Xóa thư mục')}
        description={t(
          'classroom.docs.confirm_delete_folder',
          `Xóa thư mục "${deleteFolderTarget?.name ?? ''}" và tất cả thư mục con? Tài liệu sẽ được chuyển về thư mục gốc.`,
        )}
        confirmLabel={t('classroom.docs.delete', 'Xóa')}
        destructive
        onConfirm={confirmDeleteFolder}
        t={t}
      />

      <ConfirmDialog
        open={deleteDocTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteDocTarget(null);
        }}
        title={t('classroom.docs.delete_doc_title', 'Xóa tài liệu')}
        description={t(
          'classroom.docs.confirm_delete_doc',
          `Xóa tài liệu "${deleteDocTarget?.name ?? ''}"?`,
        )}
        confirmLabel={t('classroom.docs.delete', 'Xóa')}
        destructive
        onConfirm={confirmDeleteDoc}
        t={t}
      />

      {progressDoc && (
        <StudentProgressModal
          open={progressDoc !== null}
          onOpenChange={(v) => {
            if (!v) setProgressDoc(null);
          }}
          classroomUid={classroomUid}
          resourceUid={progressDoc.uid}
          resourceName={progressDoc.name}
          apiBase={apiBase}
          accessToken={accessToken}
        />
      )}

      <DocPreviewModal
        doc={previewDoc}
        open={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        t={t}
        canManage={canManage}
        onDelete={handlePreviewDelete}
      />
    </div>
  );
}
