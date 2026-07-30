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
  Trophy,
  Calculator,
  History as HistoryIcon,
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

const primaryNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/consumer/dashboard', icon: LayoutDashboard },
  { name: 'Khám phá', href: '/consumer/discover', icon: Compass },
  { name: 'Classroom', href: '/consumer/classroom', icon: BookOpen },
  { name: 'Lịch sử', href: '/consumer/history', icon: HistoryIcon },
];

const utilityNavItems: NavItem[] = [
  { name: 'Yêu thích', href: '/consumer/classroom/favorites', icon: Heart },
  { name: 'Feed', href: '/consumer/feed', icon: Sparkles },
  { name: 'Lịch học', href: '/consumer/calendar', icon: CalendarIcon },
  { name: 'Bảng điểm', href: '/consumer/grades', icon: GraduationCap },
  { name: 'Xếp hạng', href: '/consumer/me', icon: Trophy },
  { name: 'Chứng chỉ', href: '/consumer/certificate', icon: Award },
  { name: 'Quy đổi điểm', href: '/consumer/grading', icon: Calculator },
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
        <Button
          variant="outline"
          size="icon"
          className="relative z-[9999]"
          aria-label="Notifications"
        >
          {unreadCount > 0 ? <BellRing size={18} strokeWidth={2.2} /> : <Bell size={18} strokeWidth={2.2} />}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="z-[9999] w-[360px] p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-[13px] font-bold text-foreground">Thông báo</h3>
            <p className="text-[11px] text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Đã đọc tất cả'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void markAllRead()}
              className="h-7 text-primary"
            >
              <Check size={12} className="mr-1" />
              Đọc tất cả
            </Button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
              <Inbox size={32} className="opacity-50" />
              <p className="text-[12px] font-medium">Chưa có thông báo nào</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((item, idx) => {
                const meta = parseNotificationMetadata(item.metadata);
                const hasLink = !!meta.classroom_uid;
                return (
                  <li key={item.uid ?? `notification-${idx}`}>
                    <Button
                      variant="ghost"
                      onClick={() => handleClickItem(item)}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-start gap-3",
                        !item.is_read && "bg-primary/10",
                      )}
                    >
                      <div
                        className={cn(
                          "shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5",
                          item.notify_type === 'classroom_approved'
                            ? "bg-success text-success-foreground"
                            : item.notify_type === 'classroom_rejected'
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-primary text-primary-foreground",
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
                                ? "font-semibold text-muted-foreground"
                                : "font-bold text-foreground",
                            )}
                          >
                            {item.title}
                          </p>
                          {!item.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-[12px] line-clamp-2 mt-0.5",
                            item.is_read
                              ? "text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {item.content}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                          {relativeTime(item.created_at)}
                          {hasLink && (
                            <span className="ml-2 text-primary font-semibold">· Xem lớp →</span>
                          )}
                        </p>
                      </div>
                    </Button>
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
                className="h-8 w-auto object-contain"
              />
            </Link>

            <div className="hidden lg:block h-6 w-px bg-border" />

            <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
              {primaryNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    data-active={active || undefined}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground border-b-2 border-transparent",
                      "data-[active=true]:border-primary data-[active=true]:text-foreground data-[active=true]:font-semibold",
                    )}
                  >
                    <Icon size={15} strokeWidth={2.2} />
                    <span className="whitespace-nowrap">{item.name}</span>
                  </Link>
                );
              })}

              {(() => {
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "relative flex items-center gap-2 outline-none text-muted-foreground",
                          "data-[state=open]:bg-muted data-[state=open]:text-foreground"
                        )}
                      >
                        <Sparkles size={15} strokeWidth={2.2} />
                        <span className="whitespace-nowrap">Tiện ích</span>
                        <ChevronDown size={13} className="opacity-70" />
                        {unseenCertCount > 0 && (
                          <span
                            className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-background"
                            aria-label={`${unseenCertCount} new certificate(s)`}
                          >
                            {unseenCertCount > 9 ? '9+' : unseenCertCount}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      className="w-[220px]"
                    >
                      {utilityNavItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        const showCertDot = item.href === '/consumer/certificate' && unseenCertCount > 0;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            data-active={active || undefined}
                            className={cn(
                              "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left text-foreground border-l-2 border-transparent",
                              "data-[active=true]:border-primary data-[active=true]:text-foreground data-[active=true]:font-semibold",
                            )}
                          >
                            <span className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                              <Icon size={14} className="text-muted-foreground" />
                            </span>
                            <span className="text-sm font-medium flex-1">{item.name}</span>
                            {showCertDot && (
                              <span
                                className="min-w-[18px] h-4 px-1 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center"
                                aria-label={`${unseenCertCount} new certificate(s)`}
                              >
                                {unseenCertCount > 9 ? '9+' : unseenCertCount}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="secondary"
              className="hidden md:flex items-center gap-2"
              aria-label="Search"
            >
              <Search size={15} strokeWidth={2.2} />
              <span className="hidden lg:inline">Tìm kiếm</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={2} />
            </Button>

            <div className="flex items-center">
              <ThemeToggle />
              <NotificationBell userId={mounted ? userProfile?.uid : null} />
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                aria-label="Help"
              >
                <HelpCircle size={17} strokeWidth={2} />
              </Button>
            </div>

            <div className="hidden sm:block h-6 w-px bg-border mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 outline-none"
                  aria-label="Open user menu"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={mounted ? (userProfile?.avatar_url || '') : ''} alt={displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
                  </div>
                  <div className="hidden xl:flex flex-col items-start leading-none">
                    <span className="text-sm font-semibold text-foreground max-w-[120px] truncate">
                      {displayName}
                    </span>
                  </div>
                  <ChevronDown size={13} className="text-muted-foreground hidden xl:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-[280px]"
              >
                <div className="px-3 py-3 mb-1 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={mounted ? (userProfile?.avatar_url || '') : ''} alt={displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
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
                    <Button
                      key={path}
                      variant="ghost"
                      onClick={() => router.push(path)}
                      className="w-full flex items-center gap-3 text-left group"
                    >
                      <span className="w-7 h-7 rounded-md bg-muted group-hover:bg-primary/15 flex items-center justify-center transition-colors">
                        <Icon size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </span>
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                        {label}
                      </span>
                    </Button>
                  ))}
                </div>

                <div className="h-px bg-border my-1.5 mx-1" />

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 text-left group"
                >
                  <span className="w-7 h-7 rounded-md bg-destructive/10 group-hover:bg-destructive/20 flex items-center justify-center transition-colors">
                    <LogOut size={14} className="text-destructive" />
                  </span>
                  <span className="text-sm font-medium text-destructive">
                    Đăng xuất
                  </span>
                </Button>
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
