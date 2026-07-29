'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Trash2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { isImageFile, isPdfFile, isVideoFile, isAudioFile } from './doc-utils';
import type { ClassroomDoc } from './types';

type Props = {
  doc: ClassroomDoc | null;
  open: boolean;
  onClose: () => void;
  t: (key: string, fallback?: string) => string;
  canManage?: boolean;
  onDelete?: (doc: ClassroomDoc) => void;
};

export function DocPreviewModal({ doc, open, onClose, t, canManage = false, onDelete }: Props) {
  const [mounted] = useState(() => typeof document !== 'undefined');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted || !open || !doc) return null;

  const ft = (doc.file_type || '').toLowerCase();
  const image = isImageFile(doc.file_type);
  const video = isVideoFile(doc.file_type);
  const audio = isAudioFile(doc.file_type);
  const pdf = isPdfFile(doc.file_type);

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
          <p className="text-sm font-bold text-slate-900 truncate flex-1 min-w-0" title={doc.name}>
            {doc.name}
          </p>
          {canManage && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDelete(doc)}
              className="rounded-md hover:bg-rose-50 text-slate-500 hover:text-rose-600"
              title={t('classroom.docs.delete', 'Xóa')}
            >
              <Trash2 size={14} />
            </Button>
          )}
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 rounded-md hover:bg-slate-200 text-slate-600"
            title={t('classroom.docs.download', 'Tải xuống')}
          >
            <Download size={14} />
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-md hover:bg-slate-200 text-slate-600"
            title={t('classroom.docs.close', 'Đóng')}
          >
            <X size={16} />
          </Button>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-100 p-4 overflow-auto">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.url}
              alt={doc.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow"
            />
          ) : video ? (
            <video
              src={doc.url}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg shadow bg-black"
            />
          ) : audio ? (
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow">
              <p className="text-sm font-bold text-slate-900 mb-4 truncate" title={doc.name}>
                {doc.name}
              </p>
              <audio src={doc.url} controls autoPlay className="w-full" />
            </div>
          ) : pdf ? (
            <iframe
              src={doc.url}
              title={doc.name}
              className="w-full h-full rounded-lg shadow bg-white"
            />
          ) : (
            <div className="text-center text-slate-500">
              <p className="text-sm font-medium mb-2">
                {t('classroom.docs.preview_unsupported', 'Không hỗ trợ xem trước cho định dạng này.')}
              </p>
              {ft && <p className="text-xs uppercase">{ft}</p>}
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3"
              >
                <Button size="sm">
                  <Download size={13} className="mr-1" />
                  {t('classroom.docs.open_or_download', 'Mở / Tải xuống')}
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
