'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearProfile } from '@/lib/redux/userSlice';
import { accountService } from '@/lib/api/account';
import type { Consumer } from '@/lib/api/types';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { BookOpen, ChevronDown, LayoutDashboard, LogOut, Settings, User } from 'lucide-react';

type ProfileSummary = Pick<Consumer, 'full_name' | 'email' | 'avatar_url' | 'username'>;

type ConsumerProfileDropdownProps = {
  profile?: ProfileSummary | null;
};

export function ConsumerProfileDropdown({ profile }: ConsumerProfileDropdownProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loadedProfile, setLoadedProfile] = useState<ProfileSummary | null>(null);
  const effectiveProfile = profile !== undefined ? profile : loadedProfile;

  useEffect(() => {
    if (profile !== undefined) return;

    let mounted = true;
    accountService.getProfile()
      .then((data) => {
        if (!mounted) return;
        setLoadedProfile({
          full_name: data.full_name,
          email: data.email,
          avatar_url: data.avatar_url,
          username: data.username,
        });
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [profile]);

  const handleLogout = () => {
    dispatch(clearProfile());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/consumer/login');
  };

  const displayName = effectiveProfile?.full_name || effectiveProfile?.username || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = effectiveProfile?.email || 'Học sinh';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex max-w-[220px] items-center gap-2.5 rounded-2xl border border-border bg-card py-1 pl-1 pr-3 outline-none transition-all hover:bg-muted group">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={effectiveProfile?.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="bg-indigo-100 text-xs font-black text-indigo-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-sm font-bold leading-none text-foreground">{displayName}</p>
            <p className="mt-0.5 max-w-[120px] truncate text-[11px] leading-none text-muted-foreground">
              {email}
            </p>
          </div>
          <ChevronDown size={14} className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        style={{ width: '260px', minWidth: '260px' }}
        className="rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl"
      >
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={effectiveProfile?.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="bg-indigo-100 text-xs font-black text-indigo-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-gray-900">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-gray-400">{email}</p>
          </div>
        </div>

        <div className="mx-1 my-1 h-px bg-gray-100" />

        <div className="space-y-0.5">
          {[
            { label: 'Hồ sơ cá nhân', Icon: User, bg: 'bg-indigo-100', color: 'text-indigo-600', path: '/consumer/profile' },
            { label: 'Lớp học của tôi', Icon: BookOpen, bg: 'bg-emerald-100', color: 'text-emerald-600', path: '/consumer/classroom' },
            { label: 'Dashboard', Icon: LayoutDashboard, bg: 'bg-blue-100', color: 'text-blue-600', path: '/consumer/dashboard' },
            { label: 'Settings', Icon: Settings, bg: 'bg-violet-100', color: 'text-violet-600', path: '/consumer/settings' },
          ].map(({ label, Icon, bg, color, path }) => (
            <button
              key={path}
              onClick={() => router.push(path)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 group"
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${bg} ${color}`}>
                <Icon size={13} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
            </button>
          ))}
        </div>

        <div className="mx-1 my-1 h-px bg-gray-100" />

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-red-50 group"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-500">
            <LogOut size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium text-red-500 group-hover:text-red-600">Đăng xuất</span>
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
