import { useMemo } from 'react';
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
import { useSelector } from 'react-redux';
import { clearProfile } from '@/lib/redux/userSlice';
import { RootState, useAppDispatch } from '@/lib/redux/store';
import {
  LogOut,
  Sparkles,
  UserCircle,
} from 'lucide-react';

export function SpaceProfileDropdown() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const account = useSelector((s: RootState) => s.user.profile);
  const workspace = useSelector((s: RootState) => s.socialProfile.profile);

  const profile = useMemo(() => {
    if (!account) return null;
    return {
      full_name: account.full_name || account.username || 'Admin',
      email: account.email || '',
      avatar_url: workspace?.avatar_url || account.avatar_url || '',
      username: account.username || '',
    };
  }, [account, workspace]);

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
