'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { AboutEditDialog } from './AboutEditDialog';

type AboutCardProps = {
  about?: string;
  isOwner?: boolean;
  onSaved: (about: string) => void;
};

export function AboutCard({ about, isOwner = true, onSaved }: AboutCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-slate-900">{t('portfolio.me.intro')}</h2>
        {isOwner && (
          <button
            onClick={() => setOpen(true)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            aria-label={t('portfolio.me.edit')}
          >
            <Pencil className="size-4" />
          </button>
        )}
      </div>
      {about ? (
        <div
          className="text-sm text-slate-800 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: about }}
        />
      ) : (
        <p className="text-sm text-slate-400 italic">
          {isOwner ? t('portfolio.me.no_about') : ''}
        </p>
      )}
      {open && (
        <AboutEditDialog
          initial={about ?? ''}
          onClose={() => setOpen(false)}
          onSaved={(val) => {
            onSaved(val);
            setOpen(false);
          }}
        />
      )}
    </section>
  );
}
