'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import {
  BookOpen,
  ChevronDown,
  LogOut,
  MessageCircle,
  Pencil,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Avatar, AvatarFallback, AvatarImage,
} from '@shared/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { Input } from '@shared/components/ui/input';
import { ThemeToggle } from '@shared/components/ThemeToggle';
import { LanguageSwitcher } from '@shared/components/LanguageSwitcher';
import { useTranslation } from '@shared/components/LocaleProvider';
import { accountService, type UserProfile } from '@/lib/api/account';
import { clearProfile } from '@/lib/redux/userSlice';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(localStorage.getItem('accessToken')));
  }, []);

  useEffect(() => {
    if (!authed) return;
    let mounted = true;
    accountService.getProfile()
      .then((data) => { if (mounted) setProfile(data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [authed]);

  const handleLogout = () => {
    dispatch(clearProfile());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <Link href={authed ? '/consumer/feed' : '/auth/login'} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Users size={16} strokeWidth={2.5} />
            </div>
            <span className="hidden sm:inline text-sm font-black text-foreground tracking-tight">
              Community
            </span>
          </Link>

          <div className="flex-1 max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              placeholder="Tìm kiếm..."
              className="h-9 pl-9 rounded-full bg-slate-100 dark:bg-slate-800 border-transparent text-sm"
            />
          </div>

          <div className="flex items-center gap-1">
            {authed ? (
              <>
                <LanguageSwitcher />
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/consumer/messages')}
                  className="h-9 w-9 rounded-full"
                  title={t('workspace.nav.messages')}
                >
                  <MessageCircle size={16} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-1 flex items-center gap-1 rounded-full p-0.5 outline-none hover:ring-2 hover:ring-indigo-300 transition-all">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''}  />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-black text-white">
                          {(profile?.full_name || profile?.username || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown size={12} className="text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="rounded-2xl border border-border bg-card p-1.5 shadow-xl w-64">
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-bold truncate">{profile?.full_name || profile?.username || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email || ''}</p>
                    </div>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={() => router.push('/consumer/profile')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-muted"
                    >
                      <User size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{t('workspace.profile.title')}</span>
                    </button>
                    <button
                      onClick={() => router.push('/consumer/profile')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-muted"
                    >
                      <Pencil size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{t('workspace.profile.edit_profile')}</span>
                    </button>
                    <button
                      onClick={() => router.push('/consumer/settings')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-muted"
                    >
                      <Settings size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{t('workspace.nav.settings')}</span>
                    </button>
                    <button
                      onClick={() => router.push('/consumer/classroom')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-muted"
                    >
                      <BookOpen size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">Quay về trang chính</span>
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-destructive/5"
                    >
                      <LogOut size={14} className="text-destructive" />
                      <span className="text-sm font-medium text-destructive">Đăng xuất</span>
                    </button>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button size="sm" onClick={() => router.push('/auth/login')} className="rounded-full h-9 px-4">
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
