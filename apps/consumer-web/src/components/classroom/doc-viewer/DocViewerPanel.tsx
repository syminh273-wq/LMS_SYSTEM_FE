import * as React from 'react';
import { useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { ClassroomDoc } from '../docs-viewer/types';
import { isImageFile, isPdfFile } from './utils';

type Props = {
  doc: ClassroomDoc;
  open: boolean;
  onClose: () => void;
};

export function DocViewerPanel({ doc, open, onClose }: Props) {
  const [pdfPage, setPdfPage] = useState(1);

  const imageable = isImageFile(doc.file_type);
  const pdfable = isPdfFile(doc.file_type);

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
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted">
          <p className="text-sm font-bold text-foreground truncate flex-1 min-w-0" title={doc.name}>
            {doc.name}
          </p>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md hover:bg-muted text-muted-foreground"
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

        <div className="flex-1 min-h-0 overflow-auto bg-muted p-4 relative">
          {imageable && (
            <div className="relative inline-block mx-auto" style={{ maxWidth: '100%' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.url}
                alt={doc.name}
                className="max-w-full max-h-[80vh] object-contain shadow-lg rounded-md"
                draggable={false}
              />
            </div>
          )}

          {pdfable && (
            <div className="flex flex-col h-full min-h-0">
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                  disabled={pdfPage <= 1}
                >
                  <ChevronLeft size={14} />
                </Button>
                <span>Trang {pdfPage}</span>
                <Button size="sm" variant="ghost" onClick={() => setPdfPage((p) => p + 1)}>
                  <ChevronRight size={14} />
                </Button>
              </div>
              <div className="relative flex-1 min-h-0 bg-muted rounded-md overflow-hidden">
                <iframe
                  key={pdfPage}
                  src={`${doc.url}#page=${pdfPage}&toolbar=0&navpanes=0`}
                  className="w-full h-full"
                  title={doc.name}
                />
              </div>
            </div>
          )}

          {!imageable && !pdfable && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
              <p className="mb-2 font-bold">File này không hỗ trợ xem trực tiếp.</p>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Mở file gốc
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
