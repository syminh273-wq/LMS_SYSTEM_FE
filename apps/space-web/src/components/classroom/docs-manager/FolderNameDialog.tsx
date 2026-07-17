'use client';

import * as React from 'react';
import { useState } from 'react';
import { FolderPlus, Edit2 } from 'lucide-react';
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  mode: 'create' | 'rename';
  onSubmit: (name: string) => Promise<void>;
  t: (key: string, fallback?: string) => string;
};

type BodyProps = Omit<Props, 'open' | 'onOpenChange'> & { onCancel: () => void };

function DialogBody({ initialName, mode, onSubmit, onCancel, t }: BodyProps) {
  const [name, setName] = useState(initialName ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim());
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

export function FolderNameDialog({ open, onOpenChange, initialName, mode, onSubmit, t }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && (
          <DialogBody
            key={`${mode}-${initialName ?? ''}-${open}`}
            initialName={initialName}
            mode={mode}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            t={t}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
