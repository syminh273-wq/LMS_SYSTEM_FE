'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setProfile } from '@/lib/redux/userSlice';
import { accountService } from '@/lib/api/account';

function SpaceAuthCallbackContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  useEffect(() => {
    const access = searchParams.get('access');
    const refresh = searchParams.get('refresh');
    const error = searchParams.get('error');

    if (error) {
      const messages: Record<string, string> = {
        space_not_found: 'Tài khoản Space chưa tồn tại. Vui lòng đăng ký trước.',
        account_disabled: 'Tài khoản đã bị vô hiệu hóa.',
        google_auth_failed: 'Đăng nhập Google thất bại.',
        google_token_failed: 'Không thể xác thực token Google.',
        google_token_invalid: 'Token Google không hợp lệ.',
      };
      const msg = messages[error] || 'Đăng nhập thất bại.';
      router.push(`/space/login?error=${encodeURIComponent(msg)}`);
      return;
    }

    if (!access || !refresh) {
      router.push('/space/login');
      return;
    }

    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('userType', 'space');

    accountService
      .getProfile()
      .then((profile) => {
        dispatch(setProfile(profile));
        router.push('/space');
      })
      .catch(() => {
        router.push('/space');
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-transparent mx-auto" />
        <p className="text-slate-500 text-sm">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}

export default function SpaceAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-transparent" />
        </div>
      }
    >
      <SpaceAuthCallbackContent />
    </Suspense>
  );
}
