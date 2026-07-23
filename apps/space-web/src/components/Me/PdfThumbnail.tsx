'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

const PDFJS_VERSION = '3.11.174';
const PDFJS_JS = '/pdfjs/pdf.min.js';
const PDFJS_WORKER = '/pdfjs/pdf.worker.min.js';

type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (params: { url: string }) => { promise: Promise<PdfDocument> };
};

type PdfDocument = {
  getPage: (n: number) => Promise<PdfPage>;
  destroy?: () => Promise<void>;
};

type PdfPage = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
    canvas: HTMLCanvasElement;
  }) => { promise: Promise<void> };
};

declare global {
  interface Window {
    pdfjsLib?: PdfJs;
  }
}

let scriptLoading: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise<PdfJs>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-pdfjs="${PDFJS_VERSION}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.pdfjsLib) resolve(window.pdfjsLib);
        else reject(new Error('pdfjsLib not on window after load'));
      });
      existing.addEventListener('error', () => reject(new Error('PDF.js script failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = PDFJS_JS;
    script.async = true;
    script.dataset.pdfjs = PDFJS_VERSION;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('pdfjsLib not found on window'));
      }
    };
    script.onerror = () => reject(new Error('PDF.js script failed to load'));
    document.head.appendChild(script);
  });

  return scriptLoading;
}

type Props = {
  url: string;
  className?: string;
  title?: string;
};

function proxiedUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  try {
    const u = new URL(url, window.location.href);
    if (u.origin === window.location.origin) return url;
  } catch {
    return url;
  }
  return `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
}

export function PdfThumbnail({ url, className = '', title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let doc: PdfDocument | null = null;

    (async () => {
      try {
        setState('loading');
        setErrorMsg(null);
        const pdfjs = await loadPdfJs();
        if (cancelled) return;

        const task = pdfjs.getDocument({ url: proxiedUrl(url) });
        const loaded = await task.promise;
        doc = loaded;
        if (cancelled) return;

        const page = await doc.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const parent = canvas.parentElement;
        const containerWidth = parent?.clientWidth || 320;
        const containerHeight = parent?.clientHeight || 180;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.max(
          0.1,
          Math.min(containerWidth / baseViewport.width, containerHeight / baseViewport.height),
        );
        const viewport = page.getViewport({ scale });

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No 2D context');
        ctx.scale(dpr, dpr);

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        if (!cancelled) setState('ready');
      } catch (err) {
        console.error('[PdfThumbnail]', url, err);
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
          setState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (doc?.destroy) void doc.destroy();
    };
  }, [url]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-slate-200 ${className}`}>
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full object-contain bg-white shadow-sm transition-opacity ${
          state === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label={title ?? 'PDF thumbnail'}
      />
      {state !== 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-1">
          {state === 'error' ? (
            <>
              <FileText className="size-10 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">PDF</span>
              {errorMsg && (
                <span className="text-[9px] text-slate-500 max-w-[80%] text-center truncate">
                  {errorMsg}
                </span>
              )}
            </>
          ) : (
            <Loader2 className="size-6 animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}
