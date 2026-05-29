'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setProfile } from '@/lib/redux/userSlice';
import { accountService } from '@/lib/api/account';

function AuthCallbackContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  useEffect(() => {
    const access = searchParams.get('access');
    const refresh = searchParams.get('refresh');
    const error = searchParams.get('error');

    if (error) {
      router.push(`/consumer/login?error=${error}`);
      return;
    }

    if (!access || !refresh) {
      router.push('/consumer/login');
      return;
    }

    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    accountService
      .getProfile()
      .then((profile) => {
        dispatch(setProfile(profile));
        router.push('/consumer/dashboard');
      })
      .catch(() => {
        router.push('/consumer/dashboard');
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
        <p className="text-gray-600 text-sm">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
