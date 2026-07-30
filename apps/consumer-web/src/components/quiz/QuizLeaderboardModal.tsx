import * as React from 'react';
import { useState, useEffect } from 'react';
import { Loader2, Trophy, X, Medal, Award, Clock, Crown, Users, Sparkles, Lock } from 'lucide-react';
import { consumerQuizApi } from '@/lib/api/quiz';
import { Button } from '@shared/components/ui/button';
import type { QuizLeaderboardResponse, QuizLeaderboardEntry, QuizLeaderboardStudentDetail } from '@/lib/api/types';

interface Props {
  quizUid: string;
  classroomId: string;
  onClose: () => void;
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
  if (rank === 1) return <Crown size={18} className="text-amber-500" />;
  if (rank === 2) return <Medal size={18} className="text-slate-400" />;
  if (rank === 3) return <Award size={18} className="text-orange-600" />;
  return <span className="text-xs font-black text-muted-foreground">#{rank}</span>;
}

function rankPill(rank: number) {
  if (rank === 1) return 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-amber-500/40 ring-2 ring-amber-200';
  if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-400/40 ring-2 ring-slate-200';
  if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-orange-400/40 ring-2 ring-orange-200';
  return 'bg-muted text-foreground';
}

function rankRing(rank: number) {
  if (rank === 1) return 'ring-4 ring-amber-300/60';
  if (rank === 2) return 'ring-4 ring-slate-300/60';
  if (rank === 3) return 'ring-4 ring-orange-300/60';
  return 'ring-1 ring-border';
}

function scoreColor(p: number) {
  if (p >= 80) return 'text-success';
  if (p >= 50) return 'text-warning';
  return 'text-destructive';
}

function avatarFor(name: string, avatarUrl: string | undefined, size: 'sm' | 'lg' = 'sm') {
  const dim = size === 'lg' ? 'w-16 h-16 text-lg' : 'w-10 h-10 text-sm';
  const inner = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" className={`${dim} rounded-full object-cover`} />
  ) : (
    <div className={`${dim} rounded-full bg-primary text-primary-foreground font-black flex items-center justify-center`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
  return inner;
}

export default function QuizLeaderboardModal({ quizUid, classroomId, onClose }: Props) {
  const [data, setData] = useState<QuizLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<QuizLeaderboardStudentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    consumerQuizApi.getLeaderboard(quizUid, classroomId, 50)
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => {
        if (cancelled) return;
        const msg = (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail
          ?? (err instanceof Error ? err.message : 'Không thể tải bảng vàng');
        setError(msg);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [quizUid, classroomId]);

  const openDetail = async (entry: QuizLeaderboardEntry) => {
    setLoadingDetail(true);
    try {
      const d = await consumerQuizApi.getStudentLeaderboard(quizUid, classroomId, entry.student_id);
      setDetail(d);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải chi tiết');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-[28px] shadow-2xl shadow-slate-900/30 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-7 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-2 -bottom-10 w-32 h-32 rounded-full bg-yellow-300/20 blur-3xl" />
          <div className="absolute left-6 bottom-0 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-2 ring-white/30 shadow-lg">
                <Trophy size={28} className="text-yellow-100" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Bảng vàng Quiz</h2>
                <p className="text-sm font-bold text-amber-50/90 mt-0.5">Xếp theo điểm cao nhất → thời gian nhanh nhất</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl text-white hover:bg-white/20 ring-1 ring-white/20"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-amber-50/40 to-muted/30">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={36} className="animate-spin text-amber-500" />
              <p className="text-sm font-bold text-muted-foreground">Đang tải bảng vàng…</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center">
                <Lock size={28} className="text-destructive" />
              </div>
              <p className="text-sm font-bold text-foreground">{error}</p>
            </div>
          ) : !data ? null : (
            <div className="p-7 space-y-7">
              {/* Me banner */}
              {data.me && (
                <div className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-5 flex items-center gap-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-lg shadow-primary/30 ring-2 ring-background">
                    #{data.me.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase text-primary tracking-widest">Vị trí của bạn</div>
                    <div className="text-base font-black text-primary mt-0.5">
                      {data.me.best_score_pct}% trong {data.total_students} học sinh
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card/70 text-xs font-black text-primary ring-1 ring-primary/20">
                    <Clock size={12} /> {fmtSeconds(data.me.best_time_taken_seconds)}
                  </div>
                </div>
              )}

              {/* Stat strip */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
                  <Users size={14} className="text-warning" />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    Tổng {data.total_students} học sinh
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Top {data.entries.length} xếp hạng
                </span>
              </div>

              {/* Podium Top 3 */}
              {data.top_3.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy size={16} className="text-amber-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Top 3 xuất sắc</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...data.top_3].sort((a, b) => a.rank - b.rank).map((e) => {
                      const isFirst = e.rank === 1;
                      const isMe = data.me && data.me.rank === e.rank;
                      return (
                        <Button
                          key={e.student_id}
                          type="button"
                          onClick={() => void openDetail(e)}
                          className={`group relative flex h-auto flex-col items-stretch justify-start whitespace-normal text-left rounded-3xl p-5 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl ${
                            isFirst
                              ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 border-2 border-amber-300 md:scale-105 md:z-10'
                              : e.rank === 2
                                ? 'bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200'
                                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200'
                          }`}
                        >
                          {isFirst && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/30 ring-2 ring-amber-200">
                                Quán quân
                              </div>
                            </div>
                          )}
                          {isMe && (
                            <div className="absolute top-3 right-3">
                              <div className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider shadow-sm">
                                Bạn
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base shadow-md ${rankPill(e.rank)}`}>
                              {e.rank}
                            </div>
                            {rankBadge(e.rank)}
                          </div>
                          <div className="flex flex-col items-center text-center gap-2 pb-2">
                            <div className={`relative ${rankRing(e.rank)} rounded-full`}>
                              {avatarFor(e.student_name, e.student_avatar, 'lg')}
                            </div>
                            <div className="min-w-0 w-full">
                              <div className="text-sm font-black text-foreground truncate">{e.student_name}</div>
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {e.attempts_count} lần thử
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-end justify-between">
                            <div>
                              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Điểm</div>
                              <div className={`text-3xl font-black leading-none ${scoreColor(e.best_score_pct)}`}>
                                {e.best_score_pct}%
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Thời gian</div>
                              <div className="text-base font-black text-foreground inline-flex items-center gap-1">
                                <Clock size={12} className="text-muted-foreground" />
                                {fmtSeconds(e.best_time_taken_seconds)}
                              </div>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Full table */}
              {data.entries.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Medal size={16} className="text-slate-400" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Bảng đầy đủ</h3>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">Bấm CHI TIẾT để xem các lượt làm</span>
                  </div>
                  <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden ring-1 ring-border/40">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gradient-to-r from-muted/70 to-muted/40 border-b border-border">
                            {['Hạng', 'Học sinh', 'Lần thử', 'Điểm', 'Thời gian', 'Nộp lúc', ''].map(h => (
                              <th
                                key={h}
                                className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.entries.map((e, i) => {
                            const isMe = data.me && data.me.rank === e.rank;
                            return (
                              <tr
                                key={e.student_id}
                                className={`border-b border-border/60 last:border-0 transition-colors ${
                                  isMe
                                    ? 'bg-primary/10 hover:bg-primary/15'
                                    : i % 2 === 0
                                      ? 'bg-card hover:bg-muted/40'
                                      : 'bg-muted/20 hover:bg-muted/40'
                                }`}
                              >
                                <td className="px-4 py-3 text-center">
                                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-black ${rankPill(e.rank)}`}>
                                    {e.rank}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    {avatarFor(e.student_name, e.student_avatar, 'sm')}
                                    <div className="min-w-0">
                                      <div className="text-xs font-black text-foreground truncate max-w-[200px] flex items-center gap-1.5">
                                        {e.student_name}
                                        {isMe && (
                                          <span className="inline-flex px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-wider">
                                            Bạn
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] font-mono text-muted-foreground">
                                        {e.student_id.slice(0, 8)}…
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-muted text-xs font-black text-foreground">
                                    {e.attempts_count}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-base font-black ${scoreColor(e.best_score_pct)}`}>
                                    {e.best_score_pct}%
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
                                    <Clock size={11} className="text-muted-foreground" />
                                    {fmtSeconds(e.best_time_taken_seconds)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center text-[11px] font-medium text-muted-foreground">
                                  {fmtTime(e.best_submitted_at)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => void openDetail(e)}
                                    className="h-8 text-primary"
                                  >
                                    CHI TIẾT
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/60 bg-card rounded-3xl border-2 border-dashed border-border">
                  <Trophy size={40} className="opacity-30 mb-3" />
                  <p className="text-sm font-bold uppercase tracking-widest">Chưa có học sinh nào nộp bài</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail overlay */}
        {loadingDetail && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-white" />
          </div>
        )}

        {detail && !loadingDetail && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            onClick={() => setDetail(null)}
          >
            <div
              className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative p-6 bg-primary text-primary-foreground">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDetail(null)}
                  className="absolute right-4 top-4 text-primary-foreground hover:bg-primary-foreground/20 ring-1 ring-primary-foreground/20"
                >
                  <X size={20} />
                </Button>
                <div className="flex items-center gap-4">
                  {avatarFor(detail.student_name, detail.student_avatar, 'lg')}
                  <div>
                    <h3 className="text-lg font-black">{detail.student_name}</h3>
                    <p className="text-xs font-mono text-primary-foreground/80 mt-0.5">{detail.student_id.slice(0, 8)}…</p>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-2xl p-4 text-center ring-1 ring-border">
                  <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Hạng</div>
                  <div className="text-3xl font-black text-foreground mt-1">{detail.rank ?? '–'}</div>
                </div>
                <div className="bg-muted/50 rounded-2xl p-4 text-center ring-1 ring-border">
                  <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Điểm cao nhất</div>
                  <div className={`text-3xl font-black mt-1 ${scoreColor(detail.best_score_pct)}`}>
                    {detail.best_score_pct}%
                  </div>
                </div>
                <div className="bg-muted/50 rounded-2xl p-4 text-center ring-1 ring-border">
                  <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Thời gian</div>
                  <div className="text-3xl font-black text-foreground mt-1">
                    {fmtSeconds(detail.best_time_taken_seconds)}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Tất cả lượt làm
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-muted text-foreground">
                    {detail.attempts_count} lần
                  </span>
                </div>
                <div className="space-y-2">
                  {(detail.attempts ?? []).map(a => (
                    <div
                      key={a.attempt_uid ?? `${a.attempt_number}-${a.submitted_at}`}
                      className="flex items-center justify-between bg-muted/40 rounded-2xl p-3.5 ring-1 ring-border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-primary bg-primary/10 rounded-lg px-2.5 py-1">
                          Lần #{a.attempt_number}
                        </span>
                        <span className={`text-lg font-black ${scoreColor(a.score_pct)}`}>{a.score_pct}%</span>
                        <span className="text-[11px] text-muted-foreground font-bold">
                          ({a.score}/{a.total_questions})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} />
                          {fmtSeconds(a.time_taken_seconds)}
                        </span>
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
    </div>
  );
}
