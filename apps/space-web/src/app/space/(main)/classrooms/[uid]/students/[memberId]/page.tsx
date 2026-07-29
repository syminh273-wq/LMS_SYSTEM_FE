'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, BarChart2, ClipboardCheck, Loader2,
  MapPin, Globe, Github, Facebook, Linkedin, Twitter, Instagram,
  ExternalLink, UserX, TrendingUp, CheckCircle2, Clock, AlertCircle,
  ShieldBan, ChevronDown, Trophy,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { spaceApi } from '@/lib/api';
import type { ClassroomMember, StudentExamRecord, StudentPublicProfile } from '@/lib/api/types';
import { toast } from 'sonner';
import SpaceStudentRankingPanel from '@/components/ranking/SpaceStudentRankingPanel';
import { useTranslation } from '@shared/components/LocaleProvider';

const THEME_GRADIENT: Record<string, string> = {
  indigo:  'from-primary-brand via-primary-brand to-violet-600',
  rose:    'from-rose-400 via-pink-500 to-rose-600',
  emerald: 'from-emerald-400 via-teal-500 to-emerald-600',
  amber:   'from-amber-400 via-orange-500 to-amber-600',
  violet:  'from-violet-500 via-purple-600 to-violet-700',
};

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  facebook: Facebook, linkedin: Linkedin, github: Github,
  twitter: Twitter, instagram: Instagram, website: Globe,
};

export default function StudentDetailsPage({
  params,
}: {
  params: Promise<{ uid: string; memberId: string }>;
}) {
  const { uid, memberId } = use(params);
  const router = useRouter();
  const { t } = useTranslation();

  const [member, setMember]     = useState<ClassroomMember | null>(null);
  const [records, setRecords]   = useState<StudentExamRecord[]>([]);
  const [profile, setProfile]   = useState<StudentPublicProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [blockMenu, setBlockMenu] = useState(false);
  const [blocking, setBlocking] = useState(false);

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

        // Try to load public profile (non-critical)
        if (found) {
          spaceApi.classrooms.getStudentPublicProfile(found.member_id)
            .then(setProfile)
            .catch(() => {});
        }
      } catch {
        toast.error('Không thể tải dữ liệu sinh viên');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [uid, memberId]);

  const submitted   = records.filter(r => r.submission).length;
  const gradedList  = records.filter(r => r.submission?.grade != null);
  const avgGrade    = gradedList.length > 0
    ? gradedList.reduce((s, r) => s + r.submission!.grade!, 0) / gradedList.length
    : null;
  const onTimeCount = records.filter(r => {
    if (!r.submission?.submitted_at || !r.exam.due_date) return false;
    return new Date(r.submission.submitted_at) <= new Date(r.exam.due_date);
  }).length;

  const handleKick = async () => {
    try {
      await spaceApi.classrooms.kickMember(uid, memberId);
      toast.success('Đã kick sinh viên khỏi lớp.');
      router.push(`/space/classrooms/${uid}/details?tab=students`);
    } catch {
      toast.error('Không thể kick sinh viên.');
    }
  };

  const handleBlock = async (scope: 'classroom' | 'global') => {
    setBlocking(true);
    setBlockMenu(false);
    try {
      if (scope === 'classroom') {
        await spaceApi.classrooms.addClassroomBlacklist(uid, memberId);
        toast.success('Đã chặn sinh viên khỏi lớp này.');
      } else {
        await spaceApi.classrooms.addGlobalBlacklist(memberId);
        toast.success('Đã chặn sinh viên trên toàn bộ lớp học.');
      }
      router.push(`/space/classrooms/${uid}/details?tab=students`);
    } catch {
      toast.error('Không thể chặn sinh viên.');
    } finally {
      setBlocking(false);
    }
  };

  const gradient = THEME_GRADIENT[profile?.theme_color ?? 'indigo'] ?? THEME_GRADIENT.indigo;
  const meta      = profile?.metadata ?? {};
  const consumer  = profile?.consumer;

  const displayName  = consumer?.full_name || member?.member_name || 'Học sinh';
  const avatarSrc    = consumer?.avatar_url || member?.member_avatar || '';
  const initials     = displayName.slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary-brand" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="font-black text-foreground">Không tìm thấy sinh viên</p>
          <Button className="mt-5 w-full rounded-xl bg-primary-brand"
            onClick={() => router.push(`/space/classrooms/${uid}/details?tab=students`)}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">

      {/* ── Hero card ── */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {/* Cover strip */}
        <div className={`h-28 bg-gradient-to-br ${gradient} relative`}>
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="px-8 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-card shadow-lg" />
              ) : (
                <div className={`w-20 h-20 rounded-2xl border-4 border-card shadow-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl font-black`}>
                  {initials}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs font-bold"
                onClick={() => router.push(`/space/classrooms/${uid}/students/${memberId}/analyze`)}>
                <BarChart2 size={14} /> Phân tích
              </Button>
              <Button variant="outline" size="sm"
                className="rounded-xl gap-2 text-xs font-bold text-rose-500 hover:text-rose-600 hover:border-rose-300"
                onClick={handleKick}>
                <UserX size={14} /> Kick
              </Button>
              <div className="relative">
                <Button variant="outline" size="sm" disabled={blocking}
                  className="rounded-xl gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 hover:border-orange-300"
                  onClick={() => setBlockMenu(v => !v)}>
                  <ShieldBan size={14} /> Chặn <ChevronDown size={12} />
                </Button>
                {blockMenu && (
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    <Button
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-muted transition-colors"
                      onClick={() => handleBlock('classroom')}>
                      Chặn khỏi lớp này
                    </Button>
                    <Button
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      onClick={() => handleBlock('global')}>
                      Chặn toàn bộ lớp học
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name + meta */}
          <div className="space-y-1.5">
            <div>
              <h1 className="text-xl font-black text-foreground">{displayName}</h1>
              <p className="text-sm text-muted-foreground">
                @{consumer?.username || member.member_id.slice(0, 8)} · 🎓 Học sinh
              </p>
            </div>

            {profile?.bio && (
              <p className="text-sm text-foreground/80 leading-relaxed max-w-xl">{profile.bio}</p>
            )}

            {profile?.show_address && (profile?.address || profile?.city) && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin size={13} />
                {[profile.address, profile.city, profile.country].filter(Boolean).join(', ')}
              </p>
            )}

            {profile?.show_links && meta.social_links && meta.social_links.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {meta.social_links.map((link, i) => {
                  const Icon = SOCIAL_ICONS[link.platform] ?? Globe;
                  return (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-xs font-bold text-muted-foreground hover:text-primary-brand hover:border-primary-brand transition-all">
                      <Icon size={12} /> {link.label}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info row */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <span>Tham gia: <b className="text-foreground">{member.joined_at ? new Date(member.joined_at).toLocaleDateString('vi-VN') : '—'}</b></span>
            <span>Loại: <b className="text-foreground">{member.member_type === 'consumer' ? 'Học sinh' : 'Space'}</b></span>
            <span>Trạng thái: <b className={member.status === 'approved' ? 'text-emerald-600' : 'text-amber-500'}>
              {member.status === 'approved' ? '✅ Đã duyệt' : '⏳ Chờ duyệt'}
            </b></span>
            {profile && (
              <span>Profile: <b className="text-foreground">
                {profile.profile_visibility === 'public' ? '🔓 Công khai' : profile.profile_visibility === 'private' ? '🔒 Riêng tư' : '🏫 Lớp học'}
              </b></span>
            )}
          </div>
        </div>
      </div>

      {/* ── Ranking (XP / Level / Achievements) ── */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-black text-foreground">
            {t('ranking.title', 'Ranking')}
          </h2>
        </div>
        <SpaceStudentRankingPanel studentUid={memberId} t={t} />
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Tổng bài thi',  value: records.length,    icon: ClipboardCheck, color: 'text-foreground',   bg: 'bg-muted/50' },
          { label: 'Đã nộp',        value: submitted,          icon: CheckCircle2,   color: 'text-primary-brand',   bg: 'bg-primary-brand-light dark:bg-primary-brand-dark/30' },
          { label: 'Nộp đúng hạn',  value: onTimeCount,        icon: Clock,          color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          {
            label: 'Điểm TB',
            value: avgGrade != null ? avgGrade.toFixed(1) : '—',
            icon: TrendingUp,
            color: avgGrade != null && avgGrade >= 5 ? 'text-emerald-600' : avgGrade != null ? 'text-rose-600' : 'text-muted-foreground',
            bg: avgGrade != null && avgGrade >= 5 ? 'bg-emerald-50 dark:bg-emerald-950/30' : avgGrade != null ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-muted/50',
          },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border border-border ${s.bg} p-5 shadow-sm text-center`}>
            <s.icon size={20} className={`mx-auto mb-2 ${s.color}`} />
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Hobbies + Certificates (if visible) ── */}
      {profile?.show_hobbies && meta.hobbies && meta.hobbies.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">🎯 Sở thích</h3>
          <div className="flex flex-wrap gap-2">
            {meta.hobbies.map((h, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-primary-brand-light dark:bg-primary-brand-dark/30 text-primary-brand text-xs font-bold border border-primary-brand-muted/50">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile?.show_certificates && meta.certificates && meta.certificates.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">🏅 Chứng chỉ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {meta.certificates.map((c, i) => (
              <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg shrink-0`}>🏅</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.issuer} · {c.issued_date}</div>
                </div>
                {c.url && (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-primary-brand hover:text-primary-brand">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Exam table ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-5 flex items-center gap-3">
          <ClipboardCheck size={18} className="text-primary-brand" />
          <div>
            <h2 className="text-sm font-black text-foreground">Lịch sử bài nộp</h2>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              Tất cả bài kiểm tra trong lớp và kết quả của sinh viên
            </p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardCheck size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Chưa có bài kiểm tra nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Bài kiểm tra</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Ngày nộp</th>
                  <th className="px-6 py-3 text-right">Điểm</th>
                  <th className="px-6 py-3">Nhận xét</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map(r => (
                  <tr key={r.exam.uid} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-foreground">{r.exam.title}</div>
                      <div className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">
                        {r.exam.due_date ? `Hạn: ${formatDate(r.exam.due_date)}` : 'Không có hạn'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {r.submission ? (
                        <span className={`flex items-center gap-1 w-fit rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                          r.submission.status === 'graded'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'
                            : 'bg-primary-brand-light dark:bg-primary-brand-dark/30 text-primary-brand'
                        }`}>
                          {r.submission.status === 'graded' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                          {r.submission.status === 'graded' ? 'Đã chấm' : 'Đã nộp'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 w-fit rounded-full bg-muted px-2.5 py-1 text-[10px] font-black uppercase text-muted-foreground">
                          <AlertCircle size={10} /> Chưa nộp
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                      {r.submission?.submitted_at ? formatDate(r.submission.submitted_at) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.submission?.grade != null ? (
                        <span className={`text-lg font-black ${r.submission.grade >= 5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {r.submission.grade.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-sm font-black text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                      {r.submission?.feedback || '—'}
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

function formatDate(value: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
