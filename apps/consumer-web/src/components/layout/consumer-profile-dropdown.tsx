'use client';

import { useEffect, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearProfile } from '@/lib/redux/userSlice';
import { communityApi, type WorkspaceProfile } from '@/lib/api/community';
import { accountService, type UserProfile } from '@/lib/api/account';
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
import {
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  User,
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

export function ConsumerProfileDropdown() {
  const router = useRouter();
  const dispatch = useDispatch();
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
        setProfile({
          full_name: account?.full_name || account?.username || 'User',
          email: account?.email || '',
          avatar_url: workspace?.avatar_url || account?.avatar_url || '',
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
    window.addEventListener('community:profile-updated', onProfileUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('community:profile-updated', onProfileUpdated);
    };
  }, []);

  const handleLogout = () => {
    dispatch(clearProfile());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/consumer/login');
  };

  const goToProfile = () => {
    router.push('/consumer/profile');
  };

  const displayName = profile?.full_name || profile?.username || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = profile?.email || 'Học sinh';

  const menuItems: Array<{
    label: string;
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    bg: string;
    color: string;
    path: string;
  }> = [
    { label: 'Dashboard',       Icon: LayoutDashboard, bg: 'bg-blue-100',     color: 'text-blue-600',     path: '/consumer/dashboard' },
    { label: 'Lớp học của tôi', Icon: BookOpen,        bg: 'bg-emerald-100',  color: 'text-emerald-600',  path: '/consumer/classroom' },
    { label: 'Lịch học',        Icon: Calendar,        bg: 'bg-rose-100',     color: 'text-rose-600',     path: '/consumer/calendar' },
    { label: 'Chứng chỉ',       Icon: Award,           bg: 'bg-amber-100',    color: 'text-amber-600',    path: '/consumer/certificates' },
    { label: 'Hồ sơ cá nhân',   Icon: User,            bg: 'bg-indigo-100',   color: 'text-indigo-600',   path: '/consumer/profile' },
    { label: 'Settings',        Icon: Settings,        bg: 'bg-violet-100',   color: 'text-violet-600',   path: '/consumer/settings' },
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
        <Button
          type="button"
          aria-label="Mở menu tài khoản"
          className="flex max-w-[220px] items-center gap-2.5 rounded-2xl border border-border bg-card py-1 pl-1 pr-3 outline-none transition-all hover:bg-muted group"
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
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
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        style={{ width: '280px', minWidth: '280px' }}
        className="rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl"
      >
        <Button
          onClick={goToProfile}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50"
        >
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="bg-indigo-100 text-sm font-black text-indigo-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-gray-900">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-gray-400">{email}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Xem trang cá nhân →
            </p>
          </div>
        </Button>

        <div className="mx-1 my-1 h-px bg-gray-100" />

        <Button
          onClick={() => router.push('/consumer/feed')}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 group"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pink-100 text-pink-600">
            <Sparkles size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Social Feed</span>
          <span className="ml-auto rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-600">
            MỚI
          </span>
        </Button>

        <div className="mx-1 my-1 h-px bg-gray-100" />

        <div className="space-y-0.5">
          {menuItems.map(({ label, Icon, bg, color, path }) => (
            <Button
              key={path}
              onClick={() => router.push(path)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 group"
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${bg} ${color}`}>
                <Icon size={13} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
            </Button>
          ))}
        </div>

        <div className="mx-1 my-1 h-px bg-gray-100" />

        <div className="grid grid-cols-4 gap-1 px-1 py-1">
          {quickItems.map(({ label, Icon, bg, color }) => (
            <Button
              key={label}
              onClick={() => {
                if (label === 'Thông báo') router.push('/consumer/notifications');
                else if (label === 'Trợ giúp') router.push('/consumer/help');
                else if (label === 'Ngôn ngữ') router.push('/consumer/settings?tab=language');
                else if (label === 'Dark mode') {
                  if (typeof document !== 'undefined') {
                    document.documentElement.classList.toggle('dark');
                  }
                }
              }}
              className="flex flex-col items-center gap-1 rounded-xl py-2 transition-colors hover:bg-gray-50 group"
              title={label}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${color}`}>
                <Icon size={15} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-900">
                {label}
              </span>
            </Button>
          ))}
        </div>

        <div className="mx-1 my-1 h-px bg-gray-100" />

        <Button
          onClick={() => router.push('/consumer/profile/edit')}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 group"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-100 text-cyan-600">
            <FileText size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Chỉnh sửa hồ sơ</span>
        </Button>

        <Button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-red-50 group"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-500">
            <LogOut size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium text-red-500 group-hover:text-red-600">Đăng xuất</span>
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
