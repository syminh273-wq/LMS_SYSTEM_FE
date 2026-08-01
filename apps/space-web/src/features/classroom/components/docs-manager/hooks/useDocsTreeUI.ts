import { useState } from 'react';
import type { ClassroomDoc, ClassroomFolder, SortField, SortDir } from '@/features/classroom/components/docs-manager/types';

// Non-API: UI-only state for the docs manager (selection, search/sort, modal targets).
export function useDocsTreeUI() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

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

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return {
    selectedFolderId,
    setSelectedFolderId,
    search,
    setSearch,
    sortField,
    sortDir,
    handleSortChange,
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
  };
}

export default useDocsTreeUI;
