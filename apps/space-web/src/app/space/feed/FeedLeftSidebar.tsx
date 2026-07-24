'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  User as UserIcon,
  Newspaper,
  MessageCircle,
  Settings as SettingsIcon,
  PenLine,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { ProfileHeaderInfo } from '@shared/components/address';
import { cn } from '@shared/lib/utils';

type Profile = {
  full_name: string;
  avatar_url: string;
  uid: string;
  email?: string;
  username?: string;
  created_at?: string;
};

const NAV_ITEMS = [
  { label: 'Trang cá nhân', icon: UserIcon,      path: '/space/me' },
  { label: 'Bảng tin',      icon: Newspaper,     path: '/space/feed' },
  { label: 'Tin nhắn',      icon: MessageCircle, path: '/space/messages' },
  { label: 'Cài đặt',       icon: SettingsIcon,  path: '/space/settings' },
] as const;

export function FeedLeftSidebar({ profile }: { profile: Profile }) {
  const router = useRouter();
  const pathname = usePathname();
  const initials = (profile.full_name || '?').slice(0, 2).toUpperCase();

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <div className="bg-white border border-slate-200 rounded-xl p-5 card-elevated">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-4 ring-white shadow-sm">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <h2 className="mt-3 text-[15px] font-bold text-slate-900 truncate max-w-full">
            {profile.full_name}
          </h2>
          {profile.email && (
            <p className="text-[12px] text-slate-500 truncate max-w-full mt-0.5">
              {profile.email}
            </p>
          )}
        </div>
        <ProfileHeaderInfo uid={profile.uid} createdAt={profile.created_at} isOwner />
      </div>

      <nav className="bg-white border border-slate-200 rounded-xl p-2 card-elevated">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
            const active = pathname === path || (path === '/space/feed' && pathname?.startsWith('/space/feed'));
            return (
              <li key={path}>
                <button
                  onClick={() => router.push(path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13.5px] font-medium transition-colors',
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <span className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                  )}>
                    <Icon size={15} />
                  </span>
                  <span className="truncate">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        onClick={() => router.push('/space/me')}
        className="w-full inline-flex items-center justify-center gap-2 h-11 bg-white border border-slate-200 rounded-xl text-[13.5px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors card-elevated"
      >
        <PenLine size={14} />
        Chỉnh sửa hồ sơ
      </button>
    </aside>
  );
}
