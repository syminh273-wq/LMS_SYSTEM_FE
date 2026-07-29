'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FolderPlus, Edit2, Eye } from 'lucide-react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import { Checkbox } from '@shared/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import type { ClassroomFolder } from './types';

const NO_PARENT_VALUE = '__root__';

const folderSchema = z.object({
  name: z.string().min(1, 'Tên thư mục không được để trống'),
  parentId: z.string().nullable(),
  isPreviewOnly: z.boolean(),
});

type FolderFormValues = z.infer<typeof folderSchema>;

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
  const showParentPicker = mode === 'create';
  const parentOptions = showParentPicker ? buildParentOptions(parentFolders ?? []) : [];

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: initialName ?? '',
      parentId: initialParentId ?? null,
      isPreviewOnly: !!initialIsPreviewOnly,
    },
  });

  useEffect(() => {
    form.reset({
      name: initialName ?? '',
      parentId: initialParentId ?? null,
      isPreviewOnly: !!initialIsPreviewOnly,
    });
  }, [initialName, initialParentId, initialIsPreviewOnly, form]);

  const isPreviewOnly = form.watch('isPreviewOnly');

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      parentFolderId: showParentPicker ? values.parentId : null,
      isPreviewOnly: values.isPreviewOnly,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('classroom.docs.folder_name_label', 'Tên thư mục')}</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  placeholder={t('classroom.docs.folder_name_placeholder', 'Tên thư mục')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showParentPicker && (
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('classroom.docs.parent_folder_label', 'Thư mục cha')}</FormLabel>
                <Select
                  value={field.value ?? NO_PARENT_VALUE}
                  onValueChange={(v) => field.onChange(v === NO_PARENT_VALUE ? null : v)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('classroom.docs.root_option', 'Gốc (không có thư mục cha)')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_PARENT_VALUE}>
                      {t('classroom.docs.root_option', 'Gốc (không có thư mục cha)')}
                    </SelectItem>
                    {parentOptions.map((f) => (
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
        )}

        <FormField
          control={form.control}
          name="isPreviewOnly"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-start gap-2 cursor-pointer select-none font-normal">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={!!disablePreviewOption && !isPreviewOnly}
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                    className="mt-0.5"
                  />
                </FormControl>
                <div className="flex-1">
                  <div className="text-xs font-bold flex items-center gap-1">
                    <Eye size={12} className="text-primary" />
                    {t('classroom.docs.preview_folder_label', 'Đặt làm Preview folder (mặc định cho mọi người xem)')}
                  </div>
                  {!!disablePreviewOption && !isPreviewOnly && (
                    <FormDescription>
                      {t('classroom.docs.preview_folder_already_set', 'Lớp học này đã có Preview folder.')}
                    </FormDescription>
                  )}
                </div>
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('classroom.docs.cancel', 'Huỷ')}
          </Button>
          <Button type="submit">
            {mode === 'create' ? <FolderPlus size={14} className="mr-1.5" /> : <Edit2 size={14} className="mr-1.5" />}
            {mode === 'create' ? t('classroom.docs.create_btn', 'Tạo') : t('classroom.docs.save_btn', 'Lưu')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
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
      <DialogContent className="sm:max-w-md">
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
