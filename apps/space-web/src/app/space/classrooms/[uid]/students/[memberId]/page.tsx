'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart2,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { spaceApi } from '@/lib/api';
import type { ClassroomMember, StudentExamRecord } from '@/lib/api/types';
import { toast } from 'sonner';

export default function StudentDetailsPage({
  params,
}: {
  params: Promise<{ uid: string; memberId: string }>;
}) {
  const { uid, memberId } = use(params);
  const router = useRouter();

  const [member, setMember] = useState<ClassroomMember | null>(null);
  const [records, setRecords] = useState<StudentExamRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [allMembers, subs] = await Promise.all([
          spaceApi.classrooms.members(uid),
          spaceApi.classrooms.studentSubmissions(uid, memberId),
        ]);
        const found = allMembers.find(m => m.member_id === memberId) ?? null;
        setMember(found);
        setRecords(subs);
      } catch {
        toast.error('Không thể tải dữ liệu sinh viên');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [uid, memberId]);

  const submitted = records.filter(r => r.submission).length;
  const gradedList = records.filter(r => r.submission?.grade != null);
  const avgGrade =
    gradedList.length > 0
      ? gradedList.reduce((s, r) => s + r.submission!.grade!, 0) / gradedList.length
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="font-black text-slate-900">Không tìm thấy sinh viên</p>
          <Button
            className="mt-5 w-full rounded-xl bg-indigo-600"
            onClick={() => router.push(`/space/classrooms/${uid}/details?tab=students`)}
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/space/classrooms/${uid}/details?tab=students`)}
            className="h-10 w-10 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-3">
            {member.member_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.member_avatar}
                alt={member.member_name}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">
                {member.member_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Sinh viên</p>
              <h1 className="text-xl font-black text-slate-900">{member.member_name}</h1>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-xl text-xs font-bold"
          onClick={() => router.push(`/space/classrooms/${uid}/students/${memberId}/analyze`)}
        >
          <BarChart2 size={15} />
          Phân tích
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Tổng bài thi', value: records.length, color: 'text-slate-900' },
          { label: 'Đã nộp', value: submitted, color: 'text-indigo-600' },
          { label: 'Đã chấm', value: gradedList.length, color: 'text-violet-600' },
          {
            label: 'Điểm TB',
            value: avgGrade != null ? avgGrade.toFixed(1) : '--',
            color: avgGrade != null && avgGrade >= 5 ? 'text-emerald-600' : 'text-rose-600',
          },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Submission table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 flex items-center gap-3">
          <ClipboardCheck size={18} className="text-indigo-500" />
          <div>
            <h2 className="text-sm font-black text-slate-900">Lịch sử bài nộp</h2>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Tất cả bài kiểm tra trong lớp và kết quả của sinh viên này
            </p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <ClipboardCheck size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Chưa có bài kiểm tra nào trong lớp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">Bài kiểm tra</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Ngày nộp</th>
                  <th className="px-6 py-3 text-right">Điểm</th>
                  <th className="px-6 py-3">Nhận xét GV</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr
                    key={r.exam.uid}
                    className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">{r.exam.title}</div>
                      <div className="mt-0.5 text-[10px] font-bold uppercase text-slate-400">
                        {r.exam.due_date ? `Hạn: ${formatDate(r.exam.due_date)}` : 'Không có hạn'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {r.submission ? (
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(r.submission.status)}`}>
                          {statusLabel(r.submission.status)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-400">
                          Chưa nộp
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {r.submission?.submitted_at ? formatDate(r.submission.submitted_at) : '--'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.submission?.grade != null ? (
                        <span
                          className={`text-base font-black ${r.submission.grade >= 5 ? 'text-emerald-600' : 'text-rose-600'}`}
                        >
                          {r.submission.grade.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-sm font-black text-slate-300">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-xs">
                      {r.submission?.feedback || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === 'graded') return 'bg-emerald-50 text-emerald-600';
  if (status === 'submitted') return 'bg-indigo-50 text-indigo-600';
  if (status === 'late') return 'bg-amber-50 text-amber-600';
  return 'bg-slate-100 text-slate-500';
}

function statusLabel(status: string) {
  if (status === 'graded') return 'Đã chấm';
  if (status === 'submitted') return 'Đã nộp';
  if (status === 'late') return 'Nộp trễ';
  return status;
}

function formatDate(value: string) {
  if (!value) return '--';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('vi-VN');
}
