'use client';

import * as React from 'react';
import { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RotateCcw,
  Loader2,
  File,
  ClipboardList,
  Video,
  UserPlus,
  UserX,
  Users,
  FileCheck,
  CheckCircle2,
  GraduationCap,
  Gamepad2,
  Timer,
  Clock,
  Trash2,
  Search,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { spaceApi } from '@/lib/api';
import type { ActivityLog, ActivityLogEventType, ActivityLogLevel, Classroom } from '@/lib/api/types';
import { toast } from 'sonner';

// ── Meta helpers ──────────────────────────────────────────────────────────────

function getActivityMeta(eventType: ActivityLogEventType): {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  label: string;
} {
  const map: Record<ActivityLogEventType, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
    classroom_created: { icon: GraduationCap, color: 'text-primary-brand', bg: 'bg-primary-brand-light',  border: 'border-primary-brand-muted', label: 'Lớp học được tạo' },
    document_uploaded: { icon: File,          color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',   label: 'Tải lên tài liệu mới' },
    document_deleted:  { icon: Trash2,        color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-200',    label: 'Xóa tài liệu' },
    exam_created:      { icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200', label: 'Tạo bài kiểm tra' },
    exam_published:    { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  label: 'Phát hành bài kiểm tra' },
    exam_opened:       { icon: Timer,         color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-200',label: 'Mở ca thi trực tuyến' },
    exam_closed:       { icon: Clock,         color: 'text-muted-foreground',  bg: 'bg-muted',  border: 'border-border',  label: 'Đóng ca thi' },
    exam_deleted:      { icon: Trash2,        color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-200',    label: 'Xóa bài kiểm tra' },
    quiz_assigned:     { icon: Gamepad2,      color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200', label: 'Giao đề thi trắc nghiệm' },
    meeting_started:   { icon: Video,         color: 'text-sky-600',    bg: 'bg-sky-50',     border: 'border-sky-200',    label: 'Mở buổi học trực tuyến' },
    meeting_ended:     { icon: Video,         color: 'text-muted-foreground',  bg: 'bg-muted',  border: 'border-border',  label: 'Kết thúc buổi học' },
    member_joined:     { icon: UserPlus,      color: 'text-blue-500',   bg: 'bg-blue-50',    border: 'border-blue-200',   label: 'Học sinh đăng ký tham gia' },
    member_approved:   { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  label: 'Duyệt học sinh vào lớp' },
    member_rejected:   { icon: UserX,         color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-200',    label: 'Từ chối yêu cầu tham gia' },
    member_kicked:     { icon: UserX,         color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-200',    label: 'Kick học sinh khỏi lớp' },
    member_left:       { icon: Users,         color: 'text-muted-foreground',  bg: 'bg-muted',  border: 'border-border',  label: 'Học sinh tự rời lớp' },
    exam_submitted:    { icon: FileCheck,     color: 'text-teal-600',   bg: 'bg-teal-50',    border: 'border-teal-200',   label: 'Học sinh nộp bài' },
  };
  return map[eventType] ?? { icon: ClipboardList, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', label: eventType };
}

const EVENT_GROUPS: { label: string; events: ActivityLogEventType[] }[] = [
  { label: 'Tất cả', events: [] },
  { label: 'Tài liệu', events: ['document_uploaded', 'document_deleted'] },
  { label: 'Kiểm tra', events: ['exam_created', 'exam_published', 'exam_opened', 'exam_closed', 'exam_deleted', 'exam_submitted'] },
  { label: 'Học sinh', events: ['member_joined', 'member_approved', 'member_rejected', 'member_kicked', 'member_left'] },
  { label: 'Phòng học', events: ['meeting_started', 'meeting_ended', 'quiz_assigned', 'classroom_created'] },
];

function groupByDate(logs: ActivityLog[]): { date: string; items: ActivityLog[] }[] {
  const map = new Map<string, ActivityLog[]>();
  for (const log of logs) {
    const key = new Date(log.created_at).toLocaleDateString('vi-VN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClassroomActivityPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const router = useRouter();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [level, setLevel] = useState<ActivityLogLevel>('major');
  const [activeGroup, setActiveGroup] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;
  const beforeRef = useRef<string | undefined>(undefined);

  // Fetch classroom name
  useEffect(() => {
    spaceApi.classrooms.getClassroom(uid)
      .then(setClassroom)
      .catch(() => {});
  }, [uid]);

  const fetchLogs = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      beforeRef.current = undefined;
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await spaceApi.classrooms.getActivity(uid, level, PAGE_SIZE, beforeRef.current);
      if (reset) {
        setLogs(data);
      } else {
        setLogs(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
      if (data.length > 0) {
        beforeRef.current = data[data.length - 1].created_at;
      }
    } catch {
      toast.error('Không thể tải lịch sử hoạt động');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [uid, level]);

  useEffect(() => {
    void fetchLogs(true);
  }, [fetchLogs]);

  // Filter by group + search
  const filtered = logs.filter(log => {
    const groupMatch = activeGroup === 0 || EVENT_GROUPS[activeGroup].events.includes(log.event_type);
    const searchMatch = !search || [log.actor_name, log.target_name, getActivityMeta(log.event_type).label]
      .some(s => s?.toLowerCase().includes(search.toLowerCase()));
    return groupMatch && searchMatch;
  });

  const grouped = groupByDate(filtered);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/space/classrooms/${uid}/details`)}
            className="w-11 h-11"
          >
            <ArrowLeft size={18} className="text-muted-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                {classroom?.name ?? ''}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <RotateCcw size={22} className="text-primary-brand" />
              Lịch sử hoạt động
            </h1>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(true)}
          disabled={loading}
          className="h-10 gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </Button>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        {/* Level toggle */}
        <div className="flex bg-muted rounded-xl p-1 gap-1 self-start">
          {(['major', 'detail'] as const).map(lvl => (
            <Button
              key={lvl}
              variant={level === lvl ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setLevel(lvl)}
            >
              {lvl === 'major' ? 'Hoạt động chính' : 'Audit chi tiết'}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, sự kiện..."
            className="w-full pl-10 pr-4 h-10 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-brand/30"
          />
        </div>

        {/* Event group filter */}
        <div className="flex flex-wrap gap-2">
          {EVENT_GROUPS.map((g, i) => (
            <Button
              key={g.label}
              variant={activeGroup === i ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveGroup(i)}
            >
              {g.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {!loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <span className="font-bold text-foreground">{filtered.length}</span> sự kiện
          {search && <><span>•</span><span>lọc theo "{search}"</span></>}
          {activeGroup > 0 && <><span>•</span><span>nhóm "{EVENT_GROUPS[activeGroup].label}"</span></>}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={40} className="animate-spin text-primary-brand" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Đang tải...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border rounded-3xl">
          <RotateCcw size={48} className="mx-auto mb-4 text-muted-foreground/20" />
          <p className="text-base font-bold text-foreground">Không có hoạt động nào</p>
          <p className="text-sm text-muted-foreground mt-1">Thử thay đổi bộ lọc hoặc mức hiển thị</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ date, items }) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest bg-background px-3 py-1 rounded-full border border-border">
                  {date}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Items */}
              <div className="bg-card border border-border rounded-3xl overflow-hidden divide-y divide-border">
                {items.map((log) => {
                  const { icon: Icon, color, bg, border, label } = getActivityMeta(log.event_type);
                  return (
                    <div key={log.uid} className="flex items-start gap-4 px-6 py-5 hover:bg-muted/30 transition-colors group">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-2xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
                        <Icon size={18} className={color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-foreground leading-snug">
                              {label}
                              {log.target_name && (
                                <span className="text-primary-brand"> — {log.target_name}</span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {log.actor_name && (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  log.actor_role === 'teacher'
                                    ? 'bg-primary-brand-light text-primary-brand border border-primary-brand-muted'
                                    : 'bg-muted text-muted-foreground border border-border'
                                }`}>
                                  {log.actor_role === 'teacher' ? '👩‍🏫' : '🎓'} {log.actor_name}
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {log.actor_role === 'teacher' ? 'Giáo viên' : log.actor_role === 'student' ? 'Học sinh' : ''}
                              </span>
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-muted-foreground">
                              {new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <span className={`inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${bg} ${color} border ${border}`}>
                              {log.log_level === 'major' ? 'Chính' : 'Chi tiết'}
                            </span>
                          </div>
                        </div>

                        {/* Metadata extras */}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.entries(log.metadata).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchLogs(false)}
                disabled={loadingMore}
                className="h-12 gap-2"
              >
                {loadingMore ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ChevronDown size={16} />
                )}
                Tải thêm
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
