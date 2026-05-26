'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearProfile } from '@/lib/redux/userSlice';
import { Button } from '@shared/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  BookOpen,
  Sparkles,
  Search,
  Bell,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { ThemeToggle } from '@shared/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';

const navItems = [
  { name: 'Dashboard', href: '/space', icon: LayoutDashboard },
  { name: 'Classrooms', href: '/space/classrooms', icon: BookOpen },
  { name: 'Staff Management', href: '/space/staff', icon: Users },
  { name: 'Settings', href: '/space/settings', icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isAuthPage = pathname.includes('/space/login') || pathname.includes('/space/register');

  const handleLogout = () => {
    dispatch(clearProfile());
    router.push('/space/login');
  };

  if (isAuthPage) {
    return <div className="min-h-screen bg-slate-50 dark:bg-background">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-[#f8faff] dark:bg-background">
      {/* Sidebar */}
      <aside className={`bg-[#2D283E] text-white flex flex-col shadow-xl transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-72'}`}>
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center gap-3 pt-6 pb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles size={22} className="text-white fill-white" />
            </div>
            <button
              onClick={() => setSidebarCollapsed(false)}
              title="Mở rộng menu"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        ) : (
          <div className="p-6 pb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles size={22} className="text-white fill-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-1.5">
                  Space <span className="font-medium opacity-90 text-slate-100">Admin</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.2em] mt-0.5">LMS Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarCollapsed(true)}
              title="Thu nhỏ menu"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors mt-1"
            >
              <ChevronsLeft size={16} />
            </button>
          </div>
        )}

        <nav className={`flex-1 space-y-1.5 mt-2 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={sidebarCollapsed ? item.name : undefined}
                className={`flex items-center rounded-xl transition-all duration-200 group ${
                  sidebarCollapsed ? 'justify-center py-3 px-2' : 'gap-3 px-4 py-3'
                } ${
                  isActive
                    ? 'bg-[#3b3254] text-white shadow-lg shadow-black/10'
                    : 'text-slate-400 hover:bg-[#3b3254]/50 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} />
                {!sidebarCollapsed && <span className="text-sm font-semibold tracking-wide">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`mt-auto border-t border-slate-700/50 ${sidebarCollapsed ? 'p-3 flex justify-center' : 'p-6'}`}>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all ${
              sidebarCollapsed ? 'w-10 h-10 p-0 justify-center' : 'w-full justify-start gap-3'
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-semibold tracking-wide">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white dark:bg-card border-b border-slate-100 dark:border-border flex items-center justify-between px-10">
          <div className="flex items-center gap-6 flex-1">
            {pathname.includes('/classrooms/') ? (
              <div className="relative w-96 max-w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-muted border border-slate-100 dark:border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-muted/80 dark:text-foreground dark:placeholder:text-muted-foreground transition-all"
                  placeholder="Tìm kiếm tài liệu, lớp học..."
                />
              </div>
            ) : (
              <h2 className="text-lg font-bold text-foreground uppercase tracking-widest">
                {navItems.find(i => pathname.startsWith(i.href))?.name || 'Space Admin'}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-8">
            <ThemeToggle />

            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-card"></span>
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-foreground leading-none">Admin User</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-wider">System Admin</p>
              </div>
              <Avatar className="h-10 w-10 border-2 border-muted shadow-sm">
                <AvatarImage src="https://github.com/shadcn.png" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
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
