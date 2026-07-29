'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { file: File; section: string; folderId: string | null }) => Promise<void>;
  parentFolders: ClassroomFolder[];
  currentFolderId: string | null;
  t: (key: string, fallback?: string) => string;
};

function DialogBody({
  parentFolders,
  currentFolderId,
  onSubmit,
  onCancel,
  t,
}: {
  parentFolders: ClassroomFolder[];
  currentFolderId: string | null;
  onSubmit: (payload: { file: File; section: string; folderId: string | null }) => Promise<void>;
  onCancel: () => void;
  t: (key: string, fallback?: string) => string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [section, setSection] = useState('');
  const [folderId, setFolderId] = useState<string | null>(currentFolderId);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      await onSubmit({ file, section, folderId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('classroom.docs.upload_title', 'Tải lên tài liệu')}</DialogTitle>
        <DialogDescription>
          {t('classroom.docs.upload_desc', 'Chọn file và (tuỳ chọn) mục đích.')}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t('classroom.docs.file_label', 'File')}
          </Label>
          <input
            ref={inputRef}
            type="file"
            className="block w-full mt-1 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-accent file:text-accent-foreground file:font-bold"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <p className="mt-1 text-xs text-muted-foreground">
              {file.name} — {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t('classroom.docs.section_label', 'Mục (tuỳ chọn)')}
          </Label>
          <Input
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="lecture, week1, ..."
            className="mt-1 h-9 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t('classroom.docs.folder_label', 'Thư mục đích')}
          </Label>
          <Select
            value={folderId ?? 'root'}
            onValueChange={(v) => setFolderId(v === 'root' ? null : v)}
          >
            <SelectTrigger className="mt-1 w-full h-9 text-xs rounded-md border border-border bg-card px-2">
              <SelectValue placeholder={t('classroom.docs.root_option', 'Gốc (không thư mục)')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">{t('classroom.docs.root_option', 'Gốc (không thư mục)')}</SelectItem>
              {parentFolders.map((f) => (
                <SelectItem key={f.uid} value={f.uid}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          {t('classroom.docs.cancel', 'Huỷ')}
        </Button>
        <Button onClick={handleSubmit} disabled={!file || submitting}>
          {submitting ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Upload size={14} className="mr-1" />}
          {t('classroom.docs.upload_btn', 'Tải lên')}
        </Button>
      </DialogFooter>
    </>
  );
}

export function UploadToFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  parentFolders,
  currentFolderId,
  t,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <DialogBody
            key={`${open}-${currentFolderId ?? 'root'}`}
            parentFolders={parentFolders}
            currentFolderId={currentFolderId}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            t={t}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
