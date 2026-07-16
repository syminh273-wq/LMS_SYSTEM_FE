'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';

interface Props {
  value: string;
  onChange: (url: string) => void;
  maxSizeMB?: number;
  className?: string;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

export function ImageUploader({ value, onChange, maxSizeMB = 4, className = '' }: Props) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t('imageUploader.invalid_type'));
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(t('imageUploader.too_large', undefined, { size: maxSizeMB }));
      return;
    }

    setUploading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('owner_type', 'certificate');

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiBase}/api/v1/resource/upload/`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((err.message as string) || (err.detail as string) || t('imageUploader.upload_failed'));
      }
      const data = await res.json() as { url: string; uid: string; name: string };
      onChange(data.url);
      toast.success(t('imageUploader.upload_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('imageUploader.upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  const onPick = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void upload(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  };

  const clear = () => onChange('');

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={onFileChange}
      />

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="template" className="w-full h-40 object-contain bg-white" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
            title={t('imageUploader.remove')}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={`w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
            dragOver
              ? 'border-primary-brand bg-primary-brand/5'
              : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-primary-brand/50'
          } ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {uploading ? (
            <>
              <Loader2 size={28} className="animate-spin text-primary-brand" />
              <p className="text-xs font-bold text-muted-foreground">{t('imageUploader.uploading')}</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary-brand/10 flex items-center justify-center text-primary-brand">
                <Upload size={18} />
              </div>
              <p className="text-xs font-bold text-foreground">{t('imageUploader.drop_or_click')}</p>
              <p className="text-[10px] text-muted-foreground">{t('imageUploader.formats', undefined, { size: maxSizeMB })}</p>
            </>
          )}
        </button>
      )}

      {value && (
        <button
          type="button"
          onClick={onPick}
          disabled={uploading}
          className="mt-2 w-full text-xs font-bold text-primary-brand hover:underline disabled:opacity-50"
        >
          {t('imageUploader.replace')}
        </button>
      )}
    </div>
  );
}
