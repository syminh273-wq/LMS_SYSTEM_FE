import * as React from 'react';
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
  const tree = useDocsTree({ classroomUid, apiBase, accessToken, canManage, t });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Button
            type="button"
            variant="ghost"
            onClick={() => tree.setSelectedFolderId(null)}
            data-active={tree.selectedFolderId === null}
            className="px-2 py-1 rounded-md font-bold text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
          >
            {t('classroom.docs.root_label', 'Tất cả tài liệu')}
          </Button>
          {tree.currentBreadcrumb.map((f) => (
            <React.Fragment key={f.uid}>
              <span className="text-muted-foreground/50">/</span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => tree.setSelectedFolderId(f.uid)}
                data-active={f.uid === tree.selectedFolderId}
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
                  tree.setCreateParentId(null);
                  tree.setCreateOpen(true);
                }}
              >
                <Plus size={14} className="mr-1" />
                {t('classroom.docs.new_folder', 'Thư mục')}
              </Button>
              <Button size="sm" onClick={() => tree.setUploadOpen(true)}>
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
          selectedFolderId={tree.selectedFolderId}
          onSelectFolder={tree.setSelectedFolderId}
          onOpenDoc={(d) => tree.setPreviewDoc(d)}
          onCreateFolder={(parentId) => {
            tree.setCreateParentId(parentId);
            tree.setCreateOpen(true);
          }}
          onRenameFolder={(f) => tree.setRenameTarget(f)}
          onDeleteFolder={tree.requestDeleteFolder}
          onDeleteDoc={tree.requestDeleteDoc}
          canManage={canManage}
          t={t}
        />
        <div className="flex-1 min-w-0">
          {tree.loading && tree.currentDocs.length === 0 ? (
            <div className="flex items-center justify-center py-16 bg-card rounded-2xl border border-border">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('classroom.docs.loading', 'Đang tải...')}
              </span>
            </div>
          ) : (
            <DocsListView
              docs={tree.currentDocs}
              canManage={canManage}
              onReorder={tree.handleReorder}
              onDelete={tree.handleDeleteDoc}
              onShowProgress={(d) => tree.setProgressDoc(d)}
              onOpenPreview={(d) => tree.setPreviewDoc(d)}
              search={tree.search}
              onSearchChange={tree.setSearch}
              sortField={tree.sortField}
              sortDir={tree.sortDir}
              onSortChange={tree.handleSortChange}
              t={t}
            />
          )}
        </div>
      </div>

      <UploadToFolderDialog
        open={tree.uploadOpen}
        onOpenChange={tree.setUploadOpen}
        onSubmit={tree.handleUpload}
        parentFolders={tree.allFolders}
        currentFolderId={tree.selectedFolderId}
        t={t}
      />

      <FolderNameDialog
        open={tree.createOpen}
        onOpenChange={(v) => {
          tree.setCreateOpen(v);
          if (!v) tree.setCreateParentId(null);
        }}
        mode="create"
        onSubmit={tree.handleCreateFolder}
        parentFolders={tree.allFolders}
        initialParentId={tree.createParentId}
        initialIsPreviewOnly={false}
        disablePreviewOption={Boolean(tree.previewFolderUid)}
        t={t}
      />

      <FolderNameDialog
        open={tree.renameTarget !== null}
        onOpenChange={(v) => {
          if (!v) tree.setRenameTarget(null);
        }}
        mode="rename"
        initialName={tree.renameTarget?.name}
        initialIsPreviewOnly={tree.renameTarget?.is_preview_only ?? false}
        disablePreviewOption={
          Boolean(tree.previewFolderUid) && tree.previewFolderUid !== tree.renameTarget?.uid
        }
        onSubmit={tree.handleRename}
        t={t}
      />

      <ConfirmDialog
        open={tree.deleteFolderTarget !== null}
        onOpenChange={(v) => {
          if (!v) tree.setDeleteFolderTarget(null);
        }}
        title={t('classroom.docs.delete_folder_title', 'Xóa thư mục')}
        description={t(
          'classroom.docs.confirm_delete_folder',
          `Xóa thư mục "${tree.deleteFolderTarget?.name ?? ''}" và tất cả thư mục con? Tài liệu sẽ được chuyển về thư mục gốc.`,
        )}
        confirmLabel={t('classroom.docs.delete', 'Xóa')}
        destructive
        onConfirm={tree.confirmDeleteFolder}
        t={t}
      />

      <ConfirmDialog
        open={tree.deleteDocTarget !== null}
        onOpenChange={(v) => {
          if (!v) tree.setDeleteDocTarget(null);
        }}
        title={t('classroom.docs.delete_doc_title', 'Xóa tài liệu')}
        description={t(
          'classroom.docs.confirm_delete_doc',
          `Xóa tài liệu "${tree.deleteDocTarget?.name ?? ''}"?`,
        )}
        confirmLabel={t('classroom.docs.delete', 'Xóa')}
        destructive
        onConfirm={tree.confirmDeleteDoc}
        t={t}
      />

      {tree.progressDoc && (
        <StudentProgressModal
          open={tree.progressDoc !== null}
          onOpenChange={(v) => {
            if (!v) tree.setProgressDoc(null);
          }}
          classroomUid={classroomUid}
          resourceUid={tree.progressDoc.uid}
          resourceName={tree.progressDoc.name}
          apiBase={apiBase}
          accessToken={accessToken}
        />
      )}

      <DocPreviewModal
        doc={tree.previewDoc}
        open={tree.previewDoc !== null}
        onClose={() => tree.setPreviewDoc(null)}
        t={t}
        canManage={canManage}
        onDelete={tree.handlePreviewDelete}
      />
    </div>
  );
}
