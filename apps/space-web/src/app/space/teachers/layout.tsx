import React from 'react';
import { SocialShell } from '@/components/SocialShell';

export default function TeachersLayout({ children }: { children: React.ReactNode }) {
  return <SocialShell>{children}</SocialShell>;
}
