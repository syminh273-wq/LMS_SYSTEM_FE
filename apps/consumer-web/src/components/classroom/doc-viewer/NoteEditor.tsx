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
  initialColor?: string;
  positionHint?: { x_pct: number; y_pct: number; page?: number | null };
  existingNote?: DocNote;
  onSubmit: (data: { content: string; color: string }) => void;
  onDelete?: () => void;
  onCancel: () => void;
};

export function NoteEditor({
  mode,
  initialContent = '',
  initialColor = 'yellow',
  positionHint,
  existingNote,
  onSubmit,
  onDelete,
  onCancel,
}: Props) {
  const [content, setContent] = useState(initialContent);
  const [color, setColor] = useState(initialColor);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit({ content: trimmed, color });
  };

  return (
    <div
      className="bg-popover rounded-2xl shadow-2xl border border-border p-3 w-72 space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {mode === 'create' ? 'Take Note' : 'Edit Note'}
        </span>
        {existingNote && onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive"
            title="Xóa"
          >
            <Trash2 size={13} />
          </Button>
        )}
      </div>
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Ghi chú tại đây..."
        className="h-8"
        autoFocus
      />
      {positionHint && (
        <p className="text-[10px] text-muted-foreground font-medium">
          Vị trí: x={Math.round(positionHint.x_pct * 100)}% · y=
          {Math.round(positionHint.y_pct * 100)}%
          {positionHint.page != null ? ` · trang ${positionHint.page}` : ''}
        </p>
      )}
      <div className="flex items-center gap-1">
        {Object.entries(NOTE_COLORS).map(([key, cls]) => (
          <Button
            key={key}
            type="button"
            onClick={() => setColor(key)}
            className={`w-5 h-5 rounded-full border-2 ${
              color === key ? 'border-foreground scale-110' : 'border-transparent'
            } ${cls}`}
            aria-label={key}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 justify-end pt-1">
        <Button size="sm" variant="ghost" className="h-7" onClick={onCancel}>
          Huỷ
        </Button>
        <Button
          size="sm"
          className="h-7"
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
