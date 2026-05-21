'use client';

import * as React from 'react';
import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { classroomApi, Classroom, Exam, consumerQuizApi } from '@/lib/api';
import type { ChatMessage, QuizSummary } from '@/lib/api/types';
import {
  Loader2,
  ArrowLeft,
  Users,
  Info,
  Calendar,
  BookOpen,
  MessageSquare,
  FileText,
  Video,
  ShieldCheck,
  Send,
  Wifi,
  WifiOff,
  FileDown,
  ClipboardList,
  Clock,
  File,
  Image as ImageIcon,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { useClassroomChat } from '@/lib/hooks/use-classroom-chat';

type ClassroomTab = 'discussion' | 'lessons' | 'assignments' | 'exams' | 'quiz' | 'meeting';

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const time = new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const renderAttachment = () => {
    if (!msg.attachment) return null;
    const { url, name, type } = msg.attachment;

    if (type === 'image') {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={name} className="max-w-[240px] rounded-xl mt-1 border border-slate-200 object-cover" />
        </a>
      );
    }
    if (type === 'video') {
      return (
        <video controls src={url} className="max-w-[280px] rounded-xl mt-1 border border-slate-200">
          <track kind="captions" />
        </video>
      );
    }
    if (type === 'audio') {
      return <audio controls src={url} className="mt-1 w-full max-w-[280px]" />;
    }
    // pdf / file
    const Icon = type === 'pdf' ? FileDown : FileText;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 transition max-w-[280px]"
      >
        <Icon size={18} className="text-indigo-500 shrink-0" />
        <span className="text-xs font-medium text-slate-700 truncate">{name}</span>
      </a>
    );
  };

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-bold text-indigo-600">{msg.sender_name || 'Ẩn danh'}</span>
        <span className="text-[10px] text-slate-400">{time}</span>
      </div>
      <div className="max-w-[85%]">
        {msg.content && (
          <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-700 font-medium">
            {msg.content}
          </div>
        )}
        {renderAttachment()}
      </div>
    </div>
  );
}

export default function ClassroomDetailPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const router = useRouter();
  const { isAuthenticated, mounted } = useRequireAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [examError, setExamError] = useState('');
  const [selectedExamGroup, setSelectedExamGroup] = useState<ExamGroupKey | null>(null);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [activeTab, setActiveTab] = useState<ClassroomTab>('discussion');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages, hasMore, loadingMore, connected, loading: chatLoading,
    sendMessage, scrollContainerRef, topSentinelRef,
  } = useClassroomChat(isAuthenticated ? uid : null);

  useEffect(() => {
    if (isAuthenticated && uid) {
      const fetchClassroom = async () => {
        try {
          setLoading(true);
          const data = await classroomApi.retrieve(uid);
          setClassroom(data);
        } catch (err: any) {
          setError(err.message || 'Không thể tải thông tin phòng học');
        } finally {
          setLoading(false);
        }
      };
      
      void fetchClassroom();
    }
  }, [isAuthenticated, uid]);

  useEffect(() => {
    if (!isAuthenticated || !uid) return;

    const fetchExams = async () => {
      try {
        setLoadingExams(true);
        setExamError('');
        // @ts-expect-error exams method may not exist yet
        const data = await classroomApi.exams(uid);
        setExams((data as Exam[]).filter(exam => exam.status === 'published'));
      } catch (err: unknown) {
        setExamError(err instanceof Error ? err.message : 'Không thể tải danh sách bài kiểm tra');
      } finally {
        setLoadingExams(false);
      }
    };

    void fetchExams();
  }, [isAuthenticated, uid]);

  useEffect(() => {
    if (!isAuthenticated || !uid || activeTab !== 'quiz') return;
    const fetchQuizzes = async () => {
      setLoadingQuizzes(true);
      try {
        const data = await consumerQuizApi.listByClassroom(uid);
        setQuizzes(data.filter(q => q.status === 'published'));
      } catch {
        // silently fail — quiz tab shows empty state
      } finally {
        setLoadingQuizzes(false);
      }
    };
    void fetchQuizzes();
  }, [isAuthenticated, uid, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Đang tải dữ liệu lớp học...</p>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <Info size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Lỗi tải dữ liệu</h2>
          <p className="text-slate-500 text-sm">{error || 'Không tìm thấy lớp học'}</p>
          <Button onClick={() => router.push('/classroom')} className="w-full bg-indigo-600">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const groupedExams = getGroupedPublishedExams(exams);
  const selectedGroup = selectedExamGroup
    ? groupedExams.find(group => group.key === selectedExamGroup)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/classroom')}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="h-8 w-[1px] bg-slate-200 mx-1" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold uppercase">
              {classroom.name.substring(0, 2)}
            </div>
            <h1 className="text-lg font-bold text-slate-900 truncate max-w-[200px] md:max-w-md">
              {classroom.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">
            {classroom.status}
          </span>
          <Button size="sm" variant="outline" className="gap-2 font-bold text-xs">
            <Info size={14} />
            THÔNG TIN
          </Button>
        </div>
      </header>

      {/* Hero Banner Section */}
      <div className="bg-indigo-600 h-48 md:h-64 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white" />
          <div className="absolute bottom-[-20px] right-20 w-48 h-48 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-lg bg-white rotate-12" />
        </div>
        <div className="max-w-6xl mx-auto px-6 h-full flex flex-col justify-end pb-8 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center px-2 py-1 rounded bg-black/20 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase mb-2">
              MÃ LỚP: {classroom.pid}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-sm">
              {classroom.name}
            </h2>
            <p className="text-indigo-100 max-w-2xl text-sm md:text-base font-medium line-clamp-2">
              {classroom.description || 'Chào mừng bạn đến với lớp học trực tuyến. Hãy bắt đầu hành trình học tập của mình ngay hôm nay.'}
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions/Nav */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2 flex overflow-x-auto gap-1 shadow-sm no-scrollbar">
              {[
                { key: 'discussion' as const, icon: MessageSquare, label: 'Thảo luận' },
                { key: 'lessons' as const, icon: BookOpen, label: 'Bài học' },
                { key: 'assignments' as const, icon: FileText, label: 'Bài tập' },
                { key: 'exams' as const, icon: ClipboardList, label: 'Bài kiểm tra' },
                { key: 'quiz' as const, icon: Trophy, label: 'Quiz Game' },
                { key: 'meeting' as const, icon: Video, label: 'Phòng họp' }
              ].map((item) => (
                <button 
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === item.key ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Chat Feed */}
            {activeTab === 'discussion' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden" style={{ height: '520px' }}>
                {/* Chat header */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-600" />
                    <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">Thảo luận chung</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {connected ? (
                      <><Wifi size={13} className="text-emerald-500" /><span className="text-emerald-500">Trực tuyến</span></>
                    ) : (
                      <><WifiOff size={13} className="text-slate-400" /><span className="text-slate-400">Đang kết nối...</span></>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {/* Top sentinel — IntersectionObserver triggers loadMore when scrolled here */}
                  <div ref={topSentinelRef} className="h-1" />

                  {loadingMore && (
                    <div className="flex justify-center py-1">
                      <Loader2 size={14} className="text-indigo-400 animate-spin" />
                    </div>
                  )}

                  {chatLoading && (
                    <div className="flex justify-center pt-8">
                      <Loader2 size={24} className="text-indigo-400 animate-spin" />
                    </div>
                  )}

                  {!chatLoading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <MessageSquare size={28} />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">Chưa có tin nhắn nào. Hãy bắt đầu thảo luận!</p>
                    </div>
                  )}

                  {messages.map((msg: ChatMessage) => <MessageBubble key={msg.uid} msg={msg} />)}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
                  <input
                    className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                    placeholder="Nhập tin nhắn..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && draft.trim()) {
                        sendMessage(draft.trim());
                        setDraft('');
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shrink-0"
                    disabled={!draft.trim() || !connected}
                    onClick={() => { sendMessage(draft.trim()); setDraft(''); }}
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* Quiz Game Tab */}
            {activeTab === 'quiz' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={17} className="text-indigo-600" />
                    <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">Quiz Game</span>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-600">
                    {quizzes.length} quiz
                  </span>
                </div>
                <div className="p-5">
                  {loadingQuizzes ? (
                    <div className="flex items-center justify-center h-32 text-slate-400">
                      <Loader2 size={26} className="animate-spin" />
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400">
                      <Trophy size={38} className="mb-3 opacity-30" />
                      <p className="text-sm font-medium">Chưa có quiz nào</p>
                      <p className="text-xs mt-1">Giáo viên chưa phân công quiz cho lớp học này</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {quizzes.map(quiz => (
                        <button
                          key={quiz.uid}
                          type="button"
                          onClick={() => router.push(`/classroom/${uid}/quiz/${quiz.uid}`)}
                          className="w-full flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                            <Trophy size={22} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-900 text-sm truncate">{quiz.title}</h4>
                            {quiz.description && (
                              <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">{quiz.description}</p>
                            )}
                            <div className="mt-1 text-[10px] font-black uppercase text-indigo-500">
                              {quiz.questions_count} câu hỏi trắc nghiệm
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab !== 'discussion' && activeTab !== 'exams' && activeTab !== 'quiz' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
                  <FileText size={38} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nội dung đang được cập nhật.</p>
                </div>
              </div>
            )}


            {/* Exams */}
            {activeTab === 'exams' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={17} className="text-indigo-600" />
                    <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">Bài kiểm tra</span>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-600">
                    {exams.length} bài
                  </span>
                </div>

                <div className="p-5">
                  {loadingExams ? (
                    <div className="flex items-center justify-center h-32 text-slate-400">
                      <Loader2 size={26} className="animate-spin" />
                    </div>
                  ) : examError ? (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-600">
                      {examError}
                    </div>
                  ) : exams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400">
                      <ClipboardList size={38} className="mb-3 opacity-30" />
                      <p className="text-sm font-medium">Chưa có bài kiểm tra nào</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      {groupedExams.map(group => (
                        <button
                          key={group.key}
                          type="button"
                          onClick={() => setSelectedExamGroup(group.key)}
                          className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                            selectedExamGroup === group.key
                              ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                              : 'border-slate-100 bg-slate-50/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-black text-slate-900">{group.label}</div>
                              <div className="text-[10px] font-black uppercase text-slate-400">{group.items.length} bài</div>
                            </div>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100">
                              <ClipboardList size={17} />
                            </div>
                          </div>
                        </button>
                    ))}
                  </div>
                )}

                {selectedGroup && (
                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Danh sách bài kiểm tra</div>
                        <h4 className="mt-1 text-lg font-black text-slate-900">{selectedGroup.label}</h4>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedExamGroup(null)} className="rounded-lg text-xs font-bold">
                        Đóng
                      </Button>
                    </div>

                    {selectedGroup.items.length === 0 ? (
                      <div className="mt-4 flex h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center text-slate-400">
                        <ClipboardList size={24} className="mb-2 opacity-30" />
                        <p className="text-xs font-bold">Chưa có bài kiểm tra nào</p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {selectedGroup.items.map(exam => {
                          const deadline = getDeadlineMeta(exam.due_date);
                          const ContentIcon = getContentTypeIcon(exam.content_type);

                          return (
                            <button
                              key={exam.uid}
                              type="button"
                              onClick={() => router.push(`/classroom/${uid}/exams/${exam.uid}`)}
                              className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 ${deadline.cardClassName}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className="line-clamp-2 text-sm font-black leading-snug text-slate-900">{exam.title}</h4>
                                  <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">
                                    {exam.description || 'Không có mô tả'}
                                  </p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase ${getExamStatusClass(exam.status)}`}>
                                  {exam.status}
                                </span>
                              </div>

                              <div className={`mt-4 rounded-xl border px-3 py-2 ${deadline.badgeClassName}`}>
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="shrink-0" />
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-black">{deadline.label}</div>
                                    <div className="truncate text-[10px] font-bold opacity-80">{formatDateTime(exam.due_date)}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase text-slate-500 ring-1 ring-slate-100">
                                  <ContentIcon size={12} />
                                  {getContentTypeLabel(exam.content_type)}
                                </span>
                                <span className="text-[10px] font-black uppercase text-indigo-500">Xem chi tiết</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                  <Info size={18} className="text-indigo-600" />
                  THÔNG TIN LỚP HỌC
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                      <Users size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sĩ số tối đa</div>
                      <div className="text-sm font-bold text-slate-700">{classroom.max_students} học sinh</div>
                    </div>
                  </div>
                  <ShieldCheck size={18} className="text-emerald-500" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày khởi tạo</div>
                    <div className="text-sm font-bold text-slate-700">{new Date(classroom.created_at).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Mô tả</div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                      "{classroom.description || 'Lớp học này chưa có mô tả chi tiết.'}"
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <Button className="w-full bg-slate-900 hover:bg-black text-white font-bold text-xs tracking-widest h-11 rounded-xl">
                  YÊU CẦU TRỢ GIÚP
                </Button>
              </div>
            </div>

            {/* Support Widget */}
            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-100 relative overflow-hidden group cursor-pointer">
              <div className="absolute right-[-20px] top-[-20px] opacity-20 group-hover:rotate-12 transition-transform duration-500">
                <BookOpen size={120} />
              </div>
              <div className="relative z-10 space-y-3">
                <h4 className="font-black tracking-tight text-xl">Thư viện tài liệu</h4>
                <p className="text-indigo-100 text-xs font-medium">Khám phá kho tàng kiến thức được chia sẻ dành riêng cho lớp học này.</p>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-0 h-auto font-bold text-[10px] tracking-widest gap-2">
                    XEM NGAY <ArrowLeft className="rotate-180" size={12} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getExamStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'published' || normalized === 'active' || normalized === 'open') {
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  }
  if (normalized === 'draft') {
    return 'bg-amber-50 text-amber-600 border border-amber-100';
  }
  if (normalized === 'closed' || normalized === 'expired') {
    return 'bg-rose-50 text-rose-600 border border-rose-100';
  }
  return 'bg-slate-100 text-slate-600 border border-slate-200';
}

const EXAM_GROUPS = [
  {
    key: 'regular',
    label: 'Bài kiểm tra thường xuyên',
    keywords: ['kiem tra thuong xuyen', 'kiểm tra thường xuyên', 'thuong xuyen', 'thường xuyên'],
  },
  {
    key: 'midterm',
    label: 'Kiểm tra giữa kì',
    keywords: ['kiem tra giua ki', 'kiểm tra giữa kì', 'kiểm tra giữa kỳ', 'giua ki', 'giữa kì', 'giữa kỳ'],
  },
  {
    key: 'final',
    label: 'Kiểm tra cuối kì',
    keywords: ['kiem tra cuoi ki', 'kiểm tra cuối kì', 'kiểm tra cuối kỳ', 'cuoi ki', 'cuối kì', 'cuối kỳ'],
  },
] as const;

type ExamGroupKey = typeof EXAM_GROUPS[number]['key'];

function getGroupedPublishedExams(exams: Exam[]) {
  const publishedExams = exams
    .filter(exam => exam.status === 'published')
    .sort((left, right) => getDueTimestamp(left.due_date) - getDueTimestamp(right.due_date));

  return EXAM_GROUPS.map(group => ({
    ...group,
    items: publishedExams.filter(exam => isExamInGroup(exam, group.key)),
  }));
}

function isExamInGroup(exam: Exam, groupKey: typeof EXAM_GROUPS[number]['key']) {
  const title = normalizeText(exam.title);
  const group = EXAM_GROUPS.find(item => item.key === groupKey);
  if (!group) return false;

  if (group.key === 'regular') {
    return group.keywords.some(keyword => title.includes(normalizeText(keyword)))
      || !EXAM_GROUPS.some(item => item.key !== 'regular' && item.keywords.some(keyword => title.includes(normalizeText(keyword))));
  }

  return group.keywords.some(keyword => title.includes(normalizeText(keyword)));
}

function getDueTimestamp(value: string | null) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function getDeadlineMeta(value: string | null) {
  if (!value) {
    return {
      label: 'Chưa có hạn nộp',
      cardClassName: 'border-slate-100 hover:border-indigo-200 focus:ring-indigo-100',
      badgeClassName: 'border-slate-100 bg-slate-50 text-slate-500',
    };
  }

  const due = new Date(value).getTime();
  const hoursLeft = (due - Date.now()) / (1000 * 60 * 60);

  if (Number.isNaN(due)) {
    return {
      label: 'Hạn nộp không hợp lệ',
      cardClassName: 'border-slate-100 hover:border-indigo-200 focus:ring-indigo-100',
      badgeClassName: 'border-slate-100 bg-slate-50 text-slate-500',
    };
  }

  if (hoursLeft <= 0) {
    return {
      label: 'Đã hết hạn',
      cardClassName: 'border-rose-100 hover:border-rose-200 focus:ring-rose-100',
      badgeClassName: 'border-rose-100 bg-rose-50 text-rose-600',
    };
  }

  if (hoursLeft < 24) {
    return {
      label: `Còn ${Math.ceil(hoursLeft)} giờ`,
      cardClassName: 'border-rose-100 hover:border-rose-200 focus:ring-rose-100',
      badgeClassName: 'border-rose-100 bg-rose-50 text-rose-600',
    };
  }

  if (hoursLeft <= 72) {
    return {
      label: `Còn ${Math.ceil(hoursLeft / 24)} ngày`,
      cardClassName: 'border-amber-100 hover:border-amber-200 focus:ring-amber-100',
      badgeClassName: 'border-amber-100 bg-amber-50 text-amber-600',
    };
  }

  return {
    label: `Còn ${Math.ceil(hoursLeft / 24)} ngày`,
    cardClassName: 'border-emerald-100 hover:border-emerald-200 focus:ring-emerald-100',
    badgeClassName: 'border-emerald-100 bg-emerald-50 text-emerald-600',
  };
}

function getContentTypeIcon(contentType: string) {
  if (contentType === 'image') return ImageIcon;
  if (contentType === 'pdf') return FileDown;
  if (contentType === 'file') return File;
  return FileText;
}

function getContentTypeLabel(contentType: string) {
  if (contentType === 'image') return 'image';
  if (contentType === 'pdf') return 'pdf';
  if (contentType === 'file') return 'file';
  return 'markdown';
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatDateTime(value: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}
