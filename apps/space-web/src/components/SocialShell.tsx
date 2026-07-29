'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import {
  Bell,
  ChevronDown,
  LogOut,
  Pencil,
  Search,
  Settings,
  User,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
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
import { Input } from '@shared/components/ui/input';
import { ThemeToggle } from '@shared/components/ThemeToggle';
import { LanguageSwitcher } from '@shared/components/LanguageSwitcher';
import { useTranslation } from '@shared/components/LocaleProvider';
import NotificationBell from '@/components/NotificationBell';
import { accountService } from '@/lib/api/account';
import { clearProfile } from '@/lib/redux/userSlice';
import { portfolioApi, type Portfolio } from '@/lib/api/portfolio';

type ProfileSummary = {
  uid: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  username?: string;
  name?: string;
  slug?: string;
  description?: string;
};

export function SocialShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    setAuthed(Boolean(token));
    if (!token) return;

    let mounted = true;
    accountService.getProfile()
      .then((data) => {
        if (!mounted) return;
        const summary: ProfileSummary = {
          uid: (data as any).uid,
          full_name: (data as any).full_name,
          email: (data as any).email,
          avatar_url: (data as any).avatar_url,
          username: (data as any).username,
          name: (data as any).name,
          slug: (data as any).slug,
          description: (data as any).description,
        };
        setProfile(summary);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!profile?.uid) return;
    portfolioApi.getMine()
      .then(() => setIsOwner(true))
      .catch(() => setIsOwner(false));
  }, [profile?.uid]);

  const handleLogout = () => {
    dispatch(clearProfile());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/space/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-brand-light/30">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <Link href={authed ? '/space/me' : '/space/login'} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-brand via-fuchsia-500 to-orange-400 flex items-center justify-center text-white shadow-md">
              <User size={16} strokeWidth={2.5} />
            </div>
            <span className="hidden sm:inline text-sm font-black text-foreground tracking-tight">
              {t('portfolio.personal.brand')}
            </span>
          </Link>

          <div className="flex-1 max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              placeholder={t('portfolio.personal.search_placeholder')}
              className="h-9 pl-9 rounded-full bg-muted/40 border-border/40 text-sm"
            />
          </div>

          <div className="flex items-center gap-1">
            {authed && isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/space/me')}
                className="rounded-full h-9 px-3 gap-1.5 text-xs font-bold border-border/60"
              >
                <Pencil size={13} /> {t('portfolio.personal.edit_profile')}
              </Button>
            )}
            {authed ? (
              <>
                <LanguageSwitcher />
                <ThemeToggle />
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="ml-1 flex items-center gap-1 rounded-full p-0.5 outline-none ring-offset-background hover:ring-2 hover:ring-primary-brand/30 transition-all">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-primary-brand to-fuchsia-500 text-xs font-black text-white">
                          {(profile?.full_name || profile?.username || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown size={12} className="text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="rounded-2xl border border-border bg-card p-1.5 shadow-xl w-64">
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-bold truncate">{profile?.full_name || profile?.username || 'Teacher'}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email || ''}</p>
                    </div>
                    <div className="h-px bg-border my-1" />
                    <Button
                      onClick={() => router.push('/space')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted"
                    >
                      <User size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">Back to dashboard</span>
                    </Button>
                    <Button
                      onClick={() => router.push('/space/settings')}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted"
                    >
                      <Settings size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">Settings</span>
                    </Button>
                    <div className="h-px bg-border my-1" />
                    <Button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-destructive/5"
                    >
                      <LogOut size={14} className="text-destructive" />
                      <span className="text-sm font-medium text-destructive">Đăng xuất</span>
                    </Button>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => router.push('/space/login')}
                className="rounded-full h-9 px-4 gap-1.5 text-xs font-bold"
              >
                {t('portfolio.personal.sign_in')}
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
