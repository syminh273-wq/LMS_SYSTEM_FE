import * as React from 'react';
import { useMemo } from 'react';
import { Plus, Upload, Loader2, Folder as FolderIcon, RefreshCcw } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { DocsTreeView } from './DocsTreeView';
import { DocsListView } from './DocsListView';
import { UploadToFolderDialog } from './UploadToFolderDialog';
import { FolderNameDialog } from './FolderNameDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { DocPreviewModal } from './DocPreviewModal';
import { StudentProgressModal } from './StudentProgressModal';
import { useDocsTree } from './hooks/useDocsTree';
import { useDocsTreeUI } from './hooks/useDocsTreeUI';
import { useCreateFolder } from './hooks/useCreateFolder';
import { useRenameFolder } from './hooks/useRenameFolder';
import { useDeleteFolder } from './hooks/useDeleteFolder';
import { useReorderDocs } from './hooks/useReorderDocs';
import { useUploadDoc } from './hooks/useUploadDoc';
import { useDeleteDoc } from './hooks/useDeleteDoc';
import { findPathToFolder } from './tree-utils';
import type { ClassroomDoc, ClassroomFolder } from './types';

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
  const tree = useDocsTree({ classroomUid, apiBase, accessToken });
  const ui = useDocsTreeUI();

  const { createFolder } = useCreateFolder(tree.ctx, t);
  const { renameFolder } = useRenameFolder(tree.ctx, t);
  const { deleteFolder: removeFolder } = useDeleteFolder(tree.ctx, t);
  const { reorderDocs: reorderDocsApi } = useReorderDocs(tree.ctx);
  const { uploadDoc: uploadDocApi } = useUploadDoc(tree.ctx, t);
  const { deleteDoc: removeDocApi } = useDeleteDoc(tree.ctx, t);

  const folderDocs = ui.selectedFolderId ? (tree.docsByFolder[ui.selectedFolderId] ?? []) : [];
  const currentDocs = ui.selectedFolderId === null ? tree.rootDocs : folderDocs;
  const currentBreadcrumb = useMemo(() => {
    if (ui.selectedFolderId === null) return [];
    return findPathToFolder(tree.allFolders, ui.selectedFolderId);
  }, [tree.allFolders, ui.selectedFolderId]);

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
    const resolvedParent = parentFolderId ?? ui.createParentId ?? null;
    const folder = await createFolder({ name, parent_folder_id: resolvedParent, is_preview_only: isPreviewOnly });
    if (folder) {
      ui.setCreateOpen(false);
      ui.setCreateParentId(null);
      await tree.refresh();
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
    if (!ui.renameTarget) return;
    const folder = await renameFolder(ui.renameTarget.uid, { name, is_preview_only: isPreviewOnly });
    if (folder) {
      ui.setRenameTarget(null);
      await tree.refresh();
    }
  };

  const requestDeleteFolder = (folder: ClassroomFolder) => {
    if (!canManage) return;
    ui.setDeleteFolderTarget(folder);
  };

  const confirmDeleteFolder = async () => {
    const folder = ui.deleteFolderTarget;
    if (!folder) return;
    const ok = await removeFolder(folder.uid);
    if (ok) {
      if (ui.selectedFolderId === folder.uid) ui.setSelectedFolderId(null);
      ui.setDeleteFolderTarget(null);
      await tree.refresh();
    }
  };

  const requestDeleteDoc = (doc: ClassroomDoc) => {
    if (!canManage) return;
    ui.setDeleteDocTarget({ uid: doc.uid, name: doc.name });
  };

  const confirmDeleteDoc = async () => {
    const target = ui.deleteDocTarget;
    if (!target) return;
    const ok = await removeDocApi(target.uid);
    if (ok) {
      if (ui.selectedFolderId === null) {
        tree.setRootDocs((prev) => prev.filter((d) => d.uid !== target.uid));
      } else {
        tree.updateFolderDocs(ui.selectedFolderId, (prev) => prev.filter((d) => d.uid !== target.uid));
      }
      ui.setDeleteDocTarget(null);
      ui.setPreviewDoc(null);
    }
  };

  const handlePreviewDelete = (doc: ClassroomDoc) => {
    requestDeleteDoc(doc);
  };

  const handleReorder = async (orderedUids: string[]) => {
    if (!canManage) return;
    const items = orderedUids.map((uid, idx) => ({
      uid,
      folder_id: ui.selectedFolderId,
      order_index: idx,
    }));
    const ok = await reorderDocsApi(items);
    if (ok) {
      const reorder = (prev: ClassroomDoc[]) => {
        const map = new Map(prev.map((d) => [d.uid, d]));
        return orderedUids.map((uid, idx) => ({ ...(map.get(uid) as ClassroomDoc), order_index: idx }));
      };
      if (ui.selectedFolderId === null) {
        tree.setRootDocs(reorder);
      } else {
        tree.updateFolderDocs(ui.selectedFolderId, reorder);
      }
    }
  };

  const handleDeleteDoc = (doc: ClassroomDoc) => {
    requestDeleteDoc(doc);
  };

  const handleUpload = async (payload: { file: File; section: string; folderId: string | null }) => {
    const newDoc = await uploadDocApi(payload);
    if (newDoc) {
      if (payload.folderId === ui.selectedFolderId || (payload.folderId === null && ui.selectedFolderId === null)) {
        if (ui.selectedFolderId === null) {
          tree.setRootDocs((prev) => [newDoc, ...prev]);
        } else {
          tree.updateFolderDocs(ui.selectedFolderId, (prev) => [newDoc, ...prev]);
        }
      }
      ui.setUploadOpen(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Button
            type="button"
            variant="ghost"
            onClick={() => ui.setSelectedFolderId(null)}
            data-active={ui.selectedFolderId === null}
            className="px-2 py-1 rounded-md font-bold text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
          >
            {t('classroom.docs.root_label', 'Tất cả tài liệu')}
          </Button>
          {currentBreadcrumb.map((f) => (
            <React.Fragment key={f.uid}>
              <span className="text-muted-foreground/50">/</span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => ui.setSelectedFolderId(f.uid)}
                data-active={f.uid === ui.selectedFolderId}
                className="px-2 py-1 rounded-md font-bold text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
              >
                <FolderIcon size={12} className="inline-block mr-1" />
                {f.name}
              </Button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => void tree.refresh()}>
            <RefreshCcw size={14} />
          </Button>
          {canManage && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  ui.setCreateParentId(null);
                  ui.setCreateOpen(true);
                }}
              >
                <Plus size={14} className="mr-1" />
                {t('classroom.docs.new_folder', 'Thư mục')}
              </Button>
              <Button size="sm" onClick={() => ui.setUploadOpen(true)}>
                <Upload size={14} className="mr-1" />
                {t('classroom.docs.upload', 'Tải lên')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <DocsTreeView
          folders={tree.allFolders}
          rootDocs={tree.rootDocs}
          docsByFolder={tree.docsByFolder}
          selectedFolderId={ui.selectedFolderId}
          onSelectFolder={ui.setSelectedFolderId}
          onOpenDoc={(d) => ui.setPreviewDoc(d)}
          onCreateFolder={(parentId) => {
            ui.setCreateParentId(parentId);
            ui.setCreateOpen(true);
          }}
          onRenameFolder={(f) => ui.setRenameTarget(f)}
          onDeleteFolder={requestDeleteFolder}
          onDeleteDoc={requestDeleteDoc}
          canManage={canManage}
          t={t}
        />
        <div className="flex-1 min-w-0">
          {tree.loading && currentDocs.length === 0 ? (
            <div className="flex items-center justify-center py-16 bg-card rounded-2xl border border-border">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('classroom.docs.loading', 'Đang tải...')}
              </span>
            </div>
          ) : (
            <DocsListView
              docs={currentDocs}
              canManage={canManage}
              onReorder={handleReorder}
              onDelete={handleDeleteDoc}
              onShowProgress={(d) => ui.setProgressDoc(d)}
              onOpenPreview={(d) => ui.setPreviewDoc(d)}
              search={ui.search}
              onSearchChange={ui.setSearch}
              sortField={ui.sortField}
              sortDir={ui.sortDir}
              onSortChange={ui.handleSortChange}
              t={t}
            />
          )}
        </div>
      </div>

      <UploadToFolderDialog
        open={ui.uploadOpen}
        onOpenChange={ui.setUploadOpen}
        onSubmit={handleUpload}
        parentFolders={tree.allFolders}
        currentFolderId={ui.selectedFolderId}
        t={t}
      />

      <FolderNameDialog
        open={ui.createOpen}
        onOpenChange={(v) => {
          ui.setCreateOpen(v);
          if (!v) ui.setCreateParentId(null);
        }}
        mode="create"
        onSubmit={handleCreateFolder}
        parentFolders={tree.allFolders}
        initialParentId={ui.createParentId}
        initialIsPreviewOnly={false}
        disablePreviewOption={Boolean(tree.previewFolderUid)}
        t={t}
      />

      <FolderNameDialog
        open={ui.renameTarget !== null}
        onOpenChange={(v) => {
          if (!v) ui.setRenameTarget(null);
        }}
        mode="rename"
        initialName={ui.renameTarget?.name}
        initialIsPreviewOnly={ui.renameTarget?.is_preview_only ?? false}
        disablePreviewOption={
          Boolean(tree.previewFolderUid) && tree.previewFolderUid !== ui.renameTarget?.uid
        }
        onSubmit={handleRename}
        t={t}
      />

      <ConfirmDialog
        open={ui.deleteFolderTarget !== null}
        onOpenChange={(v) => {
          if (!v) ui.setDeleteFolderTarget(null);
        }}
        title={t('classroom.docs.delete_folder_title', 'Xóa thư mục')}
        description={t(
          'classroom.docs.confirm_delete_folder',
          `Xóa thư mục "${ui.deleteFolderTarget?.name ?? ''}" và tất cả thư mục con? Tài liệu sẽ được chuyển về thư mục gốc.`,
        )}
        confirmLabel={t('classroom.docs.delete', 'Xóa')}
        destructive
        onConfirm={confirmDeleteFolder}
        t={t}
      />

      <ConfirmDialog
        open={ui.deleteDocTarget !== null}
        onOpenChange={(v) => {
          if (!v) ui.setDeleteDocTarget(null);
        }}
        title={t('classroom.docs.delete_doc_title', 'Xóa tài liệu')}
        description={t(
          'classroom.docs.confirm_delete_doc',
          `Xóa tài liệu "${ui.deleteDocTarget?.name ?? ''}"?`,
        )}
        confirmLabel={t('classroom.docs.delete', 'Xóa')}
        destructive
        onConfirm={confirmDeleteDoc}
        t={t}
      />

      {ui.progressDoc && (
        <StudentProgressModal
          open={ui.progressDoc !== null}
          onOpenChange={(v) => {
            if (!v) ui.setProgressDoc(null);
          }}
          classroomUid={classroomUid}
          resourceUid={ui.progressDoc.uid}
          resourceName={ui.progressDoc.name}
          apiBase={apiBase}
          accessToken={accessToken}
        />
      )}

      <DocPreviewModal
        doc={ui.previewDoc}
        open={ui.previewDoc !== null}
        onClose={() => ui.setPreviewDoc(null)}
        t={t}
        canManage={canManage}
        onDelete={handlePreviewDelete}
      />
    </div>
  );
}
