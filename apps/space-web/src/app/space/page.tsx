'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@shared/components/ui/card';
import {
  BookOpen,
  Users,
  Award,
  Loader2,
  TrendingUp,
  UserPlus,
  FileCheck,
  GraduationCap,
  CheckCircle2,
  Clock,
  BarChart3,
  CalendarDays,
  File,
  ClipboardList,
  Video,
  UserX,
  Gamepad2,
  Timer,
} from 'lucide-react';
import { accountService } from '@/lib/api/account';
import { spaceApi } from '@/lib/api';
import type { ActivityLog, ActivityLogEventType } from '@/lib/api/types';

type DashboardStats = {
  totalClassrooms: number;
  totalStudents: number;
  activeClassrooms: number;
};

function getActivityMeta(eventType: ActivityLogEventType) {
  const map: Record<ActivityLogEventType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    classroom_created: { icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Lớp học mới được tạo' },
    document_uploaded: { icon: File,          color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Tải lên tài liệu' },
    document_deleted:  { icon: File,          color: 'text-red-500',    bg: 'bg-red-50',    label: 'Xóa tài liệu' },
    exam_created:      { icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Tạo bài kiểm tra' },
    exam_published:    { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50',  label: 'Phát hành bài kiểm tra' },
    exam_opened:       { icon: Timer,         color: 'text-emerald-600',bg: 'bg-emerald-50',label: 'Mở ca thi trực tuyến' },
    exam_closed:       { icon: Clock,         color: 'text-muted-foreground',  bg: 'bg-muted/50',  label: 'Đóng ca thi' },
    exam_deleted:      { icon: ClipboardList, color: 'text-red-500',    bg: 'bg-red-50',    label: 'Xóa bài kiểm tra' },
    quiz_assigned:     { icon: Gamepad2,      color: 'text-purple-600', bg: 'bg-purple-50', label: 'Giao đề trắc nghiệm' },
    meeting_started:   { icon: Video,         color: 'text-sky-600',    bg: 'bg-sky-50',    label: 'Mở buổi học trực tuyến' },
    meeting_ended:     { icon: Video,         color: 'text-muted-foreground',  bg: 'bg-muted/50',  label: 'Kết thúc buổi học' },
    member_joined:     { icon: UserPlus,      color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'Học sinh đăng ký' },
    member_approved:   { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50',  label: 'Duyệt học sinh vào lớp' },
    member_rejected:   { icon: UserX,         color: 'text-red-500',    bg: 'bg-red-50',    label: 'Từ chối yêu cầu' },
    member_kicked:     { icon: UserX,         color: 'text-red-500',    bg: 'bg-red-50',    label: 'Kick học sinh' },
    member_left:       { icon: Users,         color: 'text-muted-foreground',  bg: 'bg-muted/50',  label: 'Học sinh rời lớp' },
    exam_submitted:    { icon: FileCheck,     color: 'text-teal-600',   bg: 'bg-teal-50',   label: 'Học sinh nộp bài' },
  };
  return map[eventType] ?? { icon: ClipboardList, color: 'text-muted-foreground', bg: 'bg-muted/50', label: eventType };
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

const MOCK_WEEKLY = [
  { day: 'T2', enrolled: 12, submitted: 8 },
  { day: 'T3', enrolled: 7,  submitted: 14 },
  { day: 'T4', enrolled: 18, submitted: 11 },
  { day: 'T5', enrolled: 5,  submitted: 20 },
  { day: 'T6', enrolled: 22, submitted: 9 },
  { day: 'T7', enrolled: 14, submitted: 6 },
  { day: 'CN', enrolled: 3,  submitted: 2 },
];

const MAX_WEEKLY = 25;

const MOCK_TOP_CLASSES = [
  { name: 'Toán Nâng Cao K12',   students: 28, max: 30, progress: 82 },
  { name: 'Tiếng Anh IELTS',     students: 25, max: 30, progress: 71 },
  { name: 'Vật Lý 11A',          students: 30, max: 30, progress: 95 },
  { name: 'Hóa Học Hữu Cơ',      students: 19, max: 25, progress: 60 },
];

// ── Greeting helpers ─────────────────────────────────────────────────────────

const QUOTES = [
  { text: 'Giáo dục là vũ khí mạnh nhất bạn có thể dùng để thay đổi thế giới.', author: 'Nelson Mandela' },
  { text: 'Người thầy ảnh hưởng đến cõi đời đời, không ai biết được ảnh hưởng của họ dừng lại ở đâu.', author: 'Henry Adams' },
  { text: 'Mục đích của giáo dục là biến gương thành cửa sổ.', author: 'Sydney J. Harris' },
  { text: 'Dạy học không phải là đổ đầy một cái xô, mà là thắp sáng một ngọn lửa.', author: 'W. B. Yeats' },
  { text: 'Mọi đứa trẻ đều là thiên tài. Nhưng nếu bạn đánh giá một con cá qua khả năng leo cây...', author: 'Albert Einstein' },
  { text: 'Học không bao giờ làm mệt trí óc. Sự nhàm chán đến từ sự lặp lại, không từ sự học hỏi.', author: 'Leonardo da Vinci' },
  { text: 'Giáo viên giỏi nhất là người dạy trò tìm ra câu trả lời, không phải cho họ câu trả lời.', author: 'Lao Tzu' },
];

function getDailyQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}

function getGreeting(hour: number): { text: string; emoji: string; gradient: string } {
  if (hour < 6)  return { text: 'Chào đêm khuya',  emoji: '🌙', gradient: 'from-slate-800 via-indigo-900 to-slate-900' };
  if (hour < 12) return { text: 'Chào buổi sáng',  emoji: '☀️', gradient: 'from-orange-400 via-amber-500 to-yellow-400' };
  if (hour < 18) return { text: 'Chào buổi chiều', emoji: '⛅', gradient: 'from-sky-500 via-indigo-500 to-violet-500' };
  return          { text: 'Chào buổi tối',  emoji: '🌆', gradient: 'from-indigo-600 via-purple-600 to-slate-700' };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function SpaceDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [teacherName, setTeacherName] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/space/login');
        return;
      }

      try {
        const profile = await accountService.getProfile();
        setTeacherName(profile.full_name || profile.email || '');

        const firstPage = await spaceApi.classrooms.list(1);
        const totalClassrooms = firstPage.count;

        const allPages = await Promise.all(
          Array.from({ length: firstPage.total_pages }, (_, i) =>
            spaceApi.classrooms.list(i + 1)
          )
        );
        const allClassrooms = allPages.flatMap(p => p.results);

        const sample = allClassrooms.slice(0, 10);
        const memberLists = await Promise.all(
          sample.map(c => spaceApi.classrooms.members(c.uid).catch(() => []))
        );
        const totalStudents = memberLists.reduce(
          (sum, members) => sum + members.filter(m => m.role === 'student').length,
          0
        );

        setStats({ totalClassrooms, totalStudents, activeClassrooms: allClassrooms.length });

        // Fetch activity logs from the 3 most recently updated classrooms
        const recentClassrooms = allClassrooms.slice(0, 3);
        const activityResults = await Promise.all(
          recentClassrooms.map(c => spaceApi.classrooms.getActivity(c.uid, 'major', 10).catch(() => []))
        );
        const merged = activityResults
          .flat()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 8);
        setRecentActivity(merged);

        setLoading(false);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/space/login');
      }
    };

    init();
  }, [router]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
          <p className="text-muted-foreground font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Tổng lớp học',
      value: stats?.totalClassrooms ?? 0,
      sub: '+3 tháng này',
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: true,
    },
    {
      name: 'Học sinh đang học',
      value: stats?.totalStudents ?? 0,
      sub: 'Từ các lớp đang mở',
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50',
      trend: true,
    },
    {
      name: 'Tỉ lệ hoàn thành',
      value: '74%',
      sub: '+6% so với kỳ trước',
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      trend: true,
    },
    {
      name: 'Chứng chỉ đã cấp',
      value: 47,
      sub: '12 tuần qua',
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      trend: false,
    },
  ];

  const greeting = getGreeting(now.getHours());
  const quote = getDailyQuote();
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const firstName = teacherName.split(' ').pop() ?? teacherName;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Greeting Card ── */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${greeting.gradient} p-8 text-white shadow-xl`}>
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/5 blur-xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: greeting text */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>
                {greeting.emoji}
              </span>
              <div>
                <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">
                  {dateStr}
                </p>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-0.5">
                  {greeting.text}{firstName ? `, ${firstName}` : ''}!
                </h1>
              </div>
            </div>

            {/* Quote */}
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10 max-w-lg">
              <p className="text-sm font-medium text-white/90 leading-relaxed italic">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-xs text-white/60 font-bold mt-1.5">— {quote.author}</p>
            </div>
          </div>

          {/* Right: live clock */}
          <div className="shrink-0 text-right">
            <div className="text-4xl md:text-5xl font-black tracking-tighter tabular-nums">
              {timeStr}
            </div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
              Giờ hiện tại
            </p>
            {/* Mini stats row */}
            <div className="flex items-center gap-4 mt-4 justify-end">
              <div className="text-center">
                <div className="text-xl font-black">{stats?.totalClassrooms ?? '—'}</div>
                <div className="text-[10px] text-white/60 uppercase font-bold">Lớp học</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-xl font-black">{stats?.totalStudents ?? '—'}</div>
                <div className="text-[10px] text-white/60 uppercase font-bold">Học sinh</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name} className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {stat.trend && <TrendingUp size={11} className="text-emerald-500" />}
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Bar Chart */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-500" />
              Hoạt động tuần này
            </CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />Đăng ký</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />Nộp bài</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3 h-36 px-2">
              {MOCK_WEEKLY.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end justify-center gap-1 h-28">
                    <div
                      className="flex-1 bg-indigo-500 rounded-t-md transition-all duration-700 hover:bg-indigo-600"
                      style={{ height: `${(d.enrolled / MAX_WEEKLY) * 100}%` }}
                      title={`${d.enrolled} đăng ký`}
                    />
                    <div
                      className="flex-1 bg-emerald-400 rounded-t-md transition-all duration-700 hover:bg-emerald-500"
                      style={{ height: `${(d.submitted / MAX_WEEKLY) * 100}%` }}
                      title={`${d.submitted} nộp bài`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} className="text-muted-foreground" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">Chưa có hoạt động nào.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((log) => {
                  const { icon: Icon, color, bg, label } = getActivityMeta(log.event_type);
                  return (
                    <div key={log.uid} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon size={14} className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-snug">
                          {label}{log.target_name ? ` — ${log.target_name}` : ''}
                        </p>
                        {log.actor_name && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{log.actor_name}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(log.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Classes */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap size={18} className="text-indigo-500" />
              Lớp học nổi bật
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_TOP_CLASSES.map((cls) => (
                <div key={cls.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground truncate">{cls.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{cls.students}/{cls.max} hs</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500 transition-all duration-700"
                      style={{ width: `${cls.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Tiến độ: {cls.progress}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Organization Status */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Trạng thái tổ chức</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {[
                { label: 'Lớp học đang mở', value: stats?.activeClassrooms ?? 0, max: stats?.totalClassrooms ?? 1, color: 'bg-indigo-500' },
                { label: 'Dung lượng lưu trữ', value: 45, max: 100, color: 'bg-amber-500', suffix: '%' },
                { label: 'API Calls tháng này', value: 68, max: 100, color: 'bg-emerald-500', suffix: '%' },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">
                      {item.suffix ? `${item.value}${item.suffix}` : `${item.value} / ${item.max}`}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all duration-700`}
                      style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Gói hiện tại: <span className="font-bold text-indigo-600">Professional Plan</span></p>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full border border-indigo-100">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
