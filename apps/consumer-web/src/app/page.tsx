'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { clearProfile } from "@/lib/redux/userSlice";
import Image from "next/image";
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

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { profile, isAuthenticated } = useSelector((state: RootState) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, mounted]);

  if (!mounted || !isAuthenticated || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleLogout = () => {
    dispatch(clearProfile());
    router.push('/login');
  };

  const userName = profile.full_name || profile.username || "User";

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <nav className="w-full bg-white dark:bg-black border-b border-gray-100 p-4 flex justify-between items-center px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <Image src="/logo.jpg" alt="LMS LOGO" width={120} height={40} className="h-10 w-auto object-contain" />
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="cursor-pointer">
                <AvatarImage src={profile.avatar_url} alt={userName} />
                <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  Cập nhật thông tin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  Quản trị
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/classroom')}>
                  Classroom
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <main className="flex flex-col flex-1 items-center justify-center py-12 px-6 text-center">
        <div className="max-w-4xl w-full space-y-12">
          <div className="space-y-4">
            <Image
              className="mx-auto dark:invert mb-8"
              src="/next.svg"
              alt="Next.js logo"
              width={140}
              height={30}
              priority
            />
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Welcome back, {userName}!
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Hệ thống quản lý học tập tập trung cho mọi nhu cầu của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            <button 
              onClick={() => router.push('/classroom')}
              className="group p-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl hover:border-indigo-600 hover:shadow-2xl transition-all text-left"
            >
              <div className="text-5xl mb-6">🏫</div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-indigo-600 transition-colors">Lớp học</h3>
              <p className="text-gray-500 text-base leading-relaxed">
                Truy cập các khóa học đã đăng ký và tham gia các buổi học trực tuyến.
              </p>
            </button>

            <button 
              onClick={() => router.push('/dashboard')}
              className="group p-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl hover:border-indigo-600 hover:shadow-2xl transition-all text-left"
            >
              <div className="text-5xl mb-6">📊</div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-indigo-600 transition-colors">Bảng điều khiển</h3>
              <p className="text-gray-500 text-base leading-relaxed">
                Theo dõi tiến độ học tập, xem điểm số và cập nhật kết quả học tập mới nhất.
              </p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
