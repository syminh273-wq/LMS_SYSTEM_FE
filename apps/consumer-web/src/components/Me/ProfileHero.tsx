'use client';

import { Camera } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';

type ProfileHeroProps = {
  avatarUrl?: string;
  coverUrl?: string;
  name: string;
  tagline?: string;
  location?: string;
  connections?: number;
  onEditCover?: () => void;
  onEditAvatar?: () => void;
  onConnect?: () => void;
  onMessage?: () => void;
  isOwner?: boolean;
};

export function ProfileHero({
  avatarUrl,
  coverUrl,
  name,
  tagline,
  location,
  connections,
  onEditCover,
  onEditAvatar,
  onConnect,
  onMessage,
  isOwner = true,
}: ProfileHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Cover */}
      <div
        className="h-32 sm:h-44 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 relative bg-cover bg-center"
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      >
        {isOwner && onEditCover && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onEditCover}
            className="absolute top-3 right-3 bg-white/95 hover:bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold"
          >
            <Camera className="size-3.5" />
            {t('portfolio.me.edit_cover')}
          </Button>
        )}
      </div>

      {/* Identity */}
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-32 h-32 rounded-full ring-4 ring-white dark:ring-slate-900 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full ring-4 ring-white dark:ring-slate-900 bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-500 dark:text-slate-400">
                  {name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
              {isOwner && onEditAvatar && (
                <button
                  onClick={onEditAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm hover:bg-slate-50 dark:bg-slate-900/50"
                  aria-label={t('portfolio.me.edit_avatar')}
                >
                  <Camera className="size-4" />
                </button>
              )}
            </div>
            <div className="sm:pb-2 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{name}</h1>
              {tagline && (
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-0.5">{tagline}</p>
              )}
              {location && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">📍 {location}</p>
              )}
              {typeof connections === 'number' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{connections}+</span>{' '}
                  {t('portfolio.me.connections')}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:pb-2">
            {!isOwner && onConnect && (
              <Button
                onClick={onConnect}
                className="bg-[#0a66c2] hover:bg-[#004182] text-white font-bold rounded-full"
              >
                + {t('portfolio.me.connect')}
              </Button>
            )}
            {!isOwner && onMessage && (
              <Button
                variant="outline"
                onClick={onMessage}
                className="border-[#0a66c2] text-[#0a66c2] font-bold rounded-full hover:bg-blue-50"
              >
                {t('portfolio.me.message')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
