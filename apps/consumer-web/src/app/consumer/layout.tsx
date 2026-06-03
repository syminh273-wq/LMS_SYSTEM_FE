'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

const ConsumerShell = dynamic(() => import("@/components/layout/consumer-shell").then(mod => mod.ConsumerShell), {
  ssr: true,
  loading: () => <div className="min-h-screen bg-[#F8FAFF]" />
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ConsumerShell>{children}</ConsumerShell>;
}
