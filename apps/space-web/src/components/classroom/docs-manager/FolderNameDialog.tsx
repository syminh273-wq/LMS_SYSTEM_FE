'use client';

import * as React from 'react';
import { useState } from 'react';
import { FolderPlus, Edit2, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import type { ClassroomFolder } from './types';

type SubmitPayload = { name: string; parentFolderId: string | null; isPreviewOnly: boolean };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  mode: 'create' | 'rename';
  onSubmit: (payload: SubmitPayload) => Promise<void>;
  parentFolders?: ClassroomFolder[];
  initialParentId?: string | null;
  initialIsPreviewOnly?: boolean;
  disablePreviewOption?: boolean;
  t: (key: string, fallback?: string) => string;
};

type BodyProps = Omit<Props, 'open' | 'onOpenChange'> & { onCancel: () => void };

function buildParentOptions(folders: ClassroomFolder[]): ClassroomFolder[] {
  return [...folders].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.name.localeCompare(b.name),
  );
}

function DialogBody({
  initialName,
  mode,
  onSubmit,
  onCancel,
  parentFolders,
  initialParentId,
  initialIsPreviewOnly,
  disablePreviewOption,
  t,
}: BodyProps) {
  const [name, setName] = useState(initialName ?? '');
  const [parentId, setParentId] = useState<string | null>(initialParentId ?? null);
  const [isPreviewOnly, setIsPreviewOnly] = useState<boolean>(!!initialIsPreviewOnly);
  const [submitting, setSubmitting] = useState(false);

  const showParentPicker = mode === 'create';
  const parentOptions = showParentPicker ? buildParentOptions(parentFolders ?? []) : [];

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        parentFolderId: showParentPicker ? parentId : null,
        isPreviewOnly,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {mode === 'create'
            ? t('classroom.docs.create_folder_title', 'Tạo thư mục mới')
            : t('classroom.docs.rename_folder_title', 'Đổi tên thư mục')}
        </DialogTitle>
        <DialogDescription>
          {t('classroom.docs.folder_name_desc', 'Nhập tên thư mục.')}
        </DialogDescription>
      </DialogHeader>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('classroom.docs.folder_name_placeholder', 'Tên thư mục')}
        className="mt-2"
        autoFocus
      />
      {showParentPicker && (
        <div className="mt-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {t('classroom.docs.parent_folder_label', 'Thư mục cha')}
          </Label>
          <Select
            value={parentId ?? 'root'}
            onValueChange={(v) => setParentId(v === 'root' ? null : v)}
          >
            <SelectTrigger className="mt-1 w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2">
              <SelectValue placeholder={t('classroom.docs.root_option', 'Gốc (không có thư mục cha)')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">{t('classroom.docs.root_option', 'Gốc (không có thư mục cha)')}</SelectItem>
              {parentOptions.map((f) => (
                <SelectItem key={f.uid} value={f.uid}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Label className="mt-4 flex items-start gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isPreviewOnly}
          disabled={!!disablePreviewOption && !isPreviewOnly}
          onChange={(e) => setIsPreviewOnly(e.target.checked)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <div className="text-xs font-bold text-foreground flex items-center gap-1">
            <Eye size={12} className="text-primary-brand" />
            {t('classroom.docs.preview_folder_label', 'Đặt làm Preview folder (mặc định cho mọi người xem)')}
          </div>
          {!!disablePreviewOption && !isPreviewOnly && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {t('classroom.docs.preview_folder_already_set', 'Lớp học này đã có Preview folder.')}
            </div>
          )}
        </div>
      </Label>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          {t('classroom.docs.cancel', 'Huỷ')}
        </Button>
        <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
          {mode === 'create' ? <FolderPlus size={14} className="mr-1" /> : <Edit2 size={14} className="mr-1" />}
          {mode === 'create' ? t('classroom.docs.create_btn', 'Tạo') : t('classroom.docs.save_btn', 'Lưu')}
        </Button>
      </DialogFooter>
    </>
  );
}

export function FolderNameDialog({
  open,
  onOpenChange,
  initialName,
  mode,
  onSubmit,
  parentFolders,
  initialParentId,
  initialIsPreviewOnly,
  disablePreviewOption,
  t,
}: Props) {
  const isCreate = mode === 'create';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && (
          <DialogBody
            key={`${mode}-${initialName ?? ''}-${initialParentId ?? 'root'}-${open}-${initialIsPreviewOnly ?? false}`}
            initialName={initialName}
            mode={mode}
            onSubmit={onSubmit}
            parentFolders={isCreate ? parentFolders : undefined}
            initialParentId={isCreate ? initialParentId : null}
            initialIsPreviewOnly={initialIsPreviewOnly}
            disablePreviewOption={disablePreviewOption}
            onCancel={() => onOpenChange(false)}
            t={t}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
