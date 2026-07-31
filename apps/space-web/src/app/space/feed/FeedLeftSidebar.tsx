import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@shared/components/ui/button';
import {
  User as UserIcon,
  Newspaper,
  MessageCircle,
  UserCheck,
  PenLine,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { ProfileHeaderInfo } from '@shared/components/address';
import { cn } from '@shared/lib/utils';

type Profile = {
  full_name: string;
  avatar_url: string;
  uid: string;
  email?: string;
  username?: string;
  created_at?: string;
};

type NavItem = {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
  badge?: number;
};

export function FeedLeftSidebar({ profile, followingCount = 0 }: { profile: Profile; followingCount?: number }) {
  const pathname = usePathname();
  const initials = (profile.full_name || '?').slice(0, 2).toUpperCase();

  const NAV_ITEMS: NavItem[] = [
    { label: 'Trang cá nhân', icon: UserIcon,      path: '/space/me' },
    { label: 'Bảng tin',      icon: Newspaper,     path: '/space/feed' },
    { label: 'Tin nhắn',      icon: MessageCircle, path: '/space/messages' },
    { label: 'Đang theo dõi', icon: UserCheck,     path: '/space/following', badge: followingCount },
  ];

  return (
    <aside className="space-y-4 lg:col-start-1 lg:sticky lg:top-20 lg:self-start">
      <div className="bg-white border border-slate-200 rounded-xl p-5 card-elevated">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-4 ring-white shadow-sm">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <h2 className="mt-3 text-[15px] font-bold text-slate-900 truncate max-w-full">
            {profile.full_name}
          </h2>
          {profile.email && (
            <p className="text-[12px] text-slate-500 truncate max-w-full mt-0.5">
              {profile.email}
            </p>
          )}
        </div>
        <ProfileHeaderInfo uid={profile.uid} createdAt={profile.created_at} isOwner />
      </div>

      <nav className="bg-white border border-slate-200 rounded-xl p-2 card-elevated">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ label, icon: Icon, path, badge }) => {
            const active = pathname === path || (path === '/space/feed' && pathname?.startsWith('/space/feed'));
            return (
              <li key={path}>
                <Button
                  asChild
                  variant="ghost"
                  data-active={active}
                  className="w-full justify-start gap-3 px-3 py-2.5 h-auto rounded-lg text-[13.5px] font-medium text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
                >
                  <Link href={path} aria-current={active ? 'page' : undefined}>
                    <span
                      data-active={active}
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground',
                        'data-[active=true]:text-foreground data-[active=true]:font-semibold',
                      )}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="flex-1 truncate text-left">{label}</span>
                    {typeof badge === 'number' && badge > 0 && (
                      <span
                        data-active={active}
                        className={cn(
                          'shrink-0 rounded-md bg-card px-1.5 py-0.5 text-[11px] font-bold text-foreground min-w-[22px] text-center border border-border',
                          'data-[active=true]:text-foreground data-[active=true]:font-semibold',
                        )}
                      >
                        {badge > 999 ? '999+' : badge}
                      </span>
                    )}
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <Button
        asChild
        variant="outline"
        className="w-full h-11 gap-2 rounded-xl text-[13.5px] font-semibold card-elevated"
      >
        <Link href="/space/me">
          <PenLine size={14} />
          Chỉnh sửa hồ sơ
        </Link>
      </Button>
    </aside>
  );
}
