'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Link2,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { useTranslation } from '@shared/components/LocaleProvider';
import { portfolioApi, type PortfolioEntry } from '@/lib/api/portfolio';
import { toast } from 'sonner';
import { FeatureEditDialog } from './FeatureEditDialog';
import { PdfThumbnail } from './PdfThumbnail';

type FeatureValue = {
  title?: string;
  description?: string;
  url?: string | null;
  image?: string | null;
  file_name?: string;
  file_type?: string;
};

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

type FeatureItem = {
  uid: string;
  title: string;
  description: string;
  url: string | null;
  image: string | null;
  fileType: string | null;
};

function toItem(entry: PortfolioEntry): FeatureItem | null {
  const v = (entry.value ?? {}) as FeatureValue;
  const hasLink = !!v.url;
  const hasImage = !!v.image;
  if (!hasLink && !hasImage) return null;
  return {
    uid: entry.uid,
    title: v.title || v.url || '',
    description: v.description || '',
    url: hasLink ? v.url! : null,
    image: hasImage ? v.image! : null,
    fileType: v.file_type ?? null,
  };
}

type Props = {
  items: PortfolioEntry[];
  isOwner?: boolean;
  onChanged: (next: PortfolioEntry[]) => void;
};

export function FeaturesSection({ items, isOwner = true, onChanged }: Props) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PortfolioEntry | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title: string; description: string } | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const features = useMemo(
    () => items.map(toItem).filter((x): x is FeatureItem => x !== null),
    [items],
  );

  useEffect(() => {
    updateScrollState();
  }, [features.length]);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handleDelete = async (uid: string) => {
    if (!confirm(t('portfolio.labels.delete_confirm'))) return;
    try {
      await portfolioApi.deleteEntry(uid);
      onChanged(items.filter((i) => i.uid !== uid));
      toast.success(t('portfolio.labels.deleted'));
    } catch {
      toast.error(t('portfolio.labels.delete_error'));
    }
  };

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-slate-400" />
          <h2 className="text-xl font-bold text-slate-900">Features</h2>
          <span className="text-xs text-slate-400 font-semibold">{features.length}</span>
        </div>
        <div className="flex items-center gap-1">
          {(canScrollLeft || canScrollRight) && (
            <>
              <button
                type="button"
                onClick={() => scrollBy(-320)}
                disabled={!canScrollLeft}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Scroll left"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(320)}
                disabled={!canScrollRight}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Scroll right"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
          {isOwner && (
            <button
              onClick={() => setAdding(true)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              aria-label={t('portfolio.me.add')}
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
      </div>

      {features.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Chưa có feature nào.</p>
      ) : (
        <div
          ref={scrollerRef}
          onScroll={updateScrollState}
          className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin]"
        >
          {features.map((f) => (
            <FeatureCard
              key={f.uid}
              feature={f}
              isOwner={isOwner}
              onEdit={() => {
                const entry = items.find((i) => i.uid === f.uid);
                if (entry) setEditing(entry);
              }}
              onDelete={() => handleDelete(f.uid)}
              onOpenImage={() => {
                if (f.image) {
                  setLightbox({ url: f.image, title: f.title, description: f.description });
                }
              }}
            />
          ))}
        </div>
      )}

      {adding && (
        <FeatureEditDialog
          onClose={() => setAdding(false)}
          onSaved={(entry) => {
            onChanged([...items, entry]);
            setAdding(false);
          }}
        />
      )}
      {editing && (
        <FeatureEditDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(entry) => {
            onChanged(items.map((i) => (i.uid === entry.uid ? entry : i)));
            setEditing(null);
          }}
        />
      )}

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-3xl p-0 gap-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">{lightbox?.title}</DialogTitle>
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
          {lightbox && (
            <div className="flex flex-col items-center">
              <img
                src={lightbox.url}
                alt={lightbox.title}
                className="max-h-[80vh] w-auto object-contain"
              />
              <div className="px-5 py-3 text-white text-center w-full">
                <p className="text-sm font-semibold">{lightbox.title}</p>
                {lightbox.description && (
                  <p className="text-xs text-white/70 mt-1 whitespace-pre-line">
                    {lightbox.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function FeatureCard({
  feature,
  isOwner,
  onEdit,
  onDelete,
  onOpenImage,
}: {
  feature: FeatureItem;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onOpenImage: () => void;
}) {
  const hostname = (() => {
    if (!feature.url) return null;
    try {
      return new URL(feature.url).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  })();

  return (
    <div className="group snap-start shrink-0 w-64 rounded-xl border border-slate-200 overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all bg-white relative">
      {isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur hover:bg-white flex items-center justify-center text-slate-500 shadow-sm opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Chỉnh sửa</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="size-3.5" />
              Xoá
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="relative aspect-[16/9] bg-slate-50 overflow-hidden">
        {feature.image ? (
          feature.fileType === 'application/pdf' ? (
            <a href={feature.image} target="_blank" rel="noreferrer" className="block w-full h-full">
              <PdfThumbnail url={feature.image} title={feature.title} />
            </a>
          ) : feature.fileType && !IMAGE_TYPES.has(feature.fileType) ? (
            <a
              href={feature.image}
              target="_blank"
              rel="noreferrer"
              className="block w-full h-full bg-gradient-to-br from-rose-50 to-amber-50 flex flex-col items-center justify-center text-rose-600 gap-1"
            >
              <FileText className="size-10" />
              <span className="text-[10px] font-bold uppercase tracking-wider">FILE</span>
            </a>
          ) : (
            <button type="button" onClick={onOpenImage} className="block w-full h-full">
              <img
                src={feature.image}
                alt={feature.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </button>
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-fuchsia-50 flex items-center justify-center">
            <Link2 className="size-8 text-indigo-300" />
          </div>
        )}
        {feature.url && (
          <a
            href={feature.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur hover:bg-white text-slate-600 hover:text-indigo-600 flex items-center justify-center shadow-sm"
            title="Mở link"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      <div className="px-3 py-2.5">
        <p className="text-[13px] font-semibold text-slate-900 truncate">{feature.title}</p>
        {feature.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{feature.description}</p>
        )}
        {hostname && (
          <p className="text-[10.5px] text-slate-400 truncate mt-1">{hostname}</p>
        )}
      </div>
    </div>
  );
}
