'use client';

import * as React from 'react';
import { Footer } from './Footer';

interface MasterLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function MasterLayout({ header, children, footer }: MasterLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFF] dark:bg-background transition-colors duration-300">
      {header}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {footer}
    </div>
  );
}

export function MasterHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <header className={`sticky top-0 z-50 h-16 bg-white dark:bg-card border-b border-gray-100 dark:border-border px-6 flex items-center justify-between transition-colors duration-300 ${className}`}>
      {children}
    </header>
  );
}

export function MasterBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex-1 flex flex-col ${className}`}>
      {children}
    </div>
  );
}
