import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  ChevronDown,
  Home,
  LayoutDashboard,
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
import type { UserProfile } from '@/lib/api/account';
import { clearProfile } from '@/features/auth/store';
import { RootState, useAppDispatch } from '@/lib/redux/store';
import NotificationBell from './NotificationBell';

type ShellProfile = UserProfile & { workspace_avatar_url?: string };

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const account = useSelector((state: RootState) => state.user.profile);
  const workspace = useSelector((state: RootState) => state.socialProfile.profile);
  const [authed, setAuthed] = useState(false);

  const isHome = pathname === '/space/feed';

  useEffect(() => {
    setAuthed(Boolean(localStorage.getItem('accessToken')));
  }, []);

  const profile = useMemo<ShellProfile | null>(() => {
    if (!account) return null;
    return {
      ...account,
      avatar_url: workspace?.avatar_url || account.avatar_url || '',
      workspace_avatar_url: workspace?.avatar_url || '',
    };
  }, [account, workspace]);

  const handleLogout = () => {
    dispatch(clearProfile());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/space/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-[90vw] mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <Link href={authed ? '/space/feed' : '/space/login'} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-brand to-violet-600 flex items-center justify-center text-white shadow-md">
              <Users size={16} strokeWidth={2.5} />
            </div>
            <span className="hidden sm:inline text-sm font-black text-foreground tracking-tight">
              Community
            </span>
          </Link>

          {authed && (
            <nav className="hidden md:flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                onClick={() => router.push('/space/feed')}
                data-active={isHome}
                aria-current={isHome ? 'page' : undefined}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
                aria-label="Trang chủ"
              >
                <Home size={14} />
                Trang chủ
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/space/messages')}
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
              placeholder="Tìm kiếm tài liệu, bạn bè..."
              className="h-9 pl-9 rounded-full bg-slate-100 dark:bg-slate-800 border-transparent shadow-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            {authed ? (
              <>
                <NotificationBell />
                <LanguageSwitcher variant="compact" />
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
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
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="rounded-2xl border border-border bg-card p-1.5 shadow-xl w-64">
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-bold truncate">{profile?.full_name || profile?.username || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email || ''}</p>
                    </div>
                    <div className="h-px bg-border my-1" />
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/space')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-muted"
                    >
                      <LayoutDashboard size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">Quay về trang chính</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/space/me')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-muted"
                    >
                      <User size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{t('workspace.profile.title')}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/space/following')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-muted"
                    >
                      <UserCheck size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">Đang theo dõi</span>
                    </Button>
                    <div className="h-px bg-border my-1" />
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-destructive/5"
                    >
                      <LogOut size={14} className="text-destructive" />
                      <span className="text-sm font-medium text-destructive">Đăng xuất</span>
                    </Button>
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

      <main className="max-w-[90vw] mx-auto px-4 md:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
