'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import type { ClassroomFolder } from './types';

const NO_PARENT_VALUE = '__root__';

const uploadSchema = z.object({
  section: z.string(),
  folderId: z.string().nullable(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { file: File; section: string; folderId: string | null }) => Promise<void>;
  parentFolders: ClassroomFolder[];
  currentFolderId: string | null;
  t: (key: string, fallback?: string) => string;
};

type BodyProps = Omit<Props, 'open' | 'onOpenChange'> & { onCancel: () => void };

function DialogBody({
  parentFolders,
  currentFolderId,
  onSubmit,
  onCancel,
  t,
}: BodyProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      section: '',
      folderId: currentFolderId,
    },
  });

  useEffect(() => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!file) return;
    await onSubmit({ file, section: values.section, folderId: values.folderId });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem>
          <FormLabel>{t('classroom.docs.file_label', 'File')}</FormLabel>
          <FormControl>
            <Input
              ref={fileInputRef}
              type="file"
              className="cursor-pointer"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
              }}
            />
          </FormControl>
          {file && (
            <p className="text-xs text-muted-foreground">
              {file.name} — {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
          <FormMessage />
        </FormItem>

        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('classroom.docs.section_label', 'Mục (tuỳ chọn)')}</FormLabel>
              <FormControl>
                <Input placeholder="lecture, week1, ..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="folderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('classroom.docs.folder_label', 'Thư mục đích')}</FormLabel>
              <Select
                value={field.value ?? NO_PARENT_VALUE}
                onValueChange={(v) => field.onChange(v === NO_PARENT_VALUE ? null : v)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('classroom.docs.root_option', 'Gốc (không thư mục)')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_PARENT_VALUE}>
                    {t('classroom.docs.root_option', 'Gốc (không thư mục)')}
                  </SelectItem>
                  {parentFolders.map((f) => (
                    <SelectItem key={f.uid} value={f.uid}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('classroom.docs.cancel', 'Huỷ')}
          </Button>
          <Button type="submit" disabled={!file}>
            <Upload size={14} className="mr-1.5" />
            {t('classroom.docs.upload_btn', 'Tải lên')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
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
        <DialogHeader>
          <DialogTitle>{t('classroom.docs.upload_title', 'Tải lên tài liệu')}</DialogTitle>
          <DialogDescription>
            {t('classroom.docs.upload_desc', 'Chọn file và (tuỳ chọn) mục đích.')}
          </DialogDescription>
        </DialogHeader>
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
