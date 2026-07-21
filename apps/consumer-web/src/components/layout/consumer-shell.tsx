'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { clearProfile } from '@/lib/redux/userSlice';
import type { RootState } from '@/lib/redux/store';
import {
  Bell,
  BellRing,
  Check,
  Search,
  HelpCircle,
  LogOut,
  User,
  BookOpen,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Award,
  Calendar as CalendarIcon,
  GraduationCap,
  Sparkles,
  Inbox,
  Compass,
  Heart,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { ThemeToggle } from "@shared/components/ThemeToggle";
import { MasterLayout, MasterHeader, MasterBody } from "@shared/components/layout/MasterLayout";
import { LmsLogo } from "@shared/components/LmsLogo";
import { cn } from '@shared/lib/utils';
import { useNotifications } from '@/lib/hooks/use-notifications';
import type { NotificationItem, NotificationMetadata } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { Button } from '@shared/components/ui/button';
import { consumerQuizCollectionApi } from '@/lib/api/quiz-collection';

const SEEN_CERT_KEY = 'seen_cert_uids';

function useUnseenCertificateCount(userId: string | null | undefined): number {
  const [count, setCount] = React.useState(0);
  const pathname = usePathname();

  React.useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const list = await consumerQuizCollectionApi.myCertificates();
        if (cancelled) return;
        const stored = (() => {
          try {
            return JSON.parse(localStorage.getItem(SEEN_CERT_KEY) || '[]') as string[];
          } catch {
            return [];
          }
        })();
        const seen = new Set(stored);
        setCount(list.filter(c => !seen.has(c.uid)).length);
      } catch {
        if (!cancelled) setCount(0);
      }
    };
    void load();

    const handler = () => void load();
    window.addEventListener('storage', handler);
    window.addEventListener('lms:certs-seen', handler);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', handler);
      window.removeEventListener('lms:certs-seen', handler);
    };
  }, [userId, pathname]);

  return count;
}

interface ConsumerShellProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/consumer/dashboard', icon: LayoutDashboard },
  { name: 'Khám phá', href: '/consumer/discover', icon: Compass },
  { name: 'Yêu thích', href: '/consumer/classroom/favorites', icon: Heart },
  { name: 'Classroom', href: '/consumer/classroom', icon: BookOpen },
  { name: 'My Courses', href: '/consumer/course', icon: GraduationCap },
  { name: 'Feed', href: '/consumer/feed', icon: Sparkles },
  { name: 'Calendar', href: '/consumer/calendar', icon: CalendarIcon },
  { name: 'Grades', href: '/consumer/grades', icon: GraduationCap },
  { name: 'Certificates', href: '/consumer/certificate', icon: Award },
];

function parseNotificationMetadata(raw: string | NotificationMetadata | undefined | null): NotificationMetadata {
  if (!raw) return {};
  if (typeof raw !== 'string') return raw as NotificationMetadata;
  try {
    return (JSON.parse(raw) as NotificationMetadata) ?? {};
  } catch {
    return {};
  }
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

function NotificationBell({ userId }: { userId: string | null | undefined }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { items, unreadCount, markRead, markAllRead } = useNotifications({ userId });

  const handleClickItem = (item: NotificationItem) => {
    void markRead(item.uid);
    const meta = parseNotificationMetadata(item.metadata);
    if (meta.classroom_uid) {
      setOpen(false);
      router.push(`/consumer/classroom/${meta.classroom_uid}`);
    }
  };

  const list = items.slice(0, 10);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative z-[100] inline-flex items-center justify-center w-9 h-9 text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors dark:text-white dark:bg-slate-800 dark:hover:bg-slate-700 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
          aria-label="Notifications"
        >
          {unreadCount > 0 ? <BellRing size={18} strokeWidth={2.2} /> : <Bell size={18} strokeWidth={2.2} />}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="z-[100] w-[360px] p-0 overflow-hidden bg-white border border-slate-200 shadow-xl opacity-100 dark:bg-slate-900 dark:border-slate-700"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Thông báo</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Đã đọc tất cả'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void markAllRead()}
              className="h-7 px-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            >
              <Check size={12} className="mr-1" />
              Đọc tất cả
            </Button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
              <Inbox size={32} className="opacity-50" />
              <p className="text-[12px] font-medium">Chưa có thông báo nào</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((item, idx) => {
                const meta = parseNotificationMetadata(item.metadata);
                const hasLink = !!meta.classroom_uid;
                return (
                  <li key={item.uid ?? `notification-${idx}`}>
                    <button
                      onClick={() => handleClickItem(item)}
                      className={cn(
                        "w-full text-left px-4 py-3 transition-colors flex items-start gap-3",
                        item.is_read
                          ? "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          : "bg-indigo-50/60 hover:bg-indigo-50 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/15",
                      )}
                    >
                      <div
                        className={cn(
                          "shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5",
                          item.notify_type === 'classroom_approved'
                            ? "bg-emerald-500 text-white"
                            : item.notify_type === 'classroom_rejected'
                              ? "bg-rose-500 text-white"
                              : "bg-indigo-500 text-white",
                        )}
                      >
                        <Bell size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={cn(
                              "text-[13px] truncate",
                              item.is_read
                                ? "font-semibold text-slate-700 dark:text-slate-300"
                                : "font-bold text-slate-900 dark:text-white",
                            )}
                          >
                            {item.title}
                          </p>
                          {!item.is_read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-[12px] line-clamp-2 mt-0.5",
                            item.is_read
                              ? "text-slate-600 dark:text-slate-400"
                              : "text-slate-800 dark:text-slate-200",
                          )}
                        >
                          {item.content}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1 font-medium">
                          {relativeTime(item.created_at)}
                          {hasLink && (
                            <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-semibold">· Xem lớp →</span>
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ConsumerShell({ children }: ConsumerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [mounted, setMounted] = React.useState(false);
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const unseenCertCount = useUnseenCertificateCount(mounted ? userProfile?.uid : null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (pathname === '/consumer/certificate' && userProfile?.uid) {
      consumerQuizCollectionApi.myCertificates()
        .then(list => {
          if (list.length === 0) return;
          try {
            const stored = JSON.parse(localStorage.getItem(SEEN_CERT_KEY) || '[]') as string[];
            const merged = Array.from(new Set([...stored, ...list.map(c => c.uid)]));
            localStorage.setItem(SEEN_CERT_KEY, JSON.stringify(merged));
            window.dispatchEvent(new Event('lms:certs-seen'));
          } catch {
            /* ignore */
          }
        })
        .catch(() => {});
    }
  }, [pathname, userProfile?.uid]);

  const handleLogout = () => {
    dispatch(clearProfile());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/consumer/login');
  };

  const displayName = mounted ? (userProfile?.full_name || userProfile?.username || 'User') : 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const isLoginPage =
    pathname === '/consumer/login' ||
    pathname === '/login' ||
    pathname === '/consumer/register' ||
    pathname === '/register' ||
    pathname.startsWith('/consumer/forgot-password') ||
    pathname.startsWith('/consumer/verify-otp') ||
    pathname.startsWith('/consumer/reset-password');

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  if (isLoginPage) {
    return (
      <MasterLayout footer={null}>
        <MasterBody>
          {children}
        </MasterBody>
      </MasterLayout>
    );
  }

  return (
    <MasterLayout
      header={
        <MasterHeader>
          <div className="flex items-center gap-4 lg:gap-6 min-w-0">
            <Link
              href="/consumer/dashboard"
              className="flex items-center shrink-0 cursor-pointer"
              aria-label="Go to dashboard"
            >
              <LmsLogo
                height={32}
                width="auto"
                className="h-8 w-auto object-contain"
              />
            </Link>

            <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-slate-700" />

            <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const showCertDot = item.href === '/consumer/certificate' && unseenCertCount > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon size={15} strokeWidth={2.2} />
                    <span className="whitespace-nowrap">{item.name}</span>
                    {showCertDot && (
                      <span
                        className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
                        aria-label={`${unseenCertCount} new certificate(s)`}
                      >
                        {unseenCertCount > 9 ? '9+' : unseenCertCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
              aria-label="Search"
            >
              <Search size={15} strokeWidth={2.2} />
              <span className="hidden lg:inline">Tìm kiếm</span>
            </button>

            <button
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={2} />
            </button>

            <div className="flex items-center">
              <ThemeToggle />
              <NotificationBell userId={mounted ? userProfile?.uid : null} />
              <button
                className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                aria-label="Help"
              >
                <HelpCircle size={17} strokeWidth={2} />
              </button>
            </div>

            <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors outline-none dark:hover:bg-slate-800"
                  aria-label="Open user menu"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={mounted ? (userProfile?.avatar_url || '') : ''} alt={displayName} />
                      <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                  </div>
                  <div className="hidden xl:flex flex-col items-start leading-none">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-[120px] truncate">
                      {displayName}
                    </span>
                  </div>
                  <ChevronDown size={13} className="text-slate-400 hidden xl:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-[280px] rounded-xl shadow-xl border border-slate-200 bg-white p-1.5 animate-fade-down dark:bg-slate-900 dark:border-slate-700"
              >
                <div className="px-3 py-3 mb-1 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={mounted ? (userProfile?.avatar_url || '') : ''} alt={displayName} />
                      <AvatarFallback className="bg-indigo-600 text-white text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {mounted ? (userProfile?.email || 'student@edusphere.vn') : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  {[
                    { label: 'Trang cá nhân', Icon: User, path: '/consumer/profile' },
                    { label: 'Dashboard', Icon: LayoutDashboard, path: '/consumer/dashboard' },
                    { label: 'Lớp học của tôi', Icon: BookOpen, path: '/consumer/classroom' },
                    { label: 'Cài đặt', Icon: Settings, path: '/consumer/settings' },
                  ].map(({ label, Icon, path }) => (
                    <button
                      key={path}
                      onClick={() => router.push(path)}
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-slate-100 transition-colors group dark:hover:bg-slate-800"
                    >
                      <span className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors dark:bg-slate-800 dark:group-hover:bg-indigo-500/20">
                        <Icon size={14} className="text-slate-500 group-hover:text-indigo-600 transition-colors dark:text-slate-400 dark:group-hover:text-indigo-300" />
                      </span>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700 my-1.5 mx-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-rose-50 transition-colors group dark:hover:bg-rose-500/10"
                >
                  <span className="w-7 h-7 rounded-md bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center transition-colors dark:bg-rose-500/10 dark:group-hover:bg-rose-500/20">
                    <LogOut size={14} className="text-rose-600" />
                  </span>
                  <span className="text-sm font-medium text-rose-600 group-hover:text-rose-700 dark:text-rose-400">
                    Đăng xuất
                  </span>
                </button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </MasterHeader>
      }
    >
      <MasterBody>
        {children}
      </MasterBody>
    </MasterLayout>
  );
}
