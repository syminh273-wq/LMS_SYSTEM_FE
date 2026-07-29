'use client';

import { useRef, useState } from 'react';
import { FileText, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { portfolioApi, type PortfolioEntry } from '@/lib/api/portfolio';
import { PdfThumbnail } from './PdfThumbnail';
import { toast } from 'sonner';

type Props = {
  initial?: PortfolioEntry;
  onClose: () => void;
  onSaved: (entry: PortfolioEntry) => void;
};

type FormState = {
  title: string;
  description: string;
  url: string;
  image: string;
};

const inputCls = 'w-full';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ACCEPTED_TYPES: Record<string, { ext: string[]; isImage: boolean }> = {
  'image/jpeg': { ext: ['jpg', 'jpeg'], isImage: true },
  'image/png': { ext: ['png'], isImage: true },
  'image/webp': { ext: ['webp'], isImage: true },
  'image/gif': { ext: ['gif'], isImage: true },
  'application/pdf': { ext: ['pdf'], isImage: false },
};

const ACCEPTED_MIME_LIST = Object.keys(ACCEPTED_TYPES);
const ACCEPTED_EXT_LIST = Object.values(ACCEPTED_TYPES).flatMap((t) => t.ext);
const ACCEPT_ATTR = [...ACCEPTED_MIME_LIST, ...ACCEPTED_EXT_LIST.map((e) => `.${e}`)].join(',');

const PREVIEWABLE_TYPES = new Set(Object.entries(ACCEPTED_TYPES).filter(([, v]) => v.isImage).map(([k]) => k));

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES[file.type]) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && ACCEPTED_EXT_LIST.includes(ext)) return true;
  return false;
}

export function FeatureEditDialog({ initial, onClose, onSaved }: Props) {
  const v = (initial?.value ?? {}) as Partial<FormState> & { file_name?: string; file_type?: string };
  const isImagePreview = !!v.image && !!v.file_type && PREVIEWABLE_TYPES.has(v.file_type);
  const [form, setForm] = useState<FormState>({
    title: v.title ?? '',
    description: v.description ?? '',
    url: v.url ?? '',
    image: v.image ?? '',
  });
  const [existingFileMeta, setExistingFileMeta] = useState<{ name: string; type: string } | null>(
    v.file_name && v.file_type ? { name: v.file_name, type: v.file_type } : null,
  );
  const [saving, setSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasLink = /^https?:\/\//i.test(form.url.trim());
  const hasImage = form.image.trim().length > 0;
  const isValid = form.title.trim().length > 0 && (hasLink || hasImage);

  const handlePickFile = (file: File) => {
    if (!isAcceptedFile(file)) {
      toast.error('Chỉ chấp nhận ảnh (JPG, PNG, WebP, GIF) hoặc PDF');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('File tối đa 10MB');
      return;
    }
    if (form.image.startsWith('blob:')) URL.revokeObjectURL(form.image);
    setPendingFile(file);
    setForm((f) => ({ ...f, image: URL.createObjectURL(file) }));
    setExistingFileMeta(null);
  };

  const clearImage = () => {
    if (form.image.startsWith('blob:')) URL.revokeObjectURL(form.image);
    setForm((f) => ({ ...f, image: '' }));
    setPendingFile(null);
    setExistingFileMeta(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error('Cần tiêu đề và ít nhất 1 trong 2: link hoặc file');
      return;
    }
    setSaving(true);
    try {
      const value: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        url: hasLink ? form.url.trim() : null,
        image: hasImage && !pendingFile ? form.image.trim() : null,
      };

      const entry = pendingFile
        ? await portfolioApi.upsertEntryWithImage(initial?.uid ?? null, {
            key: 'achievement',
            value,
            file: pendingFile,
            image_field: 'image',
            is_public: true,
          })
        : await portfolioApi.upsertEntry(initial?.uid ?? null, {
            key: 'achievement',
            value,
            is_public: true,
          });

      toast.success('Đã lưu feature');
      onSaved(entry);
    } catch {
      toast.error('Không thể lưu feature');
    } finally {
      setSaving(false);
    }
  };

  const showImagePreview = hasImage && (pendingFile ? PREVIEWABLE_TYPES.has(pendingFile.type) : isImagePreview);
  const fileName = pendingFile?.name ?? existingFileMeta?.name;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle>
            {initial ? 'Chỉnh sửa feature' : 'Thêm feature'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-3">
          <div>
            <Label className="mb-1 block">Tiêu đề</Label>
            <Input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="VD. CV của tôi"
              className={inputCls}
              maxLength={80}
            />
          </div>

          <div>
            <Label className="mb-1 block">
              Mô tả <span className="text-muted-foreground font-normal">(tuỳ chọn)</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả ngắn..."
              className={`${inputCls} resize-none`}
              rows={2}
              maxLength={240}
            />
          </div>

          <div>
            <Label className="mb-1 block">
              Link <span className="text-muted-foreground font-normal">(tuỳ chọn)</span>
            </Label>
            <Input
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              className={inputCls}
            />
          </div>

          <div>
            <Label className="mb-1 block">
              File <span className="text-muted-foreground font-normal">(tuỳ chọn, ảnh/PDF ≤ 10MB, sẽ upload cùng lúc khi lưu)</span>
            </Label>
            <Input
              ref={fileRef}
              type="file"
              accept={ACCEPT_ATTR}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePickFile(f);
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={saving}
                className="h-9"
              >
                <Upload className="size-3.5" />
                {form.image ? 'Đổi file' : 'Upload ảnh/PDF'}
              </Button>
              {form.image && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearImage}
                  disabled={saving}
                  className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
                  title="Xoá file"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            {form.image ? (
              <div className="mt-2 relative aspect-[16/9] w-full overflow-hidden rounded-md border border-border bg-muted">
                {showImagePreview ? (
                  <img
                    src={form.image}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
                    }}
                  />
                ) : pendingFile && pendingFile.type === 'application/pdf' ? (
                  <embed
                    src={form.image}
                    type="application/pdf"
                    className="w-full h-full"
                  />
                ) : existingFileMeta?.type === 'application/pdf' && form.image ? (
                  <PdfThumbnail url={form.image} title={form.title} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1">
                    <FileText className="size-10 text-muted-foreground" />
                    <p className="text-xs font-semibold truncate max-w-[90%]">{fileName}</p>
                    <a
                      href={form.image}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-primary-brand hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Mở file
                    </a>
                  </div>
                )}
                {pendingFile && showImagePreview && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700 border border-amber-200">
                    Chưa upload
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-2 aspect-[16/9] w-full rounded-md border border-dashed border-border bg-muted flex items-center justify-center text-muted-foreground">
                <ImageIcon className="size-10" />
              </div>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground pt-1">
            Cần ít nhất <strong>tiêu đề</strong> và <strong>link</strong> hoặc <strong>file</strong>.
          </p>
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isValid || saving}
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {initial ? 'Lưu' : 'Thêm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
