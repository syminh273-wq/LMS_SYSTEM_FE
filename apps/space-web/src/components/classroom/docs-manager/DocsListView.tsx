'use client';

import * as React from 'react';
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
  canManage,
}: {
  doc: ClassroomDoc;
  onDelete: (uid: string) => void;
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
      className="grid grid-cols-[24px_36px_1fr_120px_100px_120px_100px] items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition group"
    >
      {canManage ? (
        <button
          type="button"
          className="cursor-grab text-slate-300 hover:text-slate-600 touch-none"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
      ) : (
        <span />
      )}
      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
        {React.createElement(Icon, { size: 18 })}
      </div>
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-bold text-slate-800 hover:text-indigo-600 truncate"
        title={doc.name}
      >
        {doc.name}
      </a>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 w-fit">
        {doc.file_type || 'file'}
      </span>
      <span className="text-xs text-slate-500">{formatSize(doc.size)}</span>
      <span className="text-xs text-slate-500">
        {doc.created_at
          ? new Date(doc.created_at).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : ''}
      </span>
      <div className="flex items-center justify-end gap-1">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md hover:bg-indigo-50 text-slate-500 hover:text-indigo-600"
          title="Mở"
        >
          <Download size={14} />
        </a>
        {canManage && (
          <button
            type="button"
            onClick={() => onDelete(doc.uid)}
            className="p-1.5 rounded-md hover:bg-rose-50 text-slate-500 hover:text-rose-600"
            title="Xóa"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

type Props = {
  docs: ClassroomDoc[];
  canManage: boolean;
  onReorder: (orderedUids: string[]) => void;
  onDelete: (uid: string) => void;
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
    <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('classroom.docs.search_placeholder', 'Tìm tài liệu...')}
          className="max-w-xs h-9 text-xs"
        />
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown size={14} className="text-slate-400" />
          {SORT_FIELDS.map((s) => (
            <button
              key={s.field}
              type="button"
              onClick={() => onSortChange(s.field)}
              className={`text-xs font-bold px-2 py-1 rounded ${
                sortField === s.field
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {s.label}
              {sortField === s.field && (
                <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
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
                <SortableRow key={d.uid} doc={d} onDelete={onDelete} canManage={canManage} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
