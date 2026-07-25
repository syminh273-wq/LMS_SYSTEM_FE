'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import {
  BookOpen,
  ChevronDown,
  Home,
  LogOut,
  MessageCircle,
  Search,
  UserCheck,
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
import NotificationBell from './NotificationBell';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authed, setAuthed] = useState(false);

  const isHome = pathname === '/consumer/classroom' || pathname === '/consumer/classroom/';
  const isFeed = pathname === '/consumer/feed' || pathname?.startsWith('/consumer/feed');

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
        <div className="max-w-[90vw] mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <Link href={authed ? '/consumer/feed' : '/auth/login'} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Users size={16} strokeWidth={2.5} />
            </div>
            <span className="hidden sm:inline text-sm font-black text-foreground tracking-tight">
              Community
            </span>
          </Link>

          {authed && (
            <nav className="hidden md:flex items-center gap-1 ml-2">
              <button
                onClick={() => router.push('/consumer/classroom')}
                className={
                  'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-bold transition-colors ' +
                  (isHome
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100')
                }
                aria-label={t('feed.workspace_nav.home')}
              >
                <Home size={14} />
                {t('feed.workspace_nav.home')}
              </button>
              <button
                onClick={() => router.push('/consumer/feed')}
                className={
                  'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-bold transition-colors ' +
                  (isFeed
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100')
                }
                aria-label={t('feed.workspace_nav.feed')}
              >
                <User size={14} />
                {t('feed.workspace_nav.feed')}
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/consumer/messages')}
                className="h-9 w-9 rounded-full"
                title={t('workspace.nav.messages')}
              >
                <MessageCircle size={16} />
              </Button>
            </nav>
          )}

          <div className="flex-1" />

          <div className="hidden md:flex relative w-72 lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              placeholder={t('feed.workspace_nav.search_placeholder')}
              className="h-9 pl-9 rounded-full bg-slate-100 dark:bg-slate-800 border-transparent text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            {authed ? (
              <>
                <NotificationBell />
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Mở menu tài khoản"
                      className="ml-2 pl-1.5 pr-2 py-0.5 flex items-center gap-2 rounded-full outline-none hover:ring-2 hover:ring-indigo-300 transition-all"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
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
                      onClick={() => router.push('/consumer/following')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-muted"
                    >
                      <UserCheck size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{t('feed.workspace_nav.following')}</span>
                    </button>
                    <button
                      onClick={() => router.push('/consumer/classroom')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-muted"
                    >
                      <BookOpen size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{t('feed.workspace_nav.back_to_dashboard')}</span>
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-destructive/5"
                    >
                      <LogOut size={14} className="text-destructive" />
                      <span className="text-sm font-medium text-destructive">{t('feed.workspace_nav.logout')}</span>
                    </button>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Button size="sm" onClick={() => router.push('/auth/login')} className="rounded-full h-9 px-4">
                  {t('feed.workspace_nav.login')}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[90vw] mx-auto px-4 md:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
