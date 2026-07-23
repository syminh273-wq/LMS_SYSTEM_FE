'use client';

import { useState } from 'react';
import { Pencil, ChevronDown } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { ProfileEditDialog } from './ProfileEditDialog';
import type { WorkspaceProfile } from '@/lib/api/community';

type BioCardProps = {
  profile: WorkspaceProfile;
  isOwner: boolean;
  onSaved: (next: WorkspaceProfile) => void;
};

const BIO_COLLAPSED_LINES = 5;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function BioCard({ profile, isOwner, onSaved }: BioCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const bioHtml = profile.bio || '';
  const text = stripHtml(bioHtml);
  const isLong = text.length > 220;

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-slate-900">{t('workspace.profile.section_bio')}</h2>
        {isOwner && (
          <button
            onClick={() => setOpen(true)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            aria-label={t('workspace.common.edit')}
          >
            <Pencil className="size-4" />
          </button>
        )}
      </div>
      {bioHtml ? (
        <>
          <div
            className="text-sm text-slate-800 leading-relaxed prose prose-sm max-w-none dark:prose-invert transition-[max-height] duration-300 ease-out"
            style={
              isLong && !expanded
                ? {
                    display: '-webkit-box',
                    WebkitLineClamp: BIO_COLLAPSED_LINES,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }
                : undefined
            }
            dangerouslySetInnerHTML={{ __html: bioHtml }}
          />
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mt-2 inline-flex items-center gap-1"
            >
              {expanded ? t('portfolio.me.show_less') : t('portfolio.me.show_all')}
              <ChevronDown
                className={`size-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-400 italic">{t('workspace.profile.no_bio')}</p>
      )}

      {profile.skills && profile.skills.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
            {t('workspace.profile.section_skills')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {open && (
        <ProfileEditDialog
          profile={profile}
          onClose={() => setOpen(false)}
          onSaved={(p) => { onSaved(p); setOpen(false); }}
        />
      )}
    </section>
  );
}
