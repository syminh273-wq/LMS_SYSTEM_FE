'use client';

import { useState, useRef } from 'react';
import { Button } from '@shared/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';

interface Props {
  value: string;
  file: File | null;
  onChange: (value: string, file: File | null) => void;
  onClear?: () => void;
  maxSizeMB?: number;
  className?: string;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

export function ImageUploader({ value, file, onChange, onClear, maxSizeMB = 4, className = '' }: Props) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const applyFile = (f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error(t('imageUploader.invalid_type'));
      return;
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      toast.error(t('imageUploader.too_large', undefined, { size: maxSizeMB }));
      return;
    }
    const objectUrl = URL.createObjectURL(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(objectUrl);
    onChange('', f);
  };

  const onPick = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  };

  const clear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onChange('', null);
    onClear?.();
  };

  const displayedUrl = previewUrl ?? value;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={onFileChange}
      />

      {displayedUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayedUrl} alt="template" className="w-full h-40 object-contain bg-white" />
          {file && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase">
              {t('imageUploader.new_file')}
            </span>
          )}
          <Button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
            title={t('imageUploader.remove')}
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <Button
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
        </Button>
      )}

      {displayedUrl && (
        <Button
          type="button"
          onClick={onPick}
          disabled={uploading}
          className="mt-2 w-full text-xs font-bold text-primary-brand hover:underline disabled:opacity-50"
        >
          {t('imageUploader.replace')}
        </Button>
      )}
    </div>
  );
}
