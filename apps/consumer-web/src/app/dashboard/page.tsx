'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearProfile } from '@/lib/redux/userSlice';
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

const MOCK_GRADES = [
  { course: 'Web Development 101', assignment: 'Final Project', score: 95, total: 100, date: '2024-05-10' },
  { course: 'Advanced React Patterns', assignment: 'Midterm Exam', score: 88, total: 100, date: '2024-05-08' },
  { course: 'Data Structures & Algorithms', assignment: 'Homework #4', score: 42, total: 50, date: '2024-05-05' },
  { course: 'UI/UX Design Systems', assignment: 'Design Audit', score: 10, total: 10, date: '2024-05-01' },
];

const MOCK_STATS = [
  { label: 'GPA', value: '3.8', icon: '🎓', color: 'text-blue-600' },
  { label: 'Courses', value: '4', icon: '📚', color: 'text-green-600' },
  { label: 'Assignments', value: '12', icon: '📝', color: 'text-purple-600' },
  { label: 'Attendance', value: '98%', icon: '⏰', color: 'text-orange-600' },
];

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isAuthenticated] = useState(
    () => typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken'))
  );
  const [userName] = useState("User");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    dispatch(clearProfile());
    router.push('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="cursor-pointer" onClick={() => router.push('/dashboard')}>
              <Image src="/logo.jpg" alt="LMS LOGO" width={120} height={40} className="h-12 w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Dashboard</h1>
              <p className="text-gray-600 text-sm">Welcome back, {userName}!</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/classroom')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Go to Classroom
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="cursor-pointer">
                  <AvatarImage src="" alt="User" />
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
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    Quản trị
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    Trang chủ
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_STATS.map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="text-4xl">{stat.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Grades Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Recent Grades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Assignment</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_GRADES.map((grade, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{grade.course}</td>
                    <td className="px-6 py-4 text-gray-600">{grade.assignment}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-indigo-600">{grade.score}</span>
                      <span className="text-gray-400"> / {grade.total}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{grade.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="w-24 bg-gray-200 rounded-full h-2 inline-block">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${(grade.score / grade.total) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Mockup Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="font-medium">Performance Over Time</p>
            <p className="text-sm">Chart visualization would go here</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <p className="font-medium">Course Distribution</p>
            <p className="text-sm">Chart visualization would go here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
