'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const ConsumerShell = dynamic(() => import("@/components/layout/consumer-shell").then(mod => mod.ConsumerShell), {
  ssr: true,
  loading: () => <div className="min-h-screen bg-[#F8FAFF]" />
});

const WORKSPACE_ROUTES = ['/consumer/feed', '/consumer/profile', '/consumer/messages'];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isWorkspaceRoute = WORKSPACE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
  if (isWorkspaceRoute) {
    return <>{children}</>;
  }
  return <ConsumerShell>{children}</ConsumerShell>;
}
