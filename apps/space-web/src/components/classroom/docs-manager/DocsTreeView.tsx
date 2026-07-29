'use client';

import * as React from 'react';
import { useMemo } from 'react';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  File as FileIcon,
  Folder as FolderIcon,
  FolderOpen,
  Home,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { hotkeysCoreFeature, syncDataLoaderFeature } from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { Tree, TreeItem } from '@/components/reui/tree';
import { cn } from '@/lib/utils';
import type { ClassroomDoc, ClassroomFolder, FolderNode } from './types';
import { buildFolderTree } from './tree-utils';

const ICON_BY_TYPE: Record<string, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  md: FileText,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  webp: FileImage,
  svg: FileImage,
  bmp: FileImage,
  mp4: FileVideo,
  mov: FileVideo,
  avi: FileVideo,
  mkv: FileVideo,
  webm: FileVideo,
  mp3: FileAudio,
  wav: FileAudio,
  ogg: FileAudio,
  m4a: FileAudio,
  zip: FileArchive,
  rar: FileArchive,
  '7z': FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
};

function pickFileIcon(fileType?: string) {
  const t = (fileType || '').toLowerCase();
  return ICON_BY_TYPE[t] ?? FileIcon;
}

const ROOT_ID = '__root__';
const ALL_DOCS_ID = '__all_docs__';

type TreeItemData =
  | { kind: 'root'; name: string; docCount: number }
  | { kind: 'all-docs'; name: string; docCount: number }
  | { kind: 'folder'; folder: ClassroomFolder }
  | { kind: 'doc'; doc: ClassroomDoc };

type Props = {
  folders: ClassroomFolder[];
  rootDocs: ClassroomDoc[];
  docsByFolder: Record<string, ClassroomDoc[]>;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onOpenDoc: (doc: ClassroomDoc) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folder: ClassroomFolder) => void;
  onDeleteFolder: (folder: ClassroomFolder) => void;
  onDeleteDoc: (doc: ClassroomDoc) => void;
  canManage: boolean;
  t: (key: string, fallback?: string) => string;
};

export function DocsTreeView({
  folders,
  rootDocs,
  docsByFolder,
  selectedFolderId,
  onSelectFolder,
  onOpenDoc,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDeleteDoc,
  canManage,
  t,
}: Props) {
  const tree: FolderNode[] = useMemo(() => buildFolderTree(folders), [folders]);

  const items = useMemo(() => {
    const map: Record<string, TreeItemData> = {};
    map[ROOT_ID] = {
      kind: 'root',
      name: t('classroom.docs.folders_title', 'Tài liệu'),
      docCount: rootDocs.length + Object.values(docsByFolder).reduce((s, d) => s + d.length, 0),
    };
    map[ALL_DOCS_ID] = {
      kind: 'all-docs',
      name: t('classroom.docs.root_label', 'Tất cả tài liệu'),
      docCount: rootDocs.length,
    };
    for (const f of folders) {
      map[`folder:${f.uid}`] = { kind: 'folder', folder: f };
    }
    for (const [folderId, docs] of Object.entries(docsByFolder)) {
      for (const d of docs) {
        map[`doc:${folderId}:${d.uid}`] = { kind: 'doc', doc: d };
      }
    }
    for (const d of rootDocs) {
      map[`doc:root:${d.uid}`] = { kind: 'doc', doc: d };
    }
    return map;
  }, [folders, rootDocs, docsByFolder, t]);

  const childrenMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    map[ROOT_ID] = [ALL_DOCS_ID, ...tree.map((f) => `folder:${f.uid}`)];
    map[ALL_DOCS_ID] = rootDocs.map((d) => `doc:root:${d.uid}`);
    const folderChildDocs: Record<string, string[]> = {};
    for (const [folderId, docs] of Object.entries(docsByFolder)) {
      folderChildDocs[folderId] = docs.map((d) => `doc:${folderId}:${d.uid}`);
    }
    const buildFolderChildren = (nodes: FolderNode[]): void => {
      for (const n of nodes) {
        const id = `folder:${n.uid}`;
        const docChildren = folderChildDocs[n.uid] ?? [];
        const subFolders = n.children.map((c) => `folder:${c.uid}`);
        map[id] = [...docChildren, ...subFolders];
        buildFolderChildren(n.children);
      }
    };
    buildFolderChildren(tree);
    return map;
  }, [tree, rootDocs, docsByFolder]);

  const initialFocus = selectedFolderId === null ? ALL_DOCS_ID : `folder:${selectedFolderId}`;

  const headlessTree = useTree<TreeItemData>({
    initialState: {
      expandedItems: [ROOT_ID, ALL_DOCS_ID, ...tree.map((f) => `folder:${f.uid}`)],
      focusedItem: initialFocus,
    },
    indent: 18,
    rootItemId: ROOT_ID,
    getItemName: (item) => {
      const data = item.getItemData();
      if (data.kind === 'folder') return data.folder.name;
      if (data.kind === 'doc') return data.doc.name;
      return data.name;
    },
    isItemFolder: (item) => {
      const data = item.getItemData();
      return data.kind === 'root' || data.kind === 'all-docs' || data.kind === 'folder';
    },
    onPrimaryAction: (item) => {
      const data = item.getItemData();
      if (data.kind === 'all-docs') {
        onSelectFolder(null);
      } else if (data.kind === 'folder') {
        onSelectFolder(data.folder.uid);
      } else if (data.kind === 'doc') {
        onOpenDoc(data.doc);
      }
    },
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => childrenMap[itemId] ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  const isItemSelected = (itemId: string): boolean => {
    if (selectedFolderId === null) return itemId === ALL_DOCS_ID;
    return itemId === `folder:${selectedFolderId}`;
  };

  const renderActionButtons = (
    kind: 'folder' | 'doc',
    payload: ClassroomFolder | ClassroomDoc,
  ) => {
    if (!canManage) return null;
    if (kind === 'folder') {
      const folder = payload as ClassroomFolder;
      return (
        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 ml-1"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Add subfolder"
            title={t('classroom.docs.new_subfolder', 'Thêm thư mục con')}
            onClick={(e) => {
              e.stopPropagation();
              onCreateFolder(folder.uid);
            }}
            className="h-5 w-5 rounded inline-flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-primary-brand"
          >
            <Plus size={11} />
          </button>
          <button
            type="button"
            aria-label="Rename folder"
            title={t('classroom.docs.rename', 'Đổi tên')}
            onClick={(e) => {
              e.stopPropagation();
              onRenameFolder(folder);
            }}
            className="h-5 w-5 rounded inline-flex items-center justify-center text-muted-foreground hover:bg-muted"
          >
            <Edit2 size={11} />
          </button>
          <button
            type="button"
            aria-label="Delete folder"
            title={t('classroom.docs.delete', 'Xóa')}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(folder);
            }}
            className="h-5 w-5 rounded inline-flex items-center justify-center text-muted-foreground hover:bg-rose-100 hover:text-rose-600"
          >
            <Trash2 size={11} />
          </button>
        </div>
      );
    }
    const doc = payload as ClassroomDoc;
    return (
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 ml-1"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Delete document"
          title={t('classroom.docs.delete', 'Xóa')}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteDoc(doc);
          }}
          className="h-5 w-5 rounded inline-flex items-center justify-center text-muted-foreground hover:bg-rose-100 hover:text-rose-600"
        >
          <Trash2 size={11} />
        </button>
      </div>
    );
  };

  const renderRow = (item: ReturnType<typeof headlessTree.getItems>[number]) => {
    const data = item.getItemData();
    const itemId = item.getId();
    if (data.kind === 'root') return null;

    const selected = isItemSelected(itemId);
    const isFolder = data.kind === 'all-docs' || data.kind === 'folder';
    const isExpanded = item.isExpanded();

    const handleRowClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button[data-tree-action]')) return;
      if (isFolder) {
        if (data.kind === 'all-docs') onSelectFolder(null);
        else onSelectFolder(data.folder.uid);
      } else if (data.kind === 'doc') {
        onOpenDoc(data.doc);
      }
    };

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isExpanded) item.collapse();
      else item.expand();
    };

    const baseRow =
      'group flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm transition-colors cursor-pointer w-full overflow-hidden';
    const selectedCls = selected
      ? 'bg-primary-brand-light text-primary-brand font-semibold'
      : 'text-foreground hover:bg-muted';

    if (data.kind === 'all-docs') {
      return (
        <TreeItem
          key={itemId}
          item={item}
          render={(props) => <div {...props} />}
        >
          <div
            onClick={handleRowClick}
            className={cn(baseRow, selectedCls)}
            style={{ paddingLeft: 8 }}
          >
            <span className="w-4 h-4 shrink-0 inline-flex items-center justify-center" />
            <Home className="text-muted-foreground pointer-events-none size-4 shrink-0" />
            <span className="truncate flex-1 min-w-0">{data.name}</span>
          </div>
        </TreeItem>
      );
    }

    if (data.kind === 'folder') {
      const folderDocCount = docsByFolder[data.folder.uid]?.length ?? 0;
      return (
        <TreeItem
          key={itemId}
          item={item}
          render={(props) => <div {...props} />}
        >
          <div
            onClick={handleRowClick}
            className={cn(baseRow, selectedCls)}
          >
            <button
              type="button"
              data-tree-action
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              onClick={handleToggle}
              className="w-4 h-4 shrink-0 inline-flex items-center justify-center text-muted-foreground hover:text-foreground rounded"
              tabIndex={-1}
            >
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            {isExpanded ? (
              <FolderOpen className="text-muted-foreground pointer-events-none size-4 shrink-0" />
            ) : (
              <FolderIcon className="text-muted-foreground pointer-events-none size-4 shrink-0" />
            )}
            <span className="truncate flex-1 min-w-0">{data.folder.name}</span>
            {folderDocCount > 0 && (
              <span className="text-[10px] font-bold text-muted-foreground bg-card border border-border rounded-full min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center shrink-0">
                {folderDocCount}
              </span>
            )}
            {renderActionButtons('folder', data.folder)}
          </div>
        </TreeItem>
      );
    }

    // doc
    const Icon = pickFileIcon(data.doc.file_type);
    return (
      <TreeItem
        key={itemId}
        item={item}
        render={(props) => <div {...props} />}
      >
        <div
          onClick={handleRowClick}
          className={cn(baseRow, selectedCls)}
        >
          <span className="w-4 h-4 shrink-0 inline-flex items-center justify-center" />
          <Icon className="text-muted-foreground pointer-events-none size-4 shrink-0" />
          <span className="truncate flex-1 min-w-0">{data.doc.name}</span>
          {renderActionButtons('doc', data.doc)}
        </div>
      </TreeItem>
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-2 flex flex-col gap-1 w-full lg:w-72 shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {t('classroom.docs.folders_title', 'Thư mục')}
        </span>
        {canManage && (
          <button
            type="button"
            onClick={() => onCreateFolder(selectedFolderId)}
            title={
              selectedFolderId
                ? t(
                    'classroom.docs.new_subfolder',
                    'Tạo thư mục con bên trong thư mục hiện tại',
                  )
                : t('classroom.docs.new_folder', 'Tạo thư mục mới')
            }
            className="h-7 px-2 rounded-md text-xs font-medium inline-flex items-center text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Plus size={13} className="mr-1" /> {t('classroom.docs.new_folder', 'Mới')}
          </button>
        )}
      </div>

      <Tree
        className="px-1 overflow-x-hidden"
        indent={18}
        tree={headlessTree}
      >
        {headlessTree.getItems().map(renderRow)}
      </Tree>
    </div>
  );
}
