'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { clearProfile } from '@/lib/redux/userSlice';
import { setBrandColors } from '@shared/lib/redux/themeSlice';
import { Button } from '@shared/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  BookOpen,
  Gamepad2,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  Award,
} from 'lucide-react';
import { ThemeToggle } from '@shared/components/ThemeToggle';
import { LanguageSwitcher } from '@shared/components/LanguageSwitcher';
import { LmsLogo } from '@shared/components/LmsLogo';
import { useTranslation } from '@shared/components/LocaleProvider';
import NotificationBell from '@/components/NotificationBell';
import GlobalSearch from '@/components/GlobalSearch';
import { SpaceProfileDropdown } from '@/components/layout/space-profile-dropdown';

function matchesNavPath(pathname: string, href: string) {
  return href === '/space' ? pathname === href : pathname.startsWith(href);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const brandColors = useSelector((state: RootState) => state.theme.brand);
  const spaceThemeColor = useSelector((state: RootState) => state.space.themeColor);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync space theme color → brand colors whenever it changes
  useEffect(() => {
    if (spaceThemeColor) {
      dispatch(setBrandColors({ primaryColor: spaceThemeColor }));
    }
  }, [spaceThemeColor, dispatch]);

  const isAuthPage =
    pathname.includes('/space/login') ||
    pathname.includes('/space/register') ||
    pathname.includes('/space/forgot-password') ||
    pathname.includes('/space/verify-otp') ||
    pathname.includes('/space/reset-password');

  const navItems = React.useMemo(
    () => [
      { key: 'dashboard',       label: t('layout.nav.dashboard'),       href: '/space',                       icon: LayoutDashboard },
      { key: 'classrooms',      label: t('layout.nav.classrooms'),      href: '/space/classrooms',            icon: BookOpen },
      { key: 'quizzes',         label: t('layout.nav.quizzes'),         href: '/space/quizzes',               icon: Gamepad2 },
      { key: 'quiz_collections',label: t('layout.nav.quiz_collections'),href: '/space/quiz-collections',      icon: Layers },
      { key: 'certificates',    label: t('layout.nav.certificates'),    href: '/space/quiz-collections/certificates', icon: Award },
      { key: 'students',        label: t('layout.nav.students'),        href: '/space/student',               icon: Users },
      { key: 'settings',        label: t('layout.nav.settings'),        href: '/space/settings',              icon: Settings },
    ],
    [t]
  );

  const handleLogout = () => {
    dispatch(clearProfile());
    router.push('/space/login');
  };

  if (isAuthPage) {
    return <div className="min-h-screen bg-muted/50 dark:bg-background">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-[#f8faff] dark:bg-background">
      {/* Sidebar */}
      <aside className={`bg-card dark:bg-card border-r border-border flex flex-col shadow-sm transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-72'}`}>
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center gap-3 pt-5 pb-2 px-2">
            <Link href="/space" className="hover:opacity-80 transition-opacity cursor-pointer" title="LMS System">
              <LmsLogo
                width={40}
                height={40}
                primaryColor={mounted ? brandColors.primaryColor : '#4f46e5'}
                accentColor={mounted ? brandColors.accentColor : '#00b4d8'}
                goldColor={mounted ? brandColors.goldColor : '#d4a843'}
              />
            </Link>
            <button
              onClick={() => setSidebarCollapsed(false)}
              title={t('layout.actions.expand_menu')}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        ) : (
          <div className="p-5 pb-4 flex items-center justify-between">
            <Link href="/space" className="hover:opacity-80 transition-opacity flex-1 min-w-0 cursor-pointer">
              <LmsLogo
                height={38}
                width="auto"
                primaryColor={mounted ? brandColors.primaryColor : '#4f46e5'}
                accentColor={mounted ? brandColors.accentColor : '#00b4d8'}
                goldColor={mounted ? brandColors.goldColor : '#d4a843'}
                className="h-[38px] w-auto"
              />
            </Link>
            <button
              onClick={() => setSidebarCollapsed(true)}
              title={t('layout.actions.collapse_menu')}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted transition-colors ml-2 shrink-0 cursor-pointer"
            >
              <ChevronsLeft size={16} />
            </button>
          </div>
        )}

        <nav className={`flex-1 space-y-1.5 mt-2 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {navItems.map((item) => {
            const isActive = matchesNavPath(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl transition-all duration-200 group relative ${
                  sidebarCollapsed ? 'justify-center py-3 px-2' : 'gap-3 px-4 py-3'
                } ${
                  isActive
                    ? 'bg-primary-brand-light text-primary-brand shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } cursor-pointer`}
              >
                {isActive && <div className="absolute left-0 w-1.5 h-6 bg-primary-brand rounded-r-full top-1/2 -translate-y-1/2" />}
                <item.icon size={20} className={isActive ? 'text-primary-brand' : 'text-muted-foreground group-hover:text-primary-brand/70'} />
                {!sidebarCollapsed && <span className="text-sm font-bold tracking-wide">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`mt-auto border-t border-border ${sidebarCollapsed ? 'p-3 flex justify-center' : 'p-6'}`}>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all ${
              sidebarCollapsed ? 'w-10 h-10 p-0 justify-center' : 'w-full justify-start gap-3 px-4'
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-bold tracking-wide">{t('layout.actions.logout')}</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-card dark:bg-card border-b border-border dark:border-border flex items-center justify-between px-10">
          <div className="flex items-center gap-6 flex-1">
            <h2 className="text-lg font-bold text-foreground uppercase tracking-widest">
              {navItems.find(i => matchesNavPath(pathname, i.href))?.label || t('layout.page_title.space_admin')}
            </h2>
          </div>

          <div className="flex items-center gap-4 mr-4">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-8">
            <ThemeToggle />

            <LanguageSwitcher variant="compact" />

            <NotificationBell />

            <div className="pl-6 border-l border-border">
              <SpaceProfileDropdown />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#f8faff] dark:bg-background p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
