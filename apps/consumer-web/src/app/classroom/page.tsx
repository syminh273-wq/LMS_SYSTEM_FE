'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { consumerApi, type Space } from '@/lib/api';
import { Button } from '@shared/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';

export default function ClassroomPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useRequireAuth();
  const [userName] = useState("Student");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSpaces = useCallback(async () => {
    try {
      const data = await consumerApi.spaces.mine();
      setSpaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách classroom.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      queueMicrotask(() => {
        void fetchSpaces();
      });
    }
  }, [fetchSpaces, isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <Image src="/logo.jpg" alt="LMS LOGO" width={100} height={35} className="h-8 w-auto object-contain" />
            <span className="text-xl font-medium text-gray-700">Classroom</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="cursor-pointer w-8 h-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-indigo-500 text-white text-sm">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  Cập nhật thông tin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/')}>
                  Trang chủ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  Dashboard
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <main className="p-8">
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Đang tải classroom...</p>
        ) : spaces.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="font-medium text-gray-900">Bạn chưa có classroom nào.</p>
            <p className="mt-1 text-sm text-gray-500">Tạo space trong trang quản trị để bắt đầu.</p>
            <Button className="mt-4" onClick={() => router.push('/admin')}>
              Mở quản trị
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {spaces.map((space, index) => (
              <div key={space.uid} className="flex flex-col overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md">
                <div className={`${getSpaceColor(index)} relative h-24 p-4`}>
                  <h3 className="truncate pr-8 text-xl font-bold text-white">{space.name}</h3>
                  <p className="text-sm text-white opacity-90">/{space.slug}</p>
                  <button className="absolute right-4 top-4 rounded-full p-1 text-white hover:bg-white/20">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
                <div className="min-h-[100px] flex-1 bg-white p-4">
                  <div className="relative -top-10 flex justify-end pr-2">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-300 text-2xl font-bold uppercase text-gray-600">
                      {space.name[0]}
                    </div>
                  </div>
                  <p className="-mt-8 line-clamp-2 text-sm text-gray-600">{space.description || 'Không có mô tả.'}</p>
                </div>
                <div className="flex justify-between gap-2 border-t border-gray-200 p-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${space.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {space.is_active ? 'active' : 'inactive'}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => router.push('/admin')}>
                    Quản lý
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function getSpaceColor(index: number) {
  const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-orange-500', 'bg-pink-600', 'bg-sky-600', 'bg-violet-600'];
  return colors[index % colors.length];
}
