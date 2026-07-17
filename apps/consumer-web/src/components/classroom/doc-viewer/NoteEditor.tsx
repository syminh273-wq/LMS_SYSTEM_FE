'use client';

import * as React from 'react';
import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import type { DocNote } from './types';
import { NOTE_COLORS } from './utils';

type Mode = 'create' | 'edit';

type Props = {
  mode: Mode;
  initialContent?: string;
  initialProgressAt?: number;
  initialColor?: string;
  existingNote?: DocNote;
  onSubmit: (data: { content: string; progress_at: number; color: string }) => void;
  onDelete?: () => void;
  onCancel: () => void;
};

export function NoteEditor({
  mode,
  initialContent = '',
  initialProgressAt = 0,
  initialColor = 'yellow',
  existingNote,
  onSubmit,
  onDelete,
  onCancel,
}: Props) {
  const [content, setContent] = useState(initialContent);
  const [progressAt, setProgressAt] = useState(initialProgressAt);
  const [color, setColor] = useState(initialColor);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit({ content: trimmed, progress_at: progressAt, color });
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 w-72 space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {mode === 'create' ? 'Take Note' : 'Edit Note'}
        </span>
        {existingNote && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded hover:bg-rose-50 text-rose-500"
            title="Xóa"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Ghi chú tại đây..."
        className="h-8 text-xs"
        autoFocus
      />
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
          <span>Đã đọc tới</span>
          <span className="text-indigo-600 font-black">{Math.round(progressAt * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(progressAt * 100)}
          onChange={(e) => setProgressAt(Number(e.target.value) / 100)}
          className="w-full h-1 accent-indigo-600"
        />
      </div>
      <div className="flex items-center gap-1">
        {Object.entries(NOTE_COLORS).map(([key, cls]) => (
          <button
            key={key}
            type="button"
            onClick={() => setColor(key)}
            className={`w-5 h-5 rounded-full border-2 transition ${
              color === key ? 'border-slate-900 scale-110' : 'border-transparent'
            } ${cls}`}
            aria-label={key}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 justify-end pt-1">
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>
          Huỷ
        </Button>
        <Button
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={handleSubmit}
          disabled={!content.trim()}
        >
          <Check size={12} className="mr-1" />
          {mode === 'create' ? 'Lưu' : 'Cập nhật'}
        </Button>
      </div>
    </div>
  );
}
