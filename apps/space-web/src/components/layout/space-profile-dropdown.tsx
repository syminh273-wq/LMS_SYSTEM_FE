import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { clearProfile } from '@/lib/redux/userSlice';
import type { RootState } from '@/lib/redux/store';
import { communityApi, type WorkspaceProfile } from '@/lib/api/community';
import { accountService, type UserProfile } from '@/lib/api/account';
import {
  LogOut,
  Sparkles,
  UserCircle,
} from 'lucide-react';

type ProfileData = {
  full_name: string;
  email: string;
  avatar_url: string;
  username: string;
};

export function SpaceProfileDropdown() {
  const router = useRouter();
  const dispatch = useDispatch();
  const reduxProfile = useSelector((s: RootState) => s.user.profile);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let mounted = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const load = async () => {
      try {
        const [account, workspace] = await Promise.all([
          accountService.getProfile().catch(() => null as UserProfile | null),
          communityApi.getMyProfile().catch(() => null as WorkspaceProfile | null),
        ]);
        if (!mounted) return;
        const mergedAvatar =
          workspace?.avatar_url ||
          account?.avatar_url ||
          reduxProfile?.avatar_url ||
          '';
        setProfile({
          full_name: account?.full_name || account?.username || 'Admin',
          email: account?.email || '',
          avatar_url: mergedAvatar,
          username: account?.username || '',
        });
      } catch {}
    };

    load();

    const onProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ avatar_url?: string }>).detail;
      if (detail?.avatar_url) {
        setProfile((prev) => (prev ? { ...prev, avatar_url: detail.avatar_url! } : prev));
      } else {
        load();
      }
    };
    window.addEventListener('space:profile-updated', onProfileUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('space:profile-updated', onProfileUpdated);
    };
  }, [reduxProfile?.avatar_url]);

  const handleLogout = () => {
    dispatch(clearProfile());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/space/login');
  };

  const goToProfile = () => {
    router.push('/space/me');
  };

  const displayName = profile?.full_name || profile?.username || 'Admin';
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = profile?.email || 'Space Admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Mở menu tài khoản"
        onClick={(e) => e.stopPropagation()}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Avatar>
          {profile?.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={displayName} />
          ) : null}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-black">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={10} className="w-60">
        <DropdownMenuLabel className="flex items-center gap-3 p-2">
          <Avatar className="h-10 w-10 shrink-0">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-black">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-foreground">{displayName}</span>
            <span className="block truncate text-xs text-muted-foreground">{email}</span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={goToProfile}>
          <UserCircle />
          Trang cá nhân
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push('/space/feed')}>
          <Sparkles />
          Social Feed
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
