'use client';

import * as React from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { usePathname } from 'next/navigation';
import { store } from '@/lib/redux/store';
import { ThemeProvider } from '@shared/components/ThemeProvider';
import { LocaleProvider } from '@shared/components/LocaleProvider';
import { consumerWebBundles } from '@/lib/i18n/bundles';
import { FaceEnrollModal } from '@/components/face/face-enroll-modal';
import { setFaceEnrolled } from '@/lib/redux/userSlice';
import type { RootState } from '@/lib/redux/store';

const PUBLIC_PATHS = ['/login', '/auth/', '/join/', '/preview/'];

function FaceEnrollmentGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const faceEnrolled = useSelector((state: RootState) => state.user.faceEnrolled);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const dispatch = useDispatch();

  const isPublic = PUBLIC_PATHS.some(p => pathname?.includes(p));

  return (
    <>
      {children}
      {isAuthenticated && faceEnrolled === false && !isPublic && (
        <FaceEnrollModal
          onClose={() => {}}
          onEnrolled={() => dispatch(setFaceEnrolled(true))}
        />
      )}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider bundles={consumerWebBundles}>
      <ThemeProvider>
        <Provider store={store}>
          <FaceEnrollmentGuard>
            {children}
          </FaceEnrollmentGuard>
        </Provider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
