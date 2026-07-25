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
  ChevronDown,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  Sparkles,
  User,
  Calculator,
  History as HistoryIcon,
  Wallet,
} from 'lucide-react';
import { ThemeToggle } from '@shared/components/ThemeToggle';
import { LanguageSwitcher } from '@shared/components/LanguageSwitcher';
import { LmsLogo } from '@shared/components/LmsLogo';
import { useTranslation } from '@shared/components/LocaleProvider';
import NotificationBell from '@/components/NotificationBell';
import TaskCenterBell from '@/components/quiz/TaskCenterBell';
import GlobalSearch from '@/components/GlobalSearch';
import { SpaceProfileDropdown } from '@/components/layout/space-profile-dropdown';
import { useQuizTaskPolling } from '@/lib/hooks/useQuizTaskPolling';

function matchesNavPath(pathname: string, href: string) {
  return href === '/space' ? pathname === href : pathname.startsWith(href);
}

type SubNavItem = {
  key: string;
  label: string;
  href: string;
};

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children?: SubNavItem[];
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const brandColors = useSelector((state: RootState) => state.theme.brand);
  const spaceThemeColor = useSelector((state: RootState) => state.space.themeColor);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  // Sync space theme color → brand colors whenever it changes
  useEffect(() => {
    if (spaceThemeColor) {
      dispatch(setBrandColors({ primaryColor: spaceThemeColor }));
    }
  }, [spaceThemeColor, dispatch]);

  useQuizTaskPolling();

  const isAuthPage =
    pathname.includes('/space/login') ||
    pathname.includes('/space/register') ||
    pathname.includes('/space/forgot-password') ||
    pathname.includes('/space/verify-otp') ||
    pathname.includes('/space/reset-password');

  const navItems = React.useMemo<NavItem[]>(
    () => [
      { key: 'dashboard',       label: t('layout.nav.dashboard'),       href: '/space',                  icon: LayoutDashboard },
      { key: 'classrooms',      label: t('layout.nav.classrooms'),      href: '/space/classrooms',       icon: BookOpen },
      { key: 'calendar',        label: t('layout.nav.calendar'),        href: '/space/calendar',         icon: CalendarDays },
      { key: 'leave_requests',  label: t('layout.nav.leave_requests'),  href: '/space/leave-requests',   icon: ClipboardList },
      { key: 'quizzes',         label: t('layout.nav.quizzes'),         href: '/space/quizzes',          icon: Gamepad2 },
      {
        key: 'certificates',
        label: t('layout.nav.certificates'),
        href: '/space/quiz-collections',
        icon: Award,
        children: [
          { key: 'cert_collections', label: t('layout.nav.submenu.collections'),   href: '/space/quiz-collections' },
          { key: 'cert_library',     label: t('layout.nav.submenu.certificates'), href: '/space/quiz-collections/certificates' },
        ],
      },
      { key: 'students',        label: t('layout.nav.students'),        href: '/space/student',          icon: Users },
      { key: 'grading',         label: t('layout.nav.grading'),         href: '/space/grading',          icon: Calculator },
      { key: 'history',         label: 'Lịch sử',                       href: '/space/history',          icon: Wallet },
      { key: 'settings',        label: t('layout.nav.settings'),        href: '/space/settings',         icon: Settings },
    ],
    [t]
  );

  // Auto-expand any group that contains the active route
  React.useEffect(() => {
    const next: Record<string, boolean> = { ...expandedGroups };
    let changed = false;
    for (const item of navItems) {
      if (!item.children) continue;
      const hasActiveChild = item.children.some(c => matchesNavPath(pathname, c.href));
      if (hasActiveChild && !next[item.key]) {
        next[item.key] = true;
        changed = true;
      }
    }
    if (changed) setExpandedGroups(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navItems]);

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
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        ) : (
          <div className="p-5 pb-4 flex items-center justify-between gap-2">
            <Link
              href="/space"
              className="hover:opacity-80 transition-opacity flex-1 min-w-0 cursor-pointer flex items-center"
              title="LMS System"
            >
              <LmsLogo
                width={140}
                height={40}
                primaryColor={mounted ? brandColors.primaryColor : '#4f46e5'}
                accentColor={mounted ? brandColors.accentColor : '#00b4d8'}
                goldColor={mounted ? brandColors.goldColor : '#d4a843'}
                className="h-10 w-auto"
              />
            </Link>
            <button
              onClick={() => setSidebarCollapsed(true)}
              title={t('layout.actions.collapse_menu')}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0 cursor-pointer"
            >
              <ChevronsLeft size={16} />
            </button>
          </div>
        )}

        <nav className={`flex-1 space-y-1.5 mt-2 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {navItems.map((item) => {
            if (item.children) {
              const isExpanded = !sidebarCollapsed && !!expandedGroups[item.key];
              const isGroupActive = item.children.some(c => matchesNavPath(pathname, c.href));

              if (sidebarCollapsed) {
                return (
                  <div
                    key={item.key}
                    className="relative"
                    onMouseEnter={() => setHoveredGroup(item.key)}
                    onMouseLeave={() => setHoveredGroup(null)}
                  >
                    <button
                      type="button"
                      title={item.label}
                      className={`w-full flex items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                        isGroupActive
                          ? 'bg-primary-brand-light text-primary-brand shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <item.icon size={20} className={isGroupActive ? 'text-primary-brand' : 'text-muted-foreground'} />
                    </button>
                    {hoveredGroup === item.key && (
                      <div className="absolute left-full top-0 ml-2 z-50 min-w-[200px] rounded-xl border border-border bg-card shadow-xl py-2">
                        <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </div>
                        {item.children.map(child => {
                          const childActive = matchesNavPath(pathname, child.href);
                          return (
                            <Link
                              key={child.key}
                              href={child.href}
                              className={`flex items-center px-4 py-2 text-sm font-bold transition-colors ${
                                childActive
                                  ? 'bg-primary-brand-light text-primary-brand'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={item.key}>
                  <button
                    type="button"
                    onClick={() => setExpandedGroups(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                      isGroupActive
                        ? 'bg-primary-brand-light text-primary-brand shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {isGroupActive && <div className="absolute left-0 w-1.5 h-6 bg-primary-brand rounded-r-full" />}
                    <item.icon size={20} className={isGroupActive ? 'text-primary-brand' : 'text-muted-foreground'} />
                    <span className="flex-1 text-left text-sm font-bold tracking-wide">{item.label}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-border space-y-1">
                      {item.children.map(child => {
                        const childActive = matchesNavPath(pathname, child.href);
                        return (
                          <Link
                            key={child.key}
                            href={child.href}
                            className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                              childActive
                                ? 'bg-primary-brand-light text-primary-brand'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

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
              {(() => {
                for (const item of navItems) {
                  if (item.children) {
                    const child = item.children.find(c => matchesNavPath(pathname, c.href));
                    if (child) return child.label;
                    if (matchesNavPath(pathname, item.href)) return item.label;
                  } else if (matchesNavPath(pathname, item.href)) {
                    return item.label;
                  }
                }
                return t('layout.page_title.space_admin');
              })()}
            </h2>
          </div>

          <div className="flex items-center gap-4 mr-4">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-8">
            <ThemeToggle />

            <LanguageSwitcher variant="compact" />

            <TaskCenterBell />

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
