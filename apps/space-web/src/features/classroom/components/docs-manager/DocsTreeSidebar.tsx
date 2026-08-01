import * as React from 'react';
import { useState } from 'react';
import {
  Folder as FolderIcon,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Home,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@shared/components/ui/dropdown-menu';
import type { FolderNode, ClassroomFolder } from './types';

type Props = {
  tree: FolderNode[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folder: ClassroomFolder) => void;
  onDeleteFolder: (folder: ClassroomFolder) => void;
  totalRootDocs: number;
  t: (key: string, fallback?: string) => string;
};

function NodeRow({
  node,
  depth,
  selected,
  onSelect,
  onRename,
  onDelete,
  onAddChild,
  t,
}: {
  node: FolderNode;
  depth: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onRename: (f: ClassroomFolder) => void;
  onDelete: (f: ClassroomFolder) => void;
  onAddChild: (f: ClassroomFolder) => void;
  t: (key: string, fallback?: string) => string;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
          selected ? 'bg-primary-brand-light text-primary-brand font-semibold' : ''
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
        data-active={selected}
        onClick={() => onSelect(node.uid)}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="h-6 w-6 p-0.5 text-muted-foreground"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (
            open ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="inline-block w-[14px]" />
          )}
        </Button>
        {open ? (
          <FolderOpen size={15} className="shrink-0" />
        ) : (
          <FolderIcon size={15} className="shrink-0" />
        )}
        <span className="truncate flex-1 ml-1">{node.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              onClick={(e) => e.stopPropagation()}
              variant="ghost"
              size="icon"
              className="rounded opacity-0 group-hover:opacity-100"
              aria-label="Folder actions"
            >
              <MoreVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAddChild(node)}>
              <Plus size={14} className="mr-2" />
              {t('classroom.docs.new_subfolder', 'Thêm thư mục con')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename(node)}>
              <Edit2 size={14} className="mr-2" />
              {t('classroom.docs.rename', 'Đổi tên')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-rose-600 focus:text-rose-600"
              onClick={() => onDelete(node)}
            >
              <Trash2 size={14} className="mr-2" />
              {t('classroom.docs.delete', 'Xóa')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map((c) => (
            <NodeRow
              key={c.uid}
              node={c}
              depth={depth + 1}
              selected={selected && c.uid === node.uid ? true : false}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onAddChild={onAddChild}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocsTreeSidebar({
  tree,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  totalRootDocs,
  t,
}: Props) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-2 flex flex-col gap-1 w-full lg:w-64 shrink-0">
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {t('classroom.docs.folders_title', 'Thư mục')}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => onCreateFolder(null)}
        >
          <Plus size={13} className="mr-1" /> {t('classroom.docs.new_folder', 'Mới')}
        </Button>
      </div>
      <div
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${
          selectedFolderId === null ? 'bg-primary-brand-light text-primary-brand font-semibold' : 'text-muted-foreground'
        }`}
        data-active={selectedFolderId === null}
        onClick={() => onSelectFolder(null)}
      >
        <Home size={15} className="shrink-0" />
        <span className="truncate flex-1 ml-1">
          {t('classroom.docs.root_label', 'Tất cả tài liệu')}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded px-1.5 py-0.5">
          {totalRootDocs}
        </span>
      </div>
      {tree.map((node) => (
        <NodeRow
          key={node.uid}
          node={node}
          depth={0}
          selected={selectedFolderId === node.uid}
          onSelect={onSelectFolder}
          onRename={onRenameFolder}
          onDelete={onDeleteFolder}
          onAddChild={(f) => onCreateFolder(f.uid)}
          t={t}
        />
      ))}
    </div>
  );
}
