'use client';

import { Camera, Loader2, UserCheck, UserPlus } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';

type ProfileHeroProps = {
  avatarUrl?: string;
  coverUrl?: string;
  name: string;
  tagline?: string;
  location?: string;
  connections?: number;
  isFollowing?: boolean;
  isConnecting?: boolean;
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
  isFollowing = false,
  isConnecting = false,
  onEditCover,
  onEditAvatar,
  onConnect,
  onMessage,
  isOwner = true,
}: ProfileHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
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
            className="absolute top-3 right-3 bg-white/95 hover:bg-white text-slate-700 font-bold"
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
                  className="w-32 h-32 rounded-full ring-4 ring-white object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full ring-4 ring-white bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-500">
                  {name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
              {isOwner && onEditAvatar && (
                <button
                  onClick={onEditAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50"
                  aria-label={t('portfolio.me.edit_avatar')}
                >
                  <Camera className="size-4" />
                </button>
              )}
            </div>
            <div className="sm:pb-2 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 truncate">{name}</h1>
              {tagline && (
                <p className="text-sm text-slate-700 font-medium mt-0.5">{tagline}</p>
              )}
              {location && (
                <p className="text-xs text-slate-500 font-medium mt-1">📍 {location}</p>
              )}
              {typeof connections === 'number' && (
                <p className="text-xs text-slate-500 font-medium mt-1">
                  <span className="text-slate-900 font-bold">{connections}+</span>{' '}
                  {t('portfolio.me.connections')}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:pb-2">
            {!isOwner && onConnect && (
              <Button
                onClick={onConnect}
                disabled={isConnecting}
                aria-pressed={isFollowing}
                aria-label={isFollowing ? t('portfolio.me.following') : t('portfolio.me.connect')}
                className={
                  isFollowing
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full border border-slate-200'
                    : 'bg-[#0a66c2] hover:bg-[#004182] text-white font-bold rounded-full'
                }
              >
                {isConnecting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserCheck className="size-4" />
                    {t('portfolio.me.following')}
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    {t('portfolio.me.connect')}
                  </>
                )}
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
