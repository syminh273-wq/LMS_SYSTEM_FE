import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, Medal, Award, Loader2, Trophy, User, History as HistoryIcon, Info, Calculator } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Card, CardContent } from '@shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Button } from '@shared/components/ui/button';
import { classroomApi, LeaderboardEntry, LeaderboardResponse } from '@/lib/api';
import type { RootState } from '@/lib/redux/store';
import { MyXpHistoryModal } from '@/components/classroom/MyXpHistoryModal';

type Props = {
  classroomUid: string;
};

const RANK_LIMIT = 50;

function rankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
        <Crown size={18} className="text-warning" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Medal size={18} className="text-muted-foreground" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
        <Award size={18} className="text-warning" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground font-black text-sm">
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const currentUserId = useSelector((s: RootState) => s.user.profile?.uid);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await classroomApi.getClassroomLeaderboard(classroomUid, RANK_LIMIT);
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
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/10">
        <CardContent className="p-6 text-center text-sm text-destructive font-medium">
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
      <Card className="border-primary/20 bg-gradient-to-br from-indigo-50 to-white">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
            <Trophy size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black uppercase tracking-widest text-primary">
              Bảng xếp hạng
            </div>
            <div className="text-base font-black text-foreground truncate">
              {totalStudents > 0
                ? `${totalStudents} thành viên đang cạnh tranh`
                : 'Chưa có dữ liệu xếp hạng'}
            </div>
            <Link
              href="/consumer/grading"
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              <Calculator size={11} />
              Bảng quy đổi điểm
            </Link>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="shrink-0 gap-1.5 rounded-full border-primary/30 text-primary"
          >
            <HistoryIcon size={14} />
            <span className="hidden sm:inline">Xem lịch sử của tôi</span>
            <span className="sm:hidden">Lịch sử</span>
          </Button>
          {myRank != null && (
            <div className="text-right shrink-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Hạng của bạn
              </div>
              <div className="text-2xl font-black text-primary leading-none">
                #{myRank}
              </div>
              {myScore != null && (
                <div className="text-[10px] font-bold text-muted-foreground mt-1">
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
            <Trophy size={40} className="mx-auto text-muted-foreground mb-3" />
            <div className="text-sm font-bold text-muted-foreground">
              Chưa có ai nộp bài trong lớp này.
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Hãy hoàn thành quiz hoặc bài kiểm tra để lên bảng xếp hạng.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
          {entries.map((e) => {
            const isMe = currentUserId && e.student_id === currentUserId;
            return (
              <div
                key={e.student_id}
                className={`px-4 py-3 ${isMe ? 'bg-primary/10' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {rankBadge(e.rank)}
                  <Avatar className="h-9 w-9 shrink-0">
                    {e.student_avatar ? (
                      <AvatarImage src={e.student_avatar} alt={e.student_name} />
                    ) : null}
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-black">
                      {initials(e.student_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                      {e.student_name}
                      {isMe && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          Bạn
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>Số bài thi: {e.exam_count}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-foreground leading-none">
                      {e.total_score.toFixed(1)}
                    </div>
                  </div>
                </div>
                {e.explanation && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                    <Info size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{e.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/consumer/grading"
        className="flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/10"
      >
        <Calculator size={14} />
        Xem bảng quy đổi điểm chi tiết
      </Link>

      {showMyStickyRow && myRank != null && myScore != null && currentUserId && (
        <Card className="border-primary/30 bg-primary/5 sticky bottom-4">
          <CardContent className="p-3 flex items-center gap-3">
            {rankBadge(myRank)}
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-foreground truncate">Bạn</div>
              <div className="text-[11px] text-muted-foreground">Hạng {myRank}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-black text-primary">
                {myScore.toFixed(1)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <MyXpHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        classroomUid={classroomUid}
      />
    </div>
  );
}
