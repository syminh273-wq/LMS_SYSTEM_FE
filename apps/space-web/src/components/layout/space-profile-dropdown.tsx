'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { clearProfile, type RootState } from '@/lib/redux/userSlice';
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
  Bell,
  HelpCircle,
  Moon,
  Globe,
  Award,
  Calendar,
  FileText,
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
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    bg: string;
    color: string;
    path: string;
  }> = [
    { label: 'Dashboard',     Icon: LayoutDashboard, bg: 'bg-blue-100',     color: 'text-blue-600',     path: '/space' },
    { label: 'Classrooms',    Icon: BookOpen,        bg: 'bg-emerald-100',  color: 'text-emerald-600',  path: '/space/classrooms' },
    { label: 'Calendar',      Icon: Calendar,        bg: 'bg-rose-100',     color: 'text-rose-600',     path: '/space/calendar' },
    { label: 'Certificates',  Icon: Award,           bg: 'bg-amber-100',    color: 'text-amber-600',    path: '/space/quiz-collections' },
    { label: 'Students',      Icon: Users,           bg: 'bg-indigo-100',   color: 'text-indigo-600',   path: '/space/student' },
    { label: 'Trang cá nhân', Icon: UserCircle,      bg: 'bg-fuchsia-100',  color: 'text-fuchsia-600',  path: '/space/me' },
    { label: 'Settings',      Icon: Settings,        bg: 'bg-violet-100',   color: 'text-violet-600',   path: '/space/settings' },
  ];

  const quickItems: Array<{
    label: string;
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    bg: string;
    color: string;
  }> = [
    { label: 'Thông báo',  Icon: Bell,        bg: 'bg-sky-100',     color: 'text-sky-600' },
    { label: 'Ngôn ngữ',   Icon: Globe,       bg: 'bg-teal-100',    color: 'text-teal-600' },
    { label: 'Dark mode',  Icon: Moon,        bg: 'bg-slate-100',   color: 'text-slate-600' },
    { label: 'Trợ giúp',   Icon: HelpCircle,  bg: 'bg-orange-100',  color: 'text-orange-600' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Mở menu tài khoản"
          onClick={(e) => e.stopPropagation()}
          className="flex max-w-[220px] items-center gap-2.5 rounded-2xl border border-border bg-card py-1 pl-1 pr-3 outline-none transition-all hover:bg-muted group"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 shrink-0 rounded-full bg-primary-brand/10 text-xs font-black text-primary-brand flex items-center justify-center">
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
        sideOffset={8}
        style={{ width: '280px', minWidth: '280px' }}
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
            <div className="h-10 w-10 shrink-0 rounded-full bg-primary-brand/10 text-sm font-black text-primary-brand flex items-center justify-center">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-foreground">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-primary-brand">
              Xem trang cá nhân →
            </p>
          </div>
        </button>

        <div className="mx-1 my-1 h-px bg-border" />

        <button
          onClick={() => router.push('/space/feed')}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted group"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pink-100 text-pink-600">
            <Sparkles size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">Social Feed</span>
          <span className="ml-auto rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-600">
            MỚI
          </span>
        </button>

        <div className="mx-1 my-1 h-px bg-border" />

        <div className="space-y-0.5">
          {menuItems.map(({ label, Icon, bg, color, path }) => (
            <button
              key={path}
              onClick={() => router.push(path)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted group"
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${bg} ${color}`}>
                <Icon size={13} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">{label}</span>
            </button>
          ))}
        </div>

        <div className="mx-1 my-1 h-px bg-border" />

        <div className="grid grid-cols-4 gap-1 px-1 py-1">
          {quickItems.map(({ label, Icon, bg, color }) => (
            <button
              key={label}
              onClick={() => {
                if (label === 'Thông báo') router.push('/space/notifications');
                else if (label === 'Trợ giúp') router.push('/space/help');
                else if (label === 'Ngôn ngữ') router.push('/space/settings?tab=language');
                else if (label === 'Dark mode') {
                  if (typeof document !== 'undefined') {
                    document.documentElement.classList.toggle('dark');
                  }
                }
              }}
              className="flex flex-col items-center gap-1 rounded-xl py-2 transition-colors hover:bg-muted group"
              title={label}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${color}`}>
                <Icon size={15} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                {label}
              </span>
            </button>
          ))}
        </div>

        <div className="mx-1 my-1 h-px bg-border" />

        <button
          onClick={() => router.push('/space/me/edit')}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted group"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-100 text-cyan-600">
            <FileText size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">Chỉnh sửa hồ sơ</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-destructive/5 group"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <LogOut size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium text-destructive">Đăng xuất</span>
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
