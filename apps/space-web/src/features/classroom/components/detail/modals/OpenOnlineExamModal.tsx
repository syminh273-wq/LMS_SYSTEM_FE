import { useState, useEffect } from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { spaceApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, X, ClipboardList, FileText, Check, Camera, ShieldAlert, Wifi } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Switch } from '@shared/components/ui/switch';
import type { Exam } from '@/lib/api';

export default function OpenOnlineExamModal({
  classroomUid,
  onClose,
  onOpened,
}: {
  classroomUid: string;
  onClose: () => void;
  onOpened: (exam: Exam, studentCount: number) => void;
}) {
  const { t } = useTranslation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamUid, setSelectedExamUid] = useState('');
  const [durationMin, setDurationMin] = useState(45);
  const [lateThresholdMin, setLateThresholdMin] = useState(15);
  const [cameraRequired, setCameraRequired] = useState(false);
  const [maxTabLeaves, setMaxTabLeaves] = useState(3);
  const [maxFaceWarnings, setMaxFaceWarnings] = useState(0);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    spaceApi.exams.listByClassroom(classroomUid, {
      status: 'published',
      exam_mode: 'online',
    }).then(data => {
      // Client-side: bỏ exam đã hết hạn (due_date < now)
      const now = Date.now();
      const valid = data.filter(e => !e.due_date || new Date(e.due_date).getTime() > now);
      setExams(valid);
      if (valid[0]) {
        setSelectedExamUid(valid[0].uid);
        setDurationMin(Math.round((valid[0].duration_seconds || 2700) / 60));
        setLateThresholdMin(Math.round((valid[0].late_threshold_seconds || 900) / 60));
        setCameraRequired(valid[0].camera_required ?? false);
        setMaxTabLeaves(valid[0].max_tab_leaves ?? 3);
        setMaxFaceWarnings(valid[0].max_face_warnings ?? 0);
      }
      setLoading(false);
    }).catch(() => {
      toast.error(t('classroom.ui.exams_load_error'));
      setLoading(false);
    });
  }, [classroomUid, t]);

  const selectedExam = exams.find(e => e.uid === selectedExamUid);

  const handleSelectExam = (exam: Exam) => {
    setSelectedExamUid(exam.uid);
    setDurationMin(Math.round((exam.duration_seconds || 2700) / 60));
    setLateThresholdMin(Math.round((exam.late_threshold_seconds || 900) / 60));
    setCameraRequired(exam.camera_required ?? false);
    setMaxTabLeaves(exam.max_tab_leaves ?? 3);
    setMaxFaceWarnings(exam.max_face_warnings ?? 0);
  };

  const handleOpenExam = async () => {
    if (!selectedExam) {
      toast.error(t('classroom.ui.exams_select_to_open'));
      return;
    }

    setOpening(true);
    try {
      const opened = await spaceApi.exams.openOnline(selectedExam.uid, {
        late_threshold_seconds: lateThresholdMin * 60,
        duration_seconds: durationMin * 60,
        camera_required: cameraRequired,
        max_tab_leaves: maxTabLeaves,
        max_face_warnings: maxFaceWarnings,
      });
      onOpened(opened.exam, opened.sessions.length);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_open_error'));
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl h-[90vh] bg-card rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-8 bg-muted/30">
          <div>
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">{t('classroom.ui.final_exams_open')}</h2>
            <p className="text-sm font-medium text-muted-foreground">{t('classroom.ui.final_exams_subtitle')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={opening} className="rounded-xl text-muted-foreground">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <ClipboardList size={14} />
              {t('classroom.ui.final_exams_open')}
            </div>
            {loading ? (
              <div className="flex h-32 items-center justify-center rounded-2xl bg-muted/40">
                <Loader2 size={28} className="animate-spin text-primary-brand" />
              </div>
            ) : exams.length === 0 ? (
              <div className="rounded-2xl bg-muted/40 p-8 text-center">
                <ClipboardList size={36} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-bold text-foreground">{t('classroom.ui.final_exams_empty')}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{t('classroom.ui.final_exams_empty_hint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {exams.map(exam => {
                  const active = exam.uid === selectedExamUid;
                  return (
                    <Button
                      key={exam.uid}
                      type="button"
                      onClick={() => handleSelectExam(exam)}
                      disabled={opening}
                      className={`rounded-2xl p-4 text-left transition-all${
                        active
                          ? 'bg-primary-brand-light'
                          : 'bg-card hover:bg-primary-brand-light/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl${active ? 'bg-primary-brand text-white' : 'bg-muted text-muted-foreground'}`}>
                          {active ? <Check size={18} /> : <FileText size={18} />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-foreground">{exam.title}</div>
                          <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{exam.duration_seconds ? `${Math.round(exam.duration_seconds / 60)} phút` : t('classroom.ui.quiz_no_limit')}</div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedExam && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Label className="space-y-2">
                  <span className="px-1 text-sm font-bold text-foreground">{t('classroom.ui.exam_duration_label')} <span className="text-rose-500">*</span></span>
                  <Input
                    type="number"
                    min={1}
                    value={durationMin}
                    onChange={event => setDurationMin(Math.max(1, Number(event.target.value)))}
                    disabled={opening}
                    className="h-12 w-full rounded-2xl bg-muted px-4 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary-brand-light disabled:opacity-60"
                  />
                </Label>

                <Label className="space-y-2">
                  <span className="px-1 text-sm font-bold text-foreground">{t('classroom.ui.late_threshold_label')}</span>
                  <Input
                    type="number"
                    min={0}
                    value={lateThresholdMin}
                    onChange={event => setLateThresholdMin(Number(event.target.value))}
                    disabled={opening}
                    className="h-12 w-full rounded-2xl bg-muted px-4 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary-brand-light disabled:opacity-60"
                    placeholder={t('classroom.ui.no_time_limit_hint')}
                  />
                </Label>
              </div>

              {/* Camera toggle */}
              <div className={`flex items-center justify-between rounded-2xl px-5 py-4 transition-colors ${cameraRequired ? 'bg-primary-brand-light' : 'bg-muted/40'}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cameraRequired ? 'bg-primary-brand text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Camera size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">{t('classroom.ui.camera_required_label')}</div>
                    <div className="mt-0.5 text-xs font-medium text-muted-foreground">
                      {cameraRequired ? t('classroom.ui.camera_required_short') : t('classroom.ui.camera_optional_label')}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={cameraRequired}
                  onCheckedChange={setCameraRequired}
                  disabled={opening}
                  className="ml-4 shrink-0"
                />
              </div>

              {/* Proctoring rules */}
              <div className="rounded-2xl bg-rose-50/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-700">Giám sát & chống gian lận</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Label className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">Số lần rời tab tối đa</span>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase text-rose-700">Quan trọng</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={maxTabLeaves}
                        onChange={e => setMaxTabLeaves(Math.max(0, Number(e.target.value)))}
                        disabled={opening}
                        className="h-12 w-24 rounded-2xl bg-card px-4 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-muted-foreground">lần (0 = không giới hạn)</span>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground">Vượt quá sẽ tự động nộp bài với phần SV đã làm</p>
                  </Label>

                  <Label className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">Cảnh báo camera tối đa</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">Nâng cao</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        value={maxFaceWarnings}
                        onChange={e => setMaxFaceWarnings(Math.max(0, Number(e.target.value)))}
                        disabled={opening}
                        className="h-12 w-24 rounded-2xl bg-card px-4 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-60"
                      />
                      <span className="text-xs font-bold text-muted-foreground">lần (0 = chỉ log)</span>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground">Số lần mất khuôn mặt trước khi dừng thi</p>
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={opening} className="rounded-[20px] font-bold text-xs h-12 px-6 uppercase tracking-widest">
            {t('classroom.labels.cancel')}
          </Button>
          <Button
            onClick={() => void handleOpenExam()}
            disabled={opening || loading || !selectedExam}
            className="rounded-[20px] bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs h-12 px-8 gap-3 shadow-lg shadow-primary-brand/20 uppercase tracking-widest transition-all"
          >
            {opening ? <Loader2 size={18} className="animate-spin" /> : <Wifi size={18} />}
            {t('classroom.ui.final_exams_open')}
          </Button>
        </div>
      </div>
    </div>
  );
}
