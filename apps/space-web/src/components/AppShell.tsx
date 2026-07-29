
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { clearProfile } from '@/lib/redux/userSlice';
import { setBrandColors } from '@shared/lib/redux/themeSlice';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/button';
import { Avatar, AvatarFallback } from '@shared/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shared/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components/ui/tooltip';
import { Separator } from '@shared/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  BookOpen,
  Gamepad2,
  ChevronsLeft,
  ChevronsRight,
  Award,
  ChevronDown,
  CalendarDays,
  ClipboardList,
  Calculator,
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
  if (href === '/space') return pathname === href;
  return pathname === href;
}

function matchesGroupPath(pathname: string, href: string) {
  if (href === '/space') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
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

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isActive: boolean;
  collapsed: boolean;
};

function NavLink({ href, label, icon: Icon, isActive, collapsed }: NavLinkProps) {
  const link = (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      data-active={isActive}
      className={cn(
        'group relative flex items-center text-sm font-bold tracking-wide transition-colors',
        'rounded-xl',
        collapsed ? 'justify-center px-2 py-3' : 'gap-3 pl-4 pr-4 py-3',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
        isActive && 'bg-primary/10 text-primary font-semibold',
      )}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-primary"
        />
      )}
      <Icon
        size={20}
        className={cn(
          'text-muted-foreground transition-colors',
          'group-hover:text-foreground',
          isActive && 'text-primary',
        )}
      />
      {!collapsed && <span className="flex-1 text-left">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

type NavGroupProps = {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function NavGroup({ item, pathname, collapsed, open, onOpenChange }: NavGroupProps) {
  const isGroupActive =
    matchesGroupPath(pathname, item.href) ||
    (item.children?.some(c => matchesGroupPath(pathname, c.href)) ?? false);
  const Icon = item.icon;

  const trigger = (
    <button
      type="button"
      aria-expanded={open}
      data-active={isGroupActive}
      className={cn(
        'group relative flex w-full items-center text-sm font-bold tracking-wide transition-colors',
        'rounded-xl',
        collapsed ? 'justify-center px-2 py-3' : 'gap-3 pl-4 pr-4 py-3',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
        isGroupActive && 'bg-primary/10 text-primary font-semibold',
      )}
    >
      {isGroupActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-primary"
        />
      )}
      <Icon
        size={20}
        className={cn(
          'text-muted-foreground transition-colors',
          'group-hover:text-foreground',
          isGroupActive && 'text-primary',
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            size={14}
            className={cn('transition-transform', open && 'rotate-180')}
          />
        </>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>{trigger}</CollapsibleTrigger>
      <CollapsibleContent className="mt-1 space-y-1 border-l border-border pl-4 ml-4">
        {item.children?.map(child => {
          const childActive = matchesNavPath(pathname, child.href);
          return (
            <Link
              key={child.key}
              href={child.href}
              aria-current={childActive ? 'page' : undefined}
              data-active={childActive}
              className={cn(
                'block rounded-lg px-3 py-2 text-xs font-bold',
                'text-muted-foreground',
                'data-[active=true]:text-foreground data-[active=true]:font-semibold',
              )}
            >
              {child.label}
            </Link>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
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
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

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
      { key: 'dashboard', label: t('layout.nav.dashboard'), href: '/space', icon: LayoutDashboard },
      { key: 'classrooms', label: t('layout.nav.classrooms'), href: '/space/classrooms', icon: BookOpen },
      { key: 'calendar', label: t('layout.nav.calendar'), href: '/space/calendar', icon: CalendarDays },
      { key: 'leave_requests', label: t('layout.nav.leave_requests'), href: '/space/leave-requests', icon: ClipboardList },
      { key: 'quizzes', label: t('layout.nav.quizzes'), href: '/space/quizzes', icon: Gamepad2 },
      {
        key: 'certificates',
        label: t('layout.nav.certificates'),
        href: '/space/quiz-collections',
        icon: Award,
        children: [
          { key: 'cert_collections', label: t('layout.nav.submenu.collections'), href: '/space/quiz-collections' },
          { key: 'cert_library', label: t('layout.nav.submenu.certificates'), href: '/space/quiz-collections/certificates' },
        ],
      },
      { key: 'students', label: t('layout.nav.students'), href: '/space/student', icon: Users },
      { key: 'grading', label: t('layout.nav.grading'), href: '/space/grading', icon: Calculator },
      { key: 'history', label: 'Lịch sử', href: '/space/history', icon: Wallet },
      { key: 'settings', label: t('layout.nav.settings'), href: '/space/settings', icon: Settings },
    ],
    [t]
  );

  const seededExpanded = React.useMemo(() => {
    const seed: Record<string, boolean> = {};
    for (const item of navItems) {
      if (!item.children) continue;
      if (matchesGroupPath(pathname, item.href)) {
        seed[item.key] = true;
      }
    }
    return seed;
  }, [pathname, navItems]);

  const [userExpanded, setExpandedGroups] = useState<Record<string, boolean>>({});
  const expandedGroups = React.useMemo(
    () => ({ ...seededExpanded, ...userExpanded }),
    [seededExpanded, userExpanded],
  );

  const handleLogout = () => {
    dispatch(clearProfile());
    router.push('/space/login');
  };

  const profile = useSelector((state: RootState) => state.user.profile);
  const initials = (
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.username ||
    profile?.email ||
    'U'
  )
    .split(/\s+/)
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (isAuthPage) {
    return <div className="min-h-screen bg-muted/50 dark:bg-background">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-[#f8faff] dark:bg-background">
      <aside
        className={cn(
          'bg-muted/40 dark:bg-muted/20 border-r border-border flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-[72px]' : 'w-72',
        )}
      >
        <div
          className={cn(
            'flex items-center',
            sidebarCollapsed
              ? 'flex-col items-center gap-3 px-2 pt-5 pb-2'
              : 'justify-between gap-2 p-5 pb-4',
          )}
        >
          <Link
            href="/space"
            className={cn(
              'flex items-center hover:opacity-80 transition-opacity',
              sidebarCollapsed ? '' : 'flex-1 min-w-0',
            )}
            title="LMS System"
          >
            <LmsLogo
              width={sidebarCollapsed ? 40 : 140}
              height={40}
              primaryColor={mounted ? brandColors.primaryColor : '#4f46e5'}
              accentColor={mounted ? brandColors.accentColor : '#00b4d8'}
              goldColor={mounted ? brandColors.goldColor : '#d4a843'}
              className={cn(sidebarCollapsed ? '' : 'h-10 w-auto')}
            />
          </Link>
          <Button
            onClick={() => setSidebarCollapsed(c => !c)}
            title={sidebarCollapsed ? t('layout.actions.expand_menu') : t('layout.actions.collapse_menu')}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground"
          >
            {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </Button>
        </div>

        <nav className={cn('flex-1 space-y-1.5 mt-2', sidebarCollapsed ? 'px-2' : 'px-4')}>
          {navItems.map(item => {
            if (item.children) {
              return (
                <NavGroup
                  key={item.key}
                  item={item}
                  pathname={pathname}
                  collapsed={sidebarCollapsed}
                  open={!!expandedGroups[item.key]}
                  onOpenChange={open =>
                    setExpandedGroups(prev => ({ ...prev, [item.key]: open }))
                  }
                />
              );
            }

            const isActive = matchesGroupPath(pathname, item.href);
            return (
              <NavLink
                key={item.key}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={isActive}
                collapsed={sidebarCollapsed}
              />
            );
          })}
        </nav>

        <Separator />

        <div
          className={cn(
            'mt-auto',
            sidebarCollapsed ? 'p-3 flex justify-center' : 'p-6',
          )}
        >
          <div
            className={cn(
              'flex items-center rounded-xl',
              sidebarCollapsed ? 'justify-center' : 'gap-2',
            )}
          >
            <Avatar size="sm" className="border border-border">
              <AvatarFallback className="text-[10px] font-black">
                {initials || 'U'}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{t('layout.actions.logout')}</TooltipContent>
              </Tooltip>
            )}
            {sidebarCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{t('layout.actions.logout')}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-10">
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
