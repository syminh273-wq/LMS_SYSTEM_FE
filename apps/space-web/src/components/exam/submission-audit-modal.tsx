import { useEffect, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';

import {
  formatAuditClockTime,
  formatAuditEventData,
  humanizeAuditEvent,
  isAuditForce,
  isAuditLimit,
  isAuditViolation,
} from '@shared/lib/exam';
import { examApi } from '@/lib/api/exam';
import type {
  AuditAnswersResponse,
  AuditDetailsResponse,
  AuditLogEntry,
  AuditOverviewResponse,
  ExamSubmission,
  FaceLogEntry,
} from '@/lib/api/types';

type TabKey = 'overview' | 'history' | 'work' | 'face';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: ExamSubmission;
  exam: { uid: string; title: string };
}

const TAB_LABELS: Record<TabKey, { label: string; icon: React.ComponentType<{ size?: number }> }> = {
  overview: { label: 'Tổng quan', icon: Activity },
  history: { label: 'Lịch sử sự kiện', icon: ClipboardList },
  work: { label: 'Bài làm', icon: FileText },
  face: { label: 'Nhận diện khuôn mặt', icon: Camera },
};

export function SubmissionAuditModal({ open, onOpenChange, submission, exam }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [overview, setOverview] = useState<AuditOverviewResponse | null>(null);
  const [details, setDetails] = useState<AuditDetailsResponse | null>(null);
  const [answers, setAnswers] = useState<AuditAnswersResponse | null>(null);
  const [faceLogs, setFaceLogs] = useState<FaceLogEntry[] | null>(null);
  const [loadingTab, setLoadingTab] = useState<TabKey | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setOverview(null);
    setDetails(null);
    setAnswers(null);
    setFaceLogs(null);
    setActiveTab('overview');
  }, [open, submission.uid]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setError('');
      setLoadingTab(activeTab);
      try {
        if (activeTab === 'overview' && !overview) {
          const data = await examApi.getAuditOverview(submission.uid);
          if (!cancelled) setOverview(data);
        } else if (activeTab === 'history' && !details) {
          const data = await examApi.getAuditDetails(submission.uid);
          if (!cancelled) setDetails(data);
        } else if (activeTab === 'work' && !answers) {
          const data = await examApi.getAuditAnswers(submission.uid);
          if (!cancelled) setAnswers(data);
        } else if (activeTab === 'face' && !faceLogs) {
          const data = await examApi.getStudentFaceLogs(exam.uid, submission.student_id);
          if (!cancelled) setFaceLogs(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
        }
      } finally {
        if (!cancelled) setLoadingTab(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, open, submission.uid, submission.student_id, exam.uid, overview, details, answers, faceLogs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] w-[calc(100vw-2rem)] h-[820px] max-h-[820px] overflow-hidden p-0 border-border bg-card flex flex-col">
        <DialogHeader className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-brand-light text-primary-brand">
              <ClipboardList size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {exam.title}
              </p>
              <DialogTitle className="truncate text-foreground">
                Chi tiết bài làm · {submission.student_id.slice(0, 8)}…
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-card px-4">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => {
            const { label, icon: Icon } = TAB_LABELS[key];
            const active = activeTab === key;
            return (
              <Button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-black uppercase ${
                  active
                    ? 'border-primary-brand text-primary-brand'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={14} />
                {label}
              </Button>
            );
          })}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto bg-muted/30 px-6 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {loadingTab && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary-brand" />
            </div>
          )}

          {!loadingTab && activeTab === 'overview' && overview && (
            <OverviewTab data={overview} />
          )}
          {!loadingTab && activeTab === 'history' && details && (
            <HistoryTab events={details.events} />
          )}
          {!loadingTab && activeTab === 'work' && answers && (
            <WorkTab data={answers} />
          )}
          {!loadingTab && activeTab === 'face' && faceLogs && (
            <FaceTab logs={faceLogs} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OverviewTab({ data }: { data: AuditOverviewResponse }) {
  const sub = data.submission;
  const counters = data.counters;
  const totalViolations =
    (counters.visibility_breaks.count ?? 0) + (counters.face_warnings.count ?? 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric
          label="Điểm"
          value={sub.grade != null ? String(sub.grade) : '--'}
          tone={sub.passed ? 'good' : sub.passed === false ? 'bad' : 'neutral'}
        />
        <Metric
          label="Đạt/Không"
          value={sub.passed == null ? '--' : sub.passed ? 'Đạt' : 'Không đạt'}
          tone={sub.passed ? 'good' : sub.passed === false ? 'bad' : 'neutral'}
        />
        <Metric
          label="Nộp lúc"
          value={sub.submitted_at ? formatAuditClockTime(sub.submitted_at) : '--'}
        />
        <Metric
          label="Trạng thái"
          value={sub.status}
          tone={sub.status === 'graded' ? 'good' : 'neutral'}
        />
      </div>

      {data.force_submitted && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-sm font-black text-destructive">Bài thi đã được nộp bắt buộc</p>
            <p className="mt-1 text-xs font-medium text-destructive">
              Lý do: {data.force_submit_reason || 'vi phạm quy chế'}
              {data.force_submitted_at ? ` · ${formatAuditClockTime(data.force_submitted_at)}` : ''}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity size={16} className="text-primary-brand" />
          <h3 className="text-sm font-black uppercase text-foreground">Giới hạn hành vi</h3>
        </div>
        <div className="space-y-4">
          <CounterRow
            label="Số lần rời màn hình"
            count={counters.visibility_breaks.count}
            max={counters.visibility_breaks.max}
            tone="amber"
          />
          <CounterRow
            label="Số lần cảnh báo khuôn mặt"
            count={counters.face_warnings.count}
            max={counters.face_warnings.max}
            tone="rose"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary-brand" />
          <h3 className="text-sm font-black uppercase text-foreground">Đánh giá</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Hiệu lực điểm" value={data.is_effective ? 'Có hiệu lực' : 'Không hiệu lực'} />
          <Field
            label="Phương pháp chấm"
            value={sub.grading_method || 'auto'}
          />
          <Field
            label="Số lần vi phạm"
            value={`${totalViolations} lần`}
          />
          <Field
            label="Nộp bắt buộc"
            value={data.force_submitted ? 'Có' : 'Không'}
          />
        </div>
      </div>
    </div>
  );
}

function CounterRow({
  label,
  count,
  max,
  tone,
}: {
  label: string;
  count: number;
  max: number;
  tone: 'rose' | 'amber';
}) {
  const unlimited = max <= 0;
  const exceeded = !unlimited && count > max;
  const danger = exceeded;
  const pct = unlimited ? 0 : Math.min(100, (count / Math.max(max, 1)) * 100);
  const barColor = danger ? 'bg-destructive' : tone === 'rose' ? 'bg-destructive/70' : 'bg-amber-400';
  const textColor = danger ? 'text-destructive' : 'text-amber-700';
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">{label}</span>
        <span className={`text-sm font-black tabular-nums ${textColor}`}>
          {count}
          {unlimited ? '' : ` / ${max}`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: unlimited ? '0%' : `${pct}%` }} />
      </div>
      {unlimited && (
        <p className="mt-1 text-[10px] text-muted-foreground">Không giới hạn</p>
      )}
    </div>
  );
}

function Metric({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'good' | 'bad' | 'neutral' }) {
  const color =
    tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-destructive' : 'text-foreground';
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] font-black uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-black ${color}`}>{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-black text-foreground">{value}</div>
    </div>
  );
}

function HistoryTab({ events }: { events: AuditLogEntry[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
        <ClipboardList size={28} className="mx-auto mb-2 text-muted-foreground/60" />
        <p className="text-sm font-bold text-muted-foreground">Chưa có sự kiện nào được ghi nhận.</p>
      </div>
    );
  }
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  return (
    <ol className="relative space-y-2 border-l-2 border-border pl-5">
      {sorted.map((ev) => {
        const force = isAuditForce(ev.event_type);
        const limit = isAuditLimit(ev.event_type);
        const violation = isAuditViolation(ev.event_type);
        const dot = force || limit
          ? 'bg-destructive ring-destructive/20'
          : violation
            ? 'bg-amber-500 ring-amber-200'
            : 'bg-primary-brand ring-primary-brand/20';
        const text = force || limit ? 'text-destructive' : violation ? 'text-amber-700' : 'text-foreground';
        const data = formatAuditEventData(ev.event_type, ev.event_data);
        return (
          <li key={ev.uid} className="relative">
            <span className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ${dot}`} />
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-black ${text}`}>{humanizeAuditEvent(ev.event_type)}</p>
                {data && <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">{data}</p>}
              </div>
              <time className="shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
                {formatAuditClockTime(ev.created_at)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function WorkTab({ data }: { data: AuditAnswersResponse }) {
  if (data.submission_type === 'multiple_choice' || data.submission_type === 'online_quiz') {
    const { score, answers } = data;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Điểm" value={score.grade != null ? String(score.grade) : '--'} />
          <Metric
            label="Đúng/Tổng"
            value={`${score.correct_count ?? 0}/${score.total ?? 0}`}
          />
          <Metric
            label="Tỉ lệ đúng"
            value={score.score_pct != null ? `${score.score_pct}%` : '--'}
            tone={score.score_pct != null && score.score_pct >= 50 ? 'good' : 'bad'}
          />
          <Metric label="Thang điểm" value={score.max_grade != null ? String(score.max_grade) : '--'} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList size={16} className="text-primary-brand" />
            <h3 className="text-sm font-black uppercase text-foreground">Đáp án chi tiết</h3>
          </div>
          {answers.length === 0 ? (
            <p className="text-sm font-bold text-muted-foreground">Không có dữ liệu đáp án.</p>
          ) : (
            <ol className="space-y-3">
              {answers.map((a, i) => (
                <li key={a.question_uid} className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        a.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {a.is_correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-foreground">
                        Câu {i + 1}: {a.question_text}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        Bạn chọn: <span className="font-black text-foreground">{a.chosen || '--'}</span>
                        {' · '}
                        Đáp án đúng: <span className="font-black text-emerald-700">
                          {String(a.correct_answer ?? '').toUpperCase()}
                        </span>
                      </p>
                      {a.explanation && (
                        <p className="mt-1 text-xs italic text-muted-foreground">{a.explanation}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    );
  }

  if (data.submission_type === 'file') {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileText size={16} className="text-primary-brand" />
          <h3 className="text-sm font-black uppercase text-foreground">File đã nộp</h3>
        </div>
        {data.file.url ? (
          <a
            href={data.file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-brand px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-primary-brand-dark"
          >
            <Download size={16} />
            {data.file.name || 'Tải file về'}
          </a>
        ) : (
          <p className="text-sm font-bold text-muted-foreground">Học sinh chưa nộp file.</p>
        )}
      </div>
    );
  }

  const essayContent = 'essay_content' in data ? data.essay_content : '';
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <FileText size={16} className="text-primary-brand" />
        <h3 className="text-sm font-black uppercase text-foreground">Bài làm tự luận</h3>
      </div>
      <p className="whitespace-pre-wrap rounded-xl bg-muted/30 p-4 text-sm font-bold text-foreground">
        {essayContent || '(trống)'}
      </p>
    </div>
  );
}

function FaceTab({ logs }: { logs: FaceLogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
        <Camera size={28} className="mx-auto mb-2 text-muted-foreground/60" />
        <p className="text-sm font-bold text-muted-foreground">Chưa có lượt nhận diện nào.</p>
      </div>
    );
  }
  const sorted = [...logs].sort(
    (a, b) => new Date(a.verified_at ?? 0).getTime() - new Date(b.verified_at ?? 0).getTime(),
  );
  const total = sorted.length;
  const recognized = sorted.filter((l) => l.recognized).length;
  const multiFace = sorted.filter((l) => l.multiple_faces).length;
  const cameraOff = sorted.filter((l) => !l.camera_open).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Tổng lượt verify" value={String(total)} />
        <Metric
          label="Nhận diện thành công"
          value={`${recognized}/${total}`}
          tone={recognized === total ? 'good' : 'bad'}
        />
        <Metric
          label="Phát hiện nhiều người"
          value={String(multiFace)}
          tone={multiFace > 0 ? 'bad' : 'neutral'}
        />
        <Metric
          label="Mất camera"
          value={String(cameraOff)}
          tone={cameraOff > 0 ? 'bad' : 'neutral'}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left">
          <thead className="bg-muted/50">
            <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Camera</th>
              <th className="px-4 py-3">Nhận diện</th>
              <th className="px-4 py-3">Mức khớp</th>
              <th className="px-4 py-3">Số người</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l) => (
              <tr key={l.uid} className="border-t border-border">
                <td className="px-4 py-3 text-xs font-bold tabular-nums text-muted-foreground">
                  {formatAuditClockTime(l.verified_at ?? '')}
                </td>
                <td className="px-4 py-3">
                  {l.camera_open ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                      <CheckCircle2 size={12} /> Bật
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-black uppercase text-destructive">
                      <XCircle size={12} /> Tắt
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {l.recognized ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                      <CheckCircle2 size={12} /> Khớp
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-black uppercase text-destructive">
                      <XCircle size={12} /> Lỗi
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-black text-foreground">
                  {Math.round(l.similarity * 100)}%
                </td>
                <td className="px-4 py-3 text-sm font-black text-foreground">
                  {l.multiple_faces ? (
                    <span className="text-destructive">{l.face_count} (nhiều)</span>
                  ) : (
                    l.face_count
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
