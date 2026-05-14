'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@shared/components/ui/button';
import { Providers } from "@/components/Providers";
import "./globals.css";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  BookOpen,
  UserCircle
} from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.includes('/space/login') || pathname.includes('/space/register');

  const navItems = [
    { name: 'Dashboard', href: '/space', icon: LayoutDashboard },
    { name: 'Classrooms', href: '/space/classrooms', icon: BookOpen },
    { name: 'Staff Management', href: '/space/staff', icon: Users },
    { name: 'Settings', href: '/space/settings', icon: Settings },
  ];

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          {isAuthPage ? (
            <div className="min-h-screen bg-slate-50">{children}</div>
          ) : (
            <div className="flex h-screen bg-slate-50">
              {/* Sidebar */}
              <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6">
                  <h1 className="text-xl font-bold tracking-tight">Space Admin</h1>
                  <p className="text-xs text-slate-400 mt-1">LMS Organization Panel</p>
                </div>
                
                <nav className="flex-1 px-4 space-y-1 mt-4">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive 
                            ? 'bg-blue-600 text-white' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <item.icon size={18} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800">
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                  </Button>
                </div>
              </aside>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-slate-800 uppercase tracking-wider">
                      {navItems.find(i => i.href === pathname)?.name || 'Space Admin'}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <UserCircle size={20} />
                      <span className="font-medium">Admin User</span>
                    </div>
                  </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-8">
                  {children}
                </main>
              </div>
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}
