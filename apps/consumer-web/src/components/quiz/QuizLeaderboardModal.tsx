'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Loader2, Trophy, Medal, Award, Clock, ChevronRight, X, Lock } from 'lucide-react';
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
  if (rank === 1) return <Trophy size={16} className="text-amber-500" />;
  if (rank === 2) return <Medal size={16} className="text-slate-400" />;
  if (rank === 3) return <Award size={16} className="text-orange-600" />;
  return <span className="text-xs font-black text-slate-500">#{rank}</span>;
}

function rankBg(rank: number) {
  if (rank === 1) return 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50';
  if (rank === 2) return 'border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50';
  if (rank === 3) return 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50';
  return 'border-indigo-100 bg-white';
}

function scoreColor(p: number) {
  if (p >= 80) return 'text-emerald-600';
  if (p >= 50) return 'text-amber-600';
  return 'text-rose-600';
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy size={28} className="text-yellow-200" />
            <div>
              <h2 className="text-xl font-black tracking-tight">Bảng vàng Quiz</h2>
              <p className="text-xs font-bold text-amber-100">Xếp theo điểm cao nhất → thời gian nhanh nhất</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-white hover:bg-white/20">
            <X size={20} />
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-6">
            <Lock size={36} className="text-rose-400 mb-3" />
            <p className="text-sm font-bold text-slate-700">{error}</p>
          </div>
        ) : !data ? null : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {data.me && (
              <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">
                  #{data.me.rank}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Vị trí của bạn</div>
                  <div className="text-sm font-black text-indigo-900">
                    {data.me.best_score_pct}% trong {data.total_students} học sinh
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-indigo-700">
                  <Clock size={12} /> {fmtSeconds(data.me.best_time_taken_seconds)}
                </div>
              </div>
            )}

            {data.top_3.length > 0 && (
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Top 3</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {data.top_3.map(e => (
                    <button
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
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                      <div className="flex items-center gap-3">
                        {e.student_avatar ? (
                          <img src={e.student_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white text-sm font-black flex items-center justify-center">
                            {e.student_name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-black text-slate-900 truncate">{e.student_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {e.attempts_count} lần thử
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-2xl font-black ${scoreColor(e.best_score_pct)}`}>
                          {e.best_score_pct}%
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                          <Clock size={10} /> {fmtSeconds(e.best_time_taken_seconds)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {data.entries.length > 0 && (
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  Bảng đầy đủ ({data.total_students} học sinh)
                </div>
                <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        {['Hạng', 'Học sinh', 'Lần thử', 'Điểm', 'Thời gian', 'Nộp lúc', ''].map(h => (
                          <th key={h} className="px-3 py-2.5 text-[10px] font-black uppercase text-slate-500 text-center tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.entries.map(e => (
                        <tr key={e.student_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-3 py-2 text-center">{rankBadge(e.rank)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {e.student_avatar ? (
                                <img src={e.student_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[9px] font-black flex items-center justify-center">
                                  {e.student_name?.[0]?.toUpperCase() ?? '?'}
                                </div>
                              )}
                              <span className="text-xs font-bold truncate max-w-[140px]">{e.student_name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center text-xs font-bold text-slate-500">{e.attempts_count}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-sm font-black ${scoreColor(e.best_score_pct)}`}>
                              {e.best_score_pct}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-xs font-bold text-slate-500">
                            {fmtSeconds(e.best_time_taken_seconds)}
                          </td>
                          <td className="px-3 py-2 text-center text-[10px] text-slate-500 font-medium">
                            {fmtTime(e.best_submitted_at)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => void openDetail(e)}
                              className="text-[10px] font-black text-indigo-600 hover:bg-indigo-50 rounded-md px-2 py-1"
                            >
                              CHI TIẾT
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {loadingDetail && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-white" />
          </div>
        )}

        {detail && !loadingDetail && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {detail.student_avatar ? (
                    <img src={detail.student_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white text-sm font-black flex items-center justify-center">
                      {detail.student_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-slate-900">{detail.student_name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono">{detail.student_id.slice(0, 8)}…</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDetail(null)} className="rounded-xl text-slate-500">
                  <X size={18} />
                </Button>
              </div>
              <div className="p-5 grid grid-cols-3 gap-2">
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <div className="text-[9px] font-black uppercase text-slate-500">Hạng</div>
                  <div className="text-xl font-black text-slate-900">{detail.rank ?? '–'}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <div className="text-[9px] font-black uppercase text-slate-500">Điểm</div>
                  <div className={`text-xl font-black ${scoreColor(detail.best_score_pct)}`}>
                    {detail.best_score_pct}%
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <div className="text-[9px] font-black uppercase text-slate-500">Thời gian</div>
                  <div className="text-xl font-black text-slate-900">
                    {fmtSeconds(detail.best_time_taken_seconds)}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  Tất cả lượt làm ({detail.attempts_count})
                </div>
                <div className="space-y-2">
                  {detail.attempts.map(a => (
                    <div key={a.attempt_uid ?? `${a.attempt_number}-${a.submitted_at}`}
                      className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 rounded-md px-1.5 py-0.5">
                          Lần #{a.attempt_number}
                        </span>
                        <span className={`text-sm font-black ${scoreColor(a.score_pct)}`}>{a.score_pct}%</span>
                        <span className="text-[10px] text-slate-500 font-bold">({a.score}/{a.total_questions})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                        <span className="flex items-center gap-0.5"><Clock size={10} />{fmtSeconds(a.time_taken_seconds)}</span>
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
