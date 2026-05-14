'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@shared/components/ui/card';
import { BookOpen, Users, Clock, Award, Loader2 } from 'lucide-react';
import { accountService } from '@/lib/api/account';

const stats = [
  { name: 'Total Courses', value: '12', icon: BookOpen, color: 'text-blue-600' },
  { name: 'Active Students', value: '450', icon: Users, color: 'text-green-600' },
  { name: 'Average Progress', value: '68%', icon: Clock, color: 'text-orange-600' },
  { name: 'Certificates Issued', value: '89', icon: Award, color: 'text-purple-600' },
];

export default function SpaceDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/space/login');
        return;
      }

      try {
        await accountService.getProfile();
        setLoading(false);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/space/login');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-slate-900" />
          <p className="text-slate-500 font-medium">Đang xác thực phiên làm việc...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back to your organization management panel.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{stat.name}</CardTitle>
              <stat.icon size={20} className={stat.color} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">New student enrolled in "Advanced Mathematics"</p>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Organization Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Storage Usage</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }} />
              </div>
              <div className="pt-4">
                <p className="text-xs text-slate-500">Your organization is currently on the Professional Plan.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
