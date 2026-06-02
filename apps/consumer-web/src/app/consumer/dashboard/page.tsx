'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import Image from 'next/image';
import { accountService } from '@/lib/api/account';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { ConsumerProfileDropdown } from '@/components/layout/consumer-profile-dropdown';

const MOCK_GRADES = [
  { course: 'Web Development 101', assignment: 'Final Project', score: 95, total: 100, date: '2024-05-10', color: 'bg-[#4F46E5]' },
  { course: 'Advanced React Patterns', assignment: 'Midterm Exam', score: 88, total: 100, date: '2024-05-08', color: 'bg-[#4F46E5]' },
  { course: 'Data Structures & Algorithms', assignment: 'Homework #4', score: 42, total: 50, date: '2024-05-05', color: 'bg-red-500' },
  { course: 'UI/UX Design Systems', assignment: 'Design Audit', score: 10, total: 10, date: '2024-05-01', color: 'bg-[#4F46E5]' },
];

const MOCK_STATS = [
  { label: 'GPA', value: '3.8', icon: '🎓', color: 'bg-indigo-50 text-indigo-600', subLabel: 'Academic Performance' },
  { label: 'Courses', value: '4', icon: '📚', color: 'bg-emerald-50 text-emerald-600', subLabel: 'Active Enrolled' },
  { label: 'Assignments', value: '12', icon: '📝', color: 'bg-violet-50 text-violet-600', subLabel: 'Tasks to Complete' },
  { label: 'Attendance', value: '98%', icon: '⏰', color: 'bg-rose-50 text-rose-600', subLabel: 'Session Presence' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<{ full_name: string; email: string; avatar_url: string; username: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/consumer/login');
      return;
    }
    setIsAuthenticated(true);
    accountService.getProfile()
      .then(p => setUserProfile({ full_name: p.full_name, email: p.email, avatar_url: p.avatar_url, username: p.username }))
      .catch(() => {});
  }, [router]);

  const displayName = userProfile?.full_name || userProfile?.username || 'User';

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="p-10 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Welcome back, {displayName.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">
              You have <span className="text-[#4F46E5] font-bold">2 assignments</span> due this week. Stay focused!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/consumer/classroom')}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-[#4F46E5]/20 active:scale-[0.98]"
            >
              <BookOpen size={18} />
              Enter Classroom
            </button>
            <ConsumerProfileDropdown />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_STATS.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-card p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border flex items-center gap-5 transition-transform hover:scale-[1.02]">
              <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center text-2xl shadow-sm`}>
                {stat.icon}
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{stat.label}</p>
                </div>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-1 leading-none">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Grades Table */}
        <Card className="rounded-[32px] border-gray-100 dark:border-border shadow-sm overflow-hidden bg-white dark:bg-card">
          <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b border-gray-50 dark:border-border/50 mb-4">
            <CardTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Recent Grades</CardTitle>
            <button className="text-[10px] font-black text-[#4F46E5] uppercase tracking-widest hover:underline">View All Report</button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Course</th>
                    <th className="px-8 py-4">Assignment</th>
                    <th className="px-8 py-4">Score</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-border/50">
                  {MOCK_GRADES.map((grade, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-muted/50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-bold text-gray-900 dark:text-white">{grade.course}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-gray-500 font-medium">{grade.assignment}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-baseline">
                          <span className={`text-lg font-black ${grade.score < 50 ? 'text-red-500' : 'text-[#4F46E5]'}`}>{grade.score}</span>
                          <span className="text-gray-300 dark:text-gray-600 font-bold text-xs ml-1">/ {grade.total}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-gray-400 font-bold">{grade.date}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end">
                          <div className="w-32 bg-gray-100 dark:bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`${grade.color} h-full rounded-full transition-all duration-1000`}
                              style={{ width: `${(grade.score / grade.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charts Mockup Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[32px] border-gray-100 dark:border-border p-8 bg-white dark:bg-card">
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-1">Performance Over Time</h3>
            <p className="text-xs text-gray-400 font-medium mb-8 uppercase tracking-widest">Semester cumulative grade average</p>
            <div className="h-64 flex flex-col items-center justify-center text-gray-300 gap-4">
              <div className="flex items-end gap-2 h-32">
                {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                  <div key={i} className="w-8 bg-[#4F46E5]/10 group relative">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-[#4F46E5] opacity-80 group-hover:opacity-100 transition-all rounded-t-sm" 
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">Performance visualization would go here</p>
            </div>
          </Card>
          
          <Card className="rounded-[32px] border-gray-100 dark:border-border p-8 bg-white dark:bg-card">
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-1">Course Distribution</h3>
            <p className="text-xs text-gray-400 font-medium mb-8 uppercase tracking-widest">Time allocation per subject</p>
            <div className="h-64 flex flex-col items-center justify-center text-gray-300 gap-4">
               <div className="w-32 h-32 rounded-full border-[12px] border-gray-100 relative">
                  <div className="absolute inset-0 border-[12px] border-[#4F46E5] border-t-transparent border-r-transparent rounded-full rotate-45" />
               </div>
               <p className="text-xs font-bold uppercase tracking-widest">Course distribution would go here</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
