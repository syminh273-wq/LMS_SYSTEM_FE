import * as React from 'react';
import { X, Download, FileAudio } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { ClassroomDoc } from '../docs-viewer/types';
import { isImageFile, isPdfFile, isVideoFile, isAudioFile } from './utils';

export type ApiCtx = {
  apiBase: string;
  accessToken: string | null;
  classroomUid: string;
};

type Props = {
  doc: ClassroomDoc;
  ctx: ApiCtx;
  open: boolean;
  onClose: () => void;
  t: (key: string, fallback?: string) => string;
};

export function DocViewerPanel({ doc, open, onClose, t }: Props) {
  const imageable = isImageFile(doc.file_type);
  const pdfable = isPdfFile(doc.file_type);
  const videoable = isVideoFile(doc.file_type);
  const audioable = isAudioFile(doc.file_type);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted">
          <p className="min-w-0 flex-1 text-sm font-bold text-foreground truncate" title={doc.name}>
            {doc.name}
          </p>

          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md hover:bg-muted-foreground/10 text-muted-foreground"
            title="Mở file gốc"
          >
            <Download size={14} />
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground"
            title="Đóng"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto bg-muted p-4">
          {imageable && (
            <div className="flex items-center justify-center h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.url}
                alt={doc.name}
                className="max-w-full max-h-full object-contain shadow-lg rounded-md"
                draggable={false}
              />
            </div>
          )}

          {pdfable && (
            <iframe
              src={`${doc.url}#toolbar=0&navpanes=0`}
              className="w-full h-full rounded-md"
              title={doc.name}
            />
          )}

          {videoable && (
            <div className="flex items-center justify-center h-full">
              <video src={doc.url} controls className="max-w-full max-h-full rounded-md shadow-lg">
                <track kind="captions" />
              </video>
            </div>
          )}

          {audioable && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <FileAudio size={32} />
              </div>
              <p className="text-sm font-bold text-foreground text-center px-4 truncate max-w-sm" title={doc.name}>
                {doc.name}
              </p>
              <audio src={doc.url} controls className="w-full max-w-sm" />
            </div>
          )}

          {!imageable && !pdfable && !videoable && !audioable && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
              <p className="mb-2 font-bold">{t('doc_viewer.no_viewer', 'File này không hỗ trợ xem trực tiếp.')}</p>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {t('doc_viewer.open_raw', 'Mở file gốc')}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
