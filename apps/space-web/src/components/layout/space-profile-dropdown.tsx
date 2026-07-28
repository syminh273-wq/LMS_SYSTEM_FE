'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { clearProfile } from '@/lib/redux/userSlice';
import type { RootState } from '@/lib/redux/store';
import { communityApi, type WorkspaceProfile } from '@/lib/api/community';
import { accountService, type UserProfile } from '@/lib/api/account';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import {
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  UserCircle,
  Users,
  Award,
  Calendar,
} from 'lucide-react';

type ProfileData = {
  full_name: string;
  email: string;
  avatar_url: string;
  username: string;
};

export function SpaceProfileDropdown() {
  const router = useRouter();
  const dispatch = useDispatch();
  const reduxProfile = useSelector((s: RootState) => s.user.profile);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let mounted = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const load = async () => {
      try {
        const [account, workspace] = await Promise.all([
          accountService.getProfile().catch(() => null as UserProfile | null),
          communityApi.getMyProfile().catch(() => null as WorkspaceProfile | null),
        ]);
        if (!mounted) return;
        const mergedAvatar =
          workspace?.avatar_url ||
          account?.avatar_url ||
          reduxProfile?.avatar_url ||
          '';
        setProfile({
          full_name: account?.full_name || account?.username || 'Admin',
          email: account?.email || '',
          avatar_url: mergedAvatar,
          username: account?.username || '',
        });
      } catch {}
    };

    load();

    const onProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ avatar_url?: string }>).detail;
      if (detail?.avatar_url) {
        setProfile((prev) => (prev ? { ...prev, avatar_url: detail.avatar_url! } : prev));
      } else {
        load();
      }
    };
    window.addEventListener('space:profile-updated', onProfileUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('space:profile-updated', onProfileUpdated);
    };
  }, [reduxProfile?.avatar_url]);

  const handleLogout = () => {
    dispatch(clearProfile());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/space/login');
  };

  const goToProfile = () => {
    router.push('/space/me');
  };

  const displayName = profile?.full_name || profile?.username || 'Admin';
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = profile?.email || 'Space Admin';

  const menuItems: Array<{
    label: string;
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    path: string;
  }> = [
    { label: 'Trang cá nhân', Icon: UserCircle,     path: '/space/me' },
    { label: 'Dashboard',     Icon: LayoutDashboard, path: '/space' },
    { label: 'Classrooms',    Icon: BookOpen,       path: '/space/classrooms' },
    { label: 'Calendar',      Icon: Calendar,       path: '/space/calendar' },
    { label: 'Certificates',  Icon: Award,          path: '/space/quiz-collections' },
    { label: 'Students',      Icon: Users,          path: '/space/student' },
    { label: 'Settings',      Icon: Settings,       path: '/space/settings' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Mở menu tài khoản"
          onClick={(e) => e.stopPropagation()}
          className="flex max-w-[220px] items-center gap-2.5 rounded-full border border-border bg-card py-1 pl-1 pr-3 outline-none transition-all hover:bg-muted group"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-background"
            />
          ) : (
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-primary-brand to-accent text-xs font-black text-white flex items-center justify-center ring-2 ring-background">
              {initials}
            </div>
          )}
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
        sideOffset={10}
        style={{ width: '240px', minWidth: '240px' }}
        className="rounded-2xl border border-border bg-card p-1.5 shadow-xl"
      >
        <button
          onClick={goToProfile}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary-brand to-accent text-sm font-black text-white flex items-center justify-center">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-foreground">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </button>

        <div className="mx-1 my-1 h-px bg-border" />

        <div className="space-y-0.5">
          {menuItems.map(({ label, Icon, path }) => (
            <button
              key={path}
              onClick={() => router.push(path)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted group"
            >
              <Icon
                size={16}
                strokeWidth={2}
                className="shrink-0 text-muted-foreground group-hover:text-primary-brand transition-colors"
              />
              <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">
                {label}
              </span>
            </button>
          ))}
        </div>

        <div className="mx-1 my-1 h-px bg-border" />

        <button
          onClick={() => router.push('/space/feed')}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted group"
        >
          <Sparkles
            size={16}
            strokeWidth={2}
            className="shrink-0 text-muted-foreground group-hover:text-primary-brand transition-colors"
          />
          <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">
            Social Feed
          </span>
          <span className="ml-auto rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-600">
            MỚI
          </span>
        </button>

        <div className="mx-1 my-1 h-px bg-border" />

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-destructive/5 group"
        >
          <LogOut
            size={16}
            strokeWidth={2}
            className="shrink-0 text-muted-foreground group-hover:text-destructive transition-colors"
          />
          <span className="text-sm font-medium text-foreground/80 group-hover:text-destructive">
            Đăng xuất
          </span>
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
