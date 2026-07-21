'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Crown, Medal, Award, Loader2, Trophy, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Card, CardContent } from '@shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { classroomApi, LeaderboardEntry, LeaderboardResponse } from '@/lib/api';
import type { RootState } from '@/lib/redux/store';

type Props = {
  classroomUid: string;
};

const RANK_LIMIT = 10;

function rankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <Crown size={18} className="text-amber-500" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
        <Medal size={18} className="text-slate-500" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
        <Award size={18} className="text-orange-500" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 font-black text-sm">
      {rank}
    </div>
  );
}

function initials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('');
}

export function LeaderboardTab({ classroomUid }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const currentUserId = useSelector((s: RootState) => s.user.profile?.uid);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await classroomApi.leaderboard(classroomUid, RANK_LIMIT);
        if (!cancelled) setData(res);
      } catch (e: unknown) {
        if (!cancelled) {
          const err = e as { response?: { data?: { error?: string } }; message?: string };
          setError(err?.response?.data?.error || err?.message || 'Không thể tải bảng xếp hạng');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classroomUid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="p-6 text-center text-sm text-rose-600 font-medium">
          {error}
        </CardContent>
      </Card>
    );
  }

  const entries: LeaderboardEntry[] = data?.entries ?? [];
  const myRank = data?.my_rank ?? null;
  const myScore = data?.my_score ?? null;
  const totalStudents = data?.total_students ?? 0;

  const myEntryInList = currentUserId
    ? entries.find((e) => e.student_id === currentUserId)
    : undefined;
  const showMyStickyRow = myRank != null && !myEntryInList;

  return (
    <div className="space-y-4">
      <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Trophy size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black uppercase tracking-widest text-indigo-500">
              Bảng xếp hạng
            </div>
            <div className="text-base font-black text-slate-900 truncate">
              {totalStudents > 0
                ? `${totalStudents} thành viên đang cạnh tranh`
                : 'Chưa có dữ liệu xếp hạng'}
            </div>
          </div>
          {myRank != null && (
            <div className="text-right shrink-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Hạng của bạn
              </div>
              <div className="text-2xl font-black text-indigo-600 leading-none">
                #{myRank}
              </div>
              {myScore != null && (
                <div className="text-[10px] font-bold text-slate-400 mt-1">
                  {myScore.toFixed(1)} điểm
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy size={40} className="mx-auto text-slate-300 mb-3" />
            <div className="text-sm font-bold text-slate-500">
              Chưa có ai nộp bài trong lớp này.
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Hãy hoàn thành quiz hoặc bài kiểm tra để lên bảng xếp hạng.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {entries.map((e) => {
            const isMe = currentUserId && e.student_id === currentUserId;
            return (
              <div
                key={e.student_id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  isMe ? 'bg-indigo-50/60' : ''
                }`}
              >
                {rankBadge(e.rank)}
                <Avatar className="h-9 w-9 shrink-0">
                  {e.student_avatar ? (
                    <AvatarImage src={e.student_avatar} alt={e.student_name} />
                  ) : null}
                  <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-black">
                    {initials(e.student_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                    {e.student_name}
                    {isMe && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                        Bạn
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Quiz: {e.quiz_count}</span>
                    <span>·</span>
                    <span>Thi: {e.exam_count}</span>
                    <span>·</span>
                    <span>Đi học: {e.attendance_pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-black text-slate-900 leading-none">
                    {e.total_score.toFixed(1)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1">
                    Quiz {e.quiz_avg.toFixed(0)} · Thi {e.exam_avg.toFixed(0)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showMyStickyRow && myRank != null && myScore != null && currentUserId && (
        <Card className="border-indigo-200 bg-indigo-50/40 sticky bottom-4 shadow-lg">
          <CardContent className="p-3 flex items-center gap-3">
            {rankBadge(myRank)}
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <User size={16} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">Bạn</div>
              <div className="text-[11px] text-slate-500">Hạng {myRank}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-black text-indigo-600">
                {myScore.toFixed(1)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
