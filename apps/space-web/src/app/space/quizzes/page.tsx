'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { quizApi } from '@/lib/api/quiz';
import type { Quiz, GenerateQuizRequest } from '@/lib/api/types';
import {
  Loader2, Plus, Trash2, Eye, BookOpen, FileText,
  UploadCloud, X, Wand2, ChevronRight,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';

export default function QuizLibraryPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoading(true);
        const data = await quizApi.list();
        setQuizzes(data);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách quiz');
      } finally {
        setLoading(false);
      }
    };
    void loadQuizzes();
  }, []);

  const handleDelete = async (quiz: Quiz) => {
    if (!window.confirm(`Xóa quiz "${quiz.title}"? Thao tác này sẽ hủy tất cả phân công lớp học.`)) return;
    try {
      await quizApi.deleteQuiz(quiz.uid);
      setQuizzes(prev => prev.filter(q => q.uid !== quiz.uid));
      toast.success('Đã xóa quiz');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa quiz');
    }
  };

  const handleGenerated = (quiz: Quiz) => {
    setQuizzes(prev => [quiz, ...prev]);
    setShowGenerateModal(false);
    toast.success(`Đã tạo quiz "${quiz.title}"`);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Thư viện Quiz</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Quản lý và tạo quiz từ tài liệu, phân công cho các lớp học
          </p>
        </div>
        <Button
          onClick={() => setShowGenerateModal(true)}
          className="bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 shadow-lg shadow-primary-brand/20"
        >
          <Wand2 size={16} />
          TẠO QUIZ MỚI
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 size={36} className="animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
          <BookOpen size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">Chưa có quiz nào</p>
          <p className="text-xs mt-1 mb-6">Nhấn &ldquo;Tạo Quiz Mới&rdquo; để tạo quiz từ tài liệu PDF hoặc văn bản</p>
          <Button onClick={() => setShowGenerateModal(true)} variant="outline" className="rounded-xl gap-2 font-bold text-xs">
            <Plus size={16} /> TẠO QUIZ ĐẦU TIÊN
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map(quiz => (
            <div
              key={quiz.uid}
              className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary-brand/50 transition-all group p-5 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand shrink-0">
                  <BookOpen size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  quiz.status === 'published'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : quiz.status === 'archived'
                    ? 'bg-muted text-muted-foreground border-border'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {quiz.status}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-black text-foreground text-sm leading-snug line-clamp-2">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-2">{quiz.description}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase">
                  <span>{quiz.questions_count} câu hỏi</span>
                  {quiz.assigned_classrooms && quiz.assigned_classrooms.length > 0 && (
                    <span className="text-primary-brand">{quiz.assigned_classrooms.length} lớp</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/space/quizzes/${quiz.uid}`)}
                  className="flex-1 h-8 rounded-lg gap-1.5 text-xs font-bold"
                >
                  <Eye size={14} />
                  Xem chi tiết
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void handleDelete(quiz)}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showGenerateModal && (
        <GenerateQuizModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={handleGenerated}
        />
      )}
    </div>
  );
}

// ── Generate Quiz Modal ────────────────────────────────────────────────────────

const QUIZ_TYPE_OPTIONS = [
  { value: 'multiple_choice', label: 'Trắc nghiệm 4 đáp án', desc: 'Mỗi câu có 4 lựa chọn, 1 đáp án đúng', icon: '🔘' },
  { value: 'true_false',      label: 'Đúng / Sai',            desc: 'Câu phát biểu — học sinh chọn đúng hoặc sai', icon: '✅' },
  { value: 'fill_blank',      label: 'Điền vào chỗ trống',    desc: 'Câu có chỗ trống, chọn từ đúng để điền', icon: '✏️' },
  { value: 'scenario',        label: 'Tình huống thực tế',    desc: 'Câu hỏi gắn với kịch bản, áp dụng kiến thức', icon: '🎯' },
] as const;

type QuizTypeValue = typeof QUIZ_TYPE_OPTIONS[number]['value'];
type StreamPhase = 'idle' | 'streaming' | 'done' | 'error';

function GenerateQuizModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (quiz: Quiz) => void }) {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [quizType, setQuizType] = useState<QuizTypeValue>('multiple_choice');
  const [numQuestions, setNumQuestions] = useState(10);
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<StreamPhase>('idle');
  const [streamTitle, setStreamTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [lastQuestion, setLastQuestion] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const generating = phase === 'streaming';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSelectedFile(file);
  };

  const handleGenerate = async () => {
    if (mode === 'text' && !content.trim()) { toast.error('Vui lòng nhập nội dung văn bản'); return; }
    if (mode === 'file' && !selectedFile) { toast.error('Vui lòng chọn tài liệu PDF'); return; }

    setPhase('streaming');
    setProgress(0);
    setLastQuestion('');
    setStreamTitle('');
    setErrorMsg('');

    const payload: GenerateQuizRequest = {
      ...(mode === 'text' ? { content } : {}),
      quiz_type: quizType,
      num_questions: numQuestions,
    };

    try {
      let finalUid = '';
      let finalTitle = '';
      let finalTotal = 0;

      for await (const event of quizApi.generateStream(payload, mode === 'file' ? selectedFile! : undefined)) {
        if (event.type === 'error') { setErrorMsg(event.detail); setPhase('error'); return; }
        if (event.type === 'meta') { finalTitle = event.title; setStreamTitle(event.title); finalUid = event.quiz_uid || ''; }
        if (event.type === 'question') { setProgress(event.index + 1); setLastQuestion(event.question); finalTotal = event.index + 1; }
        if (event.type === 'done') {
          finalUid = event.quiz_uid || finalUid;
          finalTotal = event.total;
          setPhase('done');
          if (!finalUid) {
            setErrorMsg('Không nhận được ID quiz từ server. Quiz có thể đã được tạo — vui lòng tải lại trang.');
            setPhase('error');
            return;
          }
          try {
            const quiz = await quizApi.retrieve(finalUid);
            onSuccess(quiz);
          } catch {
            onSuccess({ uid: finalUid, created_by: '', title: finalTitle, description: '', questions_count: finalTotal, status: 'published' });
          }
          return;
        }
      }
      // Stream ended without a done event
      setErrorMsg('Kết nối stream bị ngắt. Quiz có thể đã được tạo — vui lòng tải lại trang.');
      setPhase('error');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Tạo quiz thất bại');
      setPhase('error');
    }
  };

  const pct = numQuestions > 0 ? Math.round((progress / numQuestions) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[90vh] overflow-y-auto">

        {/* Modal header */}
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-black text-foreground">Tạo Quiz bằng AI</h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Chọn loại quiz và tải lên tài liệu</p>
          </div>
          {!generating && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground hover:text-foreground">
              <X size={20} />
            </Button>
          )}
        </div>

        {/* Streaming / result panel */}
        {(phase === 'streaming' || phase === 'done' || phase === 'error') ? (
          <div className="p-8 flex flex-col items-center gap-6 min-h-[300px] justify-center">
            {phase === 'error' ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <X size={28} />
                </div>
                <div className="text-center">
                  <p className="font-black text-foreground text-sm">Có lỗi xảy ra</p>
                  <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
                </div>
                <Button onClick={() => setPhase('idle')} variant="outline" className="rounded-xl font-bold text-xs h-10 px-6">
                  Thử lại
                </Button>
              </>
            ) : phase === 'done' ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <ChevronRight size={28} />
                </div>
                <div className="text-center">
                  <p className="font-black text-foreground">{streamTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">Đã tạo {progress} câu hỏi thành công</p>
                </div>
              </>
            ) : (
              <>
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="var(--primary-brand)" strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                      className="transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-primary-brand">{progress}</span>
                    <span className="text-[10px] font-bold text-muted-foreground">/ {numQuestions}</span>
                  </div>
                </div>
                <div className="text-center space-y-1 w-full max-w-sm">
                  {streamTitle && <p className="font-black text-foreground text-sm truncate">{streamTitle}</p>}
                  <p className="text-xs text-primary-brand font-medium animate-pulse">AI đang tạo câu hỏi...</p>
                  {lastQuestion && (
                    <p className="text-[11px] text-muted-foreground font-medium mt-3 line-clamp-2 leading-relaxed bg-muted rounded-xl px-4 py-2 border border-border">
                      {lastQuestion}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Config form */
          <div className="p-6 space-y-6">
            {/* Quiz type */}
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Loại câu hỏi</div>
              <div className="grid grid-cols-2 gap-2">
                {QUIZ_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuizType(opt.value)}
                    className={`text-left rounded-2xl border-2 px-4 py-3 transition-all ${
                      quizType === opt.value
                        ? 'border-primary-brand bg-primary-brand/10'
                        : 'border-border bg-muted/50 hover:border-primary-brand/50'
                    }`}
                  >
                    <div className="text-lg mb-1">{opt.icon}</div>
                    <div className={`text-xs font-black ${quizType === opt.value ? 'text-primary-brand' : 'text-foreground'}`}>
                      {opt.label}
                    </div>
                    <div className="text-[10px] font-medium text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Num questions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Số câu hỏi</div>
                <span className="text-sm font-black text-primary-brand">{numQuestions} câu</span>
              </div>
              <input
                type="range" min={5} max={30} step={5}
                value={numQuestions}
                onChange={e => setNumQuestions(Number(e.target.value))}
                className="w-full accent-primary-brand"
              />
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
              </div>
            </div>

            {/* Source */}
            <div className="space-y-3">
              <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Nguồn tài liệu</div>
              <div className="flex gap-2">
                {([['text', 'Nhập văn bản'], ['file', 'Tải lên PDF']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                      mode === key
                        ? 'bg-primary-brand text-white shadow-lg shadow-primary-brand/20'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === 'text' ? (
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Dán nội dung tài liệu vào đây..."
                  rows={6}
                  className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand/20 resize-none transition"
                />
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed border-border hover:border-primary-brand bg-muted/30 hover:bg-primary-brand/5 transition cursor-pointer"
                >
                  <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                  {selectedFile ? (
                    <>
                      <FileText size={28} className="text-primary-brand mb-2" />
                      <p className="text-sm font-bold text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-primary-brand font-medium mt-1">Nhấn để đổi tệp</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={28} className="text-muted-foreground mb-2" />
                      <p className="text-sm font-bold text-foreground">Kéo thả hoặc nhấn để chọn</p>
                      <p className="text-xs text-muted-foreground mt-1">Chỉ chấp nhận file PDF</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {phase === 'idle' && (
          <div className="p-6 pt-0 flex gap-3 sticky bottom-0 bg-card border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl font-bold text-xs h-11">
              Hủy
            </Button>
            <Button
              onClick={() => void handleGenerate()}
              className="flex-1 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl font-bold text-xs h-11 gap-2 shadow-lg shadow-primary-brand/20"
            >
              <Wand2 size={16} /> TẠO {numQuestions} CÂU HỎI
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
