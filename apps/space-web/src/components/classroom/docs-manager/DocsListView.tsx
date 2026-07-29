'use client';

import * as React from 'react';
import { Button } from '@shared/components/ui/button';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  File as FileIcon,
  Download,
  Trash2,
  GripVertical,
  ArrowUpDown,
  Users,
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@shared/components/ui/input';
import type { ClassroomDoc, SortField, SortDir } from './types';
import { sortDocs } from './api';

const ICON_BY_TYPE: Record<string, typeof FileText> = {
  pdf: FileText, doc: FileText, docx: FileText, txt: FileText, md: FileText,
  jpg: FileImage, jpeg: FileImage, png: FileImage, gif: FileImage, webp: FileImage, svg: FileImage, bmp: FileImage,
  mp4: FileVideo, mov: FileVideo, avi: FileVideo, mkv: FileVideo, webm: FileVideo,
  mp3: FileAudio, wav: FileAudio, ogg: FileAudio, m4a: FileAudio,
  zip: FileArchive, rar: FileArchive, '7z': FileArchive, tar: FileArchive, gz: FileArchive,
  xls: FileSpreadsheet, xlsx: FileSpreadsheet, csv: FileSpreadsheet,
};

function pickIcon(fileType?: string) {
  const t = (fileType || '').toLowerCase();
  return ICON_BY_TYPE[t] ?? FileIcon;
}

function formatSize(bytes?: number) {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function SortableRow({
  doc,
  onDelete,
  onShowProgress,
  onOpenPreview,
  canManage,
}: {
  doc: ClassroomDoc;
  onDelete: (doc: ClassroomDoc) => void;
  onShowProgress: (doc: ClassroomDoc) => void;
  onOpenPreview: (doc: ClassroomDoc) => void;
  canManage: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: doc.uid,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const Icon = pickIcon(doc.file_type);
  return (
    <div
      ref={setNodeRef}
      style={style}
      onDoubleClick={() => onOpenPreview(doc)}
      className="grid grid-cols-[24px_36px_minmax(0,1fr)_120px_100px_120px_100px] items-center gap-3 px-3 py-2 rounded-xl border border-border bg-card hover:border-primary/30 group min-w-0"
    >
      {canManage ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="cursor-grab text-muted-foreground/50 touch-none"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </Button>
      ) : (
        <span />
      )}
      <div className="w-9 h-9 rounded-lg bg-accent text-primary flex items-center justify-center">
        {React.createElement(Icon, { size: 18 })}
      </div>
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-bold text-foreground truncate min-w-0"
        title={doc.name}
      >
        {doc.name}
      </a>
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted rounded px-1.5 py-0.5 w-fit">
        {doc.file_type || 'file'}
      </span>
      <span className="text-xs text-muted-foreground">{formatSize(doc.size)}</span>
      <span className="text-xs text-muted-foreground">
        {doc.created_at
          ? new Date(doc.created_at).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : ''}
      </span>
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onShowProgress(doc)}
          className="rounded-md text-muted-foreground hover:!text-foreground"
          title="Xem tiến độ học sinh"
        >
          <Users size={14} />
        </Button>
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground"
          title="Mở"
        >
          <Download size={14} />
        </a>
        {canManage && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(doc)}
            className="rounded-md text-muted-foreground hover:!text-rose-600"
            title="Xóa"
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}

type Props = {
  docs: ClassroomDoc[];
  canManage: boolean;
  onReorder: (orderedUids: string[]) => void;
  onDelete: (doc: ClassroomDoc) => void;
  onShowProgress: (doc: ClassroomDoc) => void;
  onOpenPreview: (doc: ClassroomDoc) => void;
  search: string;
  onSearchChange: (s: string) => void;
  sortField: SortField;
  sortDir: SortDir;
  onSortChange: (field: SortField) => void;
  t: (key: string, fallback?: string) => string;
};

const SORT_FIELDS: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Tên' },
  { field: 'created_at', label: 'Ngày tải' },
  { field: 'size', label: 'Dung lượng' },
  { field: 'file_type', label: 'Loại' },
];

export function DocsListView({
  docs,
  canManage,
  onReorder,
  onDelete,
  onShowProgress,
  onOpenPreview,
  search,
  onSearchChange,
  sortField,
  sortDir,
  onSortChange,
  t,
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q ? docs.filter((d) => d.name.toLowerCase().includes(q)) : docs;
    return sortDocs(base, sortField, sortDir);
  }, [docs, search, sortField, sortDir]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filtered.findIndex((d) => d.uid === active.id);
    const newIndex = filtered.findIndex((d) => d.uid === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(filtered, oldIndex, newIndex);
    onReorder(reordered.map((d) => d.uid));
  };

  return (
    <div className="flex-1 min-w-0 bg-card rounded-2xl border border-border shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('classroom.docs.search_placeholder', 'Tìm tài liệu...')}
          className="max-w-xs h-9 text-xs"
        />
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown size={14} className="text-muted-foreground" />
          {SORT_FIELDS.map((s) => (
            <Button
              key={s.field}
              type="button"
              variant="ghost"
              onClick={() => onSortChange(s.field)}
              data-active={sortField === s.field}
              className="text-xs font-bold px-2 py-1 rounded text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
            >
              {s.label}
              {sortField === s.field && (
                <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">
            {docs.length === 0
              ? t('classroom.docs.empty', 'Chưa có tài liệu nào trong mục này.')
              : t('classroom.docs.no_match', 'Không có kết quả phù hợp.')}
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={filtered.map((d) => d.uid)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {filtered.map((d) => (
                <SortableRow
                  key={d.uid}
                  doc={d}
                  onDelete={onDelete}
                  onShowProgress={onShowProgress}
                  onOpenPreview={onOpenPreview}
                  canManage={canManage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
