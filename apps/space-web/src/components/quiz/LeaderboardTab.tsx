'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Loader2, Trophy, Medal, Award, Clock, ChevronRight, X } from 'lucide-react';
import { quizApi } from '@/lib/api/quiz';
import { Button } from '@shared/components/ui/button';
import type { QuizLeaderboardResponse, QuizLeaderboardEntry, QuizLeaderboardStudentDetail } from '@/lib/api/types';

interface Props {
  quizUid: string;
  classroomId: string;
}

function fmtSeconds(s: number): string {
  if (!s) return '–';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec ? `${m}p ${sec}s` : `${m} phút`;
}

function fmtTime(iso: string | null): string {
  if (!iso) return '–';
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function rankBadge(rank: number) {
  if (rank === 1) return <Trophy size={16} className="text-amber-500" />;
  if (rank === 2) return <Medal size={16} className="text-muted-foreground" />;
  if (rank === 3) return <Award size={16} className="text-orange-600" />;
  return <span className="text-xs font-black text-muted-foreground">#{rank}</span>;
}

function rankBg(rank: number) {
  if (rank === 1) return 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50';
  if (rank === 2) return 'border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50';
  if (rank === 3) return 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50';
  return 'border-border bg-card';
}

function scoreColor(p: number) {
  if (p >= 80) return 'text-emerald-600';
  if (p >= 50) return 'text-amber-600';
  return 'text-destructive';
}

export default function LeaderboardTab({ quizUid, classroomId }: Props) {
  const [data, setData] = useState<QuizLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<QuizLeaderboardStudentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    quizApi.getLeaderboard(quizUid, classroomId, 50)
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Không thể tải bảng vàng');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [quizUid, classroomId]);

  const openDetail = async (entry: QuizLeaderboardEntry) => {
    setLoadingDetail(true);
    try {
      const d = await quizApi.getStudentLeaderboard(quizUid, classroomId, entry.student_id);
      setDetail(d);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải chi tiết');
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground text-sm font-medium">
        {error}
      </div>
    );
  }

  if (!data) return null;
  const entries: QuizLeaderboardEntry[] = data.entries ?? [];
  const top3: QuizLeaderboardEntry[] = data.top_3 ?? [];

  if (entries.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-16 text-center text-muted-foreground">
        <Trophy size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Chưa có học sinh nào nộp bài quiz này</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
        <span className="uppercase tracking-wider">Tổng: {data.total_students} học sinh</span>
        <span>Xếp theo điểm cao nhất → thời gian nhanh nhất</span>
      </div>

      {top3.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Top 3</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {top3.map(e => (
              <Button
                key={e.student_id}
                type="button"
                onClick={() => void openDetail(e)}
                className={`text-left rounded-2xl border-2 p-4 shadow-sm hover:shadow-md transition ${rankBg(e.rank)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {rankBadge(e.rank)}
                    <span className="text-xs font-black uppercase">Hạng {e.rank}</span>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3">
                  {e.student_avatar ? (
                    <img src={e.student_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-brand text-white text-sm font-black flex items-center justify-center">
                      {e.student_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-foreground truncate">{e.student_name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {e.attempts_count} lần thử
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-2xl font-black ${scoreColor(e.best_score_pct)}`}>
                    {e.best_score_pct}%
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                    <Clock size={10} /> {fmtSeconds(e.best_time_taken_seconds)}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Bảng đầy đủ</div>
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Hạng', 'Học sinh', 'Lần thử', 'Điểm', 'Thời gian', 'Nộp lúc', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground text-center tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.student_id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 text-center">{rankBadge(e.rank)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {e.student_avatar ? (
                        <img src={e.student_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-muted text-foreground text-[10px] font-black flex items-center justify-center">
                          {e.student_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      <span className="text-xs font-bold truncate max-w-[160px]">{e.student_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-bold text-muted-foreground">
                    {e.attempts_count}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-black ${scoreColor(e.best_score_pct)}`}>
                      {e.best_score_pct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-bold text-muted-foreground">
                    {fmtSeconds(e.best_time_taken_seconds)}
                  </td>
                  <td className="px-4 py-3 text-center text-[10px] text-muted-foreground font-medium">
                    {fmtTime(e.best_submitted_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void openDetail(e)}
                      className="text-[10px] font-black text-primary-brand hover:bg-primary-brand-light h-7 px-2"
                    >
                      CHI TIẾT
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loadingDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-white" />
        </div>
      )}

      {detail && !loadingDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                {detail.student_avatar ? (
                  <img src={detail.student_avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-brand text-white text-sm font-black flex items-center justify-center">
                    {detail.student_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div>
                  <h2 className="font-black text-foreground">{detail.student_name}</h2>
                  <p className="text-xs text-muted-foreground font-mono">{detail.student_id.slice(0, 8)}…</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDetail(null)} className="rounded-xl text-muted-foreground">
                <X size={20} />
              </Button>
            </div>

            <div className="p-6 grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-black uppercase text-muted-foreground">Hạng</div>
                <div className="text-2xl font-black text-foreground">{detail.rank ?? '–'}</div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-black uppercase text-muted-foreground">Điểm cao nhất</div>
                <div className={`text-2xl font-black ${scoreColor(detail.best_score_pct)}`}>
                  {detail.best_score_pct}%
                </div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-black uppercase text-muted-foreground">Thời gian</div>
                <div className="text-2xl font-black text-foreground">
                  {fmtSeconds(detail.best_time_taken_seconds)}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">
                Tất cả lượt làm ({detail.attempts_count})
              </div>
              <div className="space-y-2">
                {detail.attempts.map(a => (
                  <div key={a.attempt_uid ?? `${a.attempt_number}-${a.submitted_at}`} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-primary-brand bg-primary-brand-light rounded-lg px-2 py-0.5">
                        Lần #{a.attempt_number}
                      </span>
                      <span className={`text-sm font-black ${scoreColor(a.score_pct)}`}>{a.score_pct}%</span>
                      <span className="text-xs text-muted-foreground font-bold">
                        ({a.score}/{a.total_questions})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold">
                      <span className="flex items-center gap-1"><Clock size={10} />{fmtSeconds(a.time_taken_seconds)}</span>
                      <span>{fmtTime(a.submitted_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
