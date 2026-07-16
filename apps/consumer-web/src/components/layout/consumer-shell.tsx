'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { clearProfile } from '@/lib/redux/userSlice';
import type { RootState } from '@/lib/redux/store';
import { setBrandColors } from '@shared/lib/redux/themeSlice';
import { 
  Bell, 
  Search, 
  HelpCircle, 
  LogOut, 
  User, 
  BookOpen, 
  LayoutDashboard,
  Settings,
  ChevronDown,
  Award,
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

interface ConsumerShellProps {
  children: React.ReactNode;
}

const navItems = [
  { name: 'Dashboard', href: '/consumer/dashboard', icon: LayoutDashboard },
  { name: 'Classroom', href: '/consumer/classroom', icon: BookOpen },
  { name: 'My Certificates', href: '/consumer/certificate', icon: Award },
  { name: 'Calendar', href: '/consumer/calendar', icon: null },
  { name: 'Grades', href: '/consumer/grades', icon: null },
];

export function ConsumerShell({ children }: ConsumerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [mounted, setMounted] = React.useState(false);
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const brandColors = useSelector((state: RootState) => state.theme.brand);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
          <div className="flex items-center gap-8">
            <Link href="/consumer/dashboard" className="flex items-center shrink-0 cursor-pointer">
              <LmsLogo
                height={36}
                width="auto"
                primaryColor={mounted ? brandColors.primaryColor : '#4f46e5'}
                accentColor={mounted ? brandColors.accentColor : '#00b4d8'}
                goldColor={mounted ? brandColors.goldColor : '#d4a843'}
                className="h-9 w-auto object-contain"
              />
            </Link>

            <div className="h-6 w-px bg-gray-200 dark:bg-border" />

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-semibold transition-colors relative py-5 ${
                      isActive
                        ? 'text-[#1a3a7a] dark:text-[#93c5fd] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#1a3a7a] dark:after:bg-[#93c5fd]'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    } cursor-pointer`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center relative mr-2">
              <Search className="absolute left-3 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-gray-100 dark:bg-muted/50 border-none rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-muted rounded-full transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-card" />
              </button>
              <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-muted rounded-full transition-colors">
                <HelpCircle size={20} />
              </button>
            </div>

            <div className="h-8 w-px bg-gray-100 dark:bg-border mx-2" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none ml-2 cursor-pointer">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800 shadow-md ring-1 ring-gray-100 dark:ring-border transition-transform group-hover:scale-105">
                      <AvatarImage src={mounted ? (userProfile?.avatar_url || '') : ''} alt={displayName} />
                      <AvatarFallback className="bg-[#4F46E5] text-white text-xs font-bold uppercase">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-card rounded-full shadow-sm" />
                  </div>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-72 rounded-[24px] shadow-2xl border border-gray-100/50 bg-white/95 dark:bg-card/95 backdrop-blur-xl p-2"
              >
                <div className="px-4 py-4 mb-2 bg-gray-50/50 dark:bg-muted/30 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-sm">
                      <AvatarImage src={mounted ? (userProfile?.avatar_url || '') : ''} alt={displayName} />
                      <AvatarFallback className="bg-[#4F46E5] text-white text-sm font-bold uppercase">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-gray-900 dark:text-white truncate leading-none mb-1">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {mounted ? (userProfile?.email || 'Student account') : ''}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {[
                    { label: 'My Profile', Icon: User, path: '/consumer/profile' },
                    { label: 'My Classrooms', Icon: BookOpen, path: '/consumer/classroom' },
                    { label: 'Dashboard', Icon: LayoutDashboard, path: '/consumer/dashboard' },
                    { label: 'Settings', Icon: Settings, path: '/consumer/settings' },
                  ].map(({ label, Icon, path }) => (
                    <button
                      key={path}
                      onClick={() => router.push(path)}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left hover:bg-[#4F46E5]/5 dark:hover:bg-[#4F46E5]/10 transition-all group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-muted flex items-center justify-center group-hover:bg-[#4F46E5]/10 transition-colors">
                        <Icon size={18} className="text-gray-500 group-hover:text-[#4F46E5] transition-colors" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="h-px bg-gray-100/50 dark:bg-border/30 my-2 mx-2" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50/50 dark:bg-red-900/5 flex items-center justify-center group-hover:bg-red-100/50 transition-colors">
                    <LogOut size={18} className="text-red-400 group-hover:text-red-500" />
                  </div>
                  <span className="text-sm font-semibold text-red-500 group-hover:text-red-600">
                    Logout
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
