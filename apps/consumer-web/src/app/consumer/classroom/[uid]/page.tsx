'use client';

import * as React from 'react';
import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { classroomApi, meetingRoomApi, examSessionApi, Classroom, Exam, consumerQuizApi } from '@/lib/api';
import type { Message as ChatMessage, ExamSessionInfo, QuizSummary } from '@/lib/api/types';
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
  MonitorUp,
  Camera,
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
  Bot,
  Sparkles,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { useClassroomChat } from '@/lib/hooks/use-classroom-chat';
import { useRTC } from '@/lib/hooks/use-rtc';
import { ScreenShareViewer } from '@/components/rtc/screen-share-viewer';

type ClassroomTab = 'discussion' | 'lessons' | 'assignments' | 'exams' | 'quiz' | 'meeting' | 'ai';

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const time = new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const renderAttachment = () => {
    if (!msg.attachment) return null;
    const { url, name, type } = msg.attachment;

    if (type === "image") {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={name} className="max-w-[240px] rounded-xl mt-1 border border-slate-200 object-cover" />
        </a>
      );
    }
    if (type === "video") {
      return (
        <video controls src={url} className="max-w-[280px] rounded-xl mt-1 border border-slate-200">
          <track kind="captions" />
        </video>
      );
    }
    if (type === "audio") {
      return <audio controls src={url} className="mt-1 w-full max-w-[280px]" />;
    }
    const Icon = type === "pdf" ? FileDown : FileText;
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
        <span className="text-xs font-bold text-indigo-600">{msg.sender_name || "Ẩn danh"}</span>
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
  const [error, setError] = useState("");
  const [membershipStatus, setMembershipStatus] = useState<'approved' | 'pending' | null>(null);
  const [draft, setDraft] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [examError, setExamError] = useState("");
  const [selectedExamGroup, setSelectedExamGroup] = useState<ExamGroupKey | null>(null);
  const [joiningExamUid, setJoiningExamUid] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [activeTab, setActiveTab] = useState<ClassroomTab>("discussion");
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);

  // AI Bot state
  type AiMsg = { role: 'user' | 'assistant'; text: string; loading?: boolean; sources?: Array<{ document: string; metadata: Record<string, string>; score: number }> };
  const [aiMessages, setAiMessages] = useState<AiMsg[]>([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const [docUrlMap, setDocUrlMap] = useState<Record<string, { name: string; url: string }>>({});

  const {
    messages, hasMore, loadingMore, connected, loading: chatLoading,
    sendMessage, scrollContainerRef, topSentinelRef,
  } = useClassroomChat(isAuthenticated ? uid : null);
  const { localStream, remoteStream, localSource, isConnected: rtcConnected, startMediaShare, stopMediaShare } = useRTC(uid);


  useEffect(() => {
    if (!isAuthenticated || !uid) return;

    const fetchClassroom = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await classroomApi.retrieve(uid);
        setClassroom(data);
        setMembershipStatus('approved');
      } catch (err: unknown) {
        const apiData = (err as any)?.data;
        if ((err as any)?.status === 403 && (apiData as any)?.membership_status === 'pending') {
          setMembershipStatus('pending');
        } else {
          setError(err instanceof Error ? err.message : 'Không thể tải thông tin phòng học');
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchClassroom();
  }, [isAuthenticated, uid]);

  useEffect(() => {
    if (!isAuthenticated || !uid) return;

    const fetchExams = async () => {
      try {
        setLoadingExams(true);
        setExamError("");
        const data = await classroomApi.exams(uid);
        setExams((data as Exam[]).filter(exam => exam.status !== 'draft'));
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
        setQuizzes([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    void fetchQuizzes();
  }, [activeTab, isAuthenticated, uid]);

  useEffect(() => {
    if (!loadingMore && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loadingMore, scrollContainerRef]);

  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMessages]);

  const handleAiAsk = async () => {
    if (!aiQuestion.trim() || aiLoading) return;
    const question = aiQuestion.trim();
    setAiQuestion('');
    setAiLoading(true);
    setAiMessages(prev => [...prev, { role: 'user', text: question }, { role: 'assistant', text: '', loading: true }]);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/v1/consumer/course/classrooms/${uid}/ask-stream/`, {
        method: 'POST', headers, body: JSON.stringify({ question }),
      });
      if (!res.ok || !res.body) throw new Error('Không thể kết nối AI');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const ev = JSON.parse(raw) as { type: string; text?: string; data?: AiMsg['sources']; message?: string };
            if (ev.type === 'chunk' && ev.text) {
              setAiMessages(prev => { const last = prev[prev.length - 1]; const next = (last.text + ev.text!).replace(/\n{3,}/g, '\n\n'); return [...prev.slice(0, -1), { ...last, text: next }]; });
            } else if (ev.type === 'sources') {
              setAiMessages(prev => { const last = prev[prev.length - 1]; return [...prev.slice(0, -1), { ...last, loading: false, sources: ev.data }]; });
            } else if (ev.type === 'error') {
              setAiMessages(prev => { const last = prev[prev.length - 1]; return [...prev.slice(0, -1), { ...last, loading: false, text: ev.message ?? 'Có lỗi' }]; });
            }
          } catch { /* ignore */ }
        }
      }
      setAiMessages(prev => { const last = prev[prev.length - 1]; return last.loading ? [...prev.slice(0, -1), { ...last, loading: false }] : prev; });
    } catch (err: unknown) {
      setAiMessages(prev => { const last = prev[prev.length - 1]; return [...prev.slice(0, -1), { ...last, loading: false, text: err instanceof Error ? err.message : 'Có lỗi' }]; });
    } finally { setAiLoading(false); }
  };


  useEffect(() => {
    if (!isAuthenticated || !uid || activeTab !== 'ai' || Object.keys(docUrlMap).length > 0) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    fetch(`${apiBase}/api/v1/consumer/course/classrooms/${uid}/docs/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then((docs: Array<{ uid: string; name: string; url: string }>) => {
        const map: Record<string, { name: string; url: string }> = {};
        for (const d of docs) map[d.uid] = { name: d.name, url: d.url };
        setDocUrlMap(map);
      })
      .catch(() => {});
  }, [isAuthenticated, uid, activeTab, docUrlMap]);

  useEffect(() => {
    if (isAuthenticated && uid && activeTab === 'meeting') {
      const fetchRoom = async () => {
        try {
          setLoadingRoom(true);
          const rooms = await meetingRoomApi.getByClassroom(uid);
          const active = rooms.find(r => r.status === 'active');
          setActiveRoom(active || null);
        } catch (err) {
          console.error('Failed to fetch meeting room:', err);
        } finally {
          setLoadingRoom(false);
        }
      };
      void fetchRoom();
    }
  }, [isAuthenticated, uid, activeTab]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Đang tải dữ liệu lớp học...</p>
      </div>
    );
  }

  if (membershipStatus === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Clock size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Đang chờ phê duyệt</h2>
          <p className="text-slate-500 text-sm">
            Yêu cầu tham gia lớp học của bạn đang chờ giáo viên xem xét. Bạn sẽ có thể vào lớp sau khi được chấp thuận.
          </p>
          <Button onClick={() => router.push('/consumer/classroom')} className="w-full bg-indigo-600">
            Quay lại danh sách
          </Button>
        </div>
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
          <Button onClick={() => router.push('/consumer/classroom')} className="w-full bg-indigo-600">
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

  const handleJoinOnlineExam = async (examUid: string) => {
    setJoiningExamUid(examUid);
    try {
      const session = await examSessionApi.mySession(examUid) as ExamSessionInfo | null;
      if (!session || !session.token) {
        alert('Chưa có phiên thi nào. Vui lòng chờ giáo viên mở phòng thi.');
        return;
      }
      if (session.token_status === 'expired') {
        alert('Link thi đã hết hạn. Vui lòng liên hệ giáo viên.');
        return;
      }
      if (session.token_status === 'completed') {
        alert('Bạn đã nộp bài cho kỳ thi này rồi.');
        return;
      }
      router.push(`/consumer/exam-session/${session.token}`);
    } catch {
      alert('Không thể vào phòng thi. Vui lòng thử lại.');
    } finally {
      setJoiningExamUid(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
                { key: 'quiz' as const, icon: Trophy, label: 'Thi trắc nghiệm' },
                { key: 'meeting' as const, icon: Video, label: 'Phòng họp' },
                { key: 'ai' as const, icon: Bot, label: 'AI Trợ giảng' },
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

            {/* Exam Quiz Tab */}
            {activeTab === 'quiz' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={17} className="text-indigo-600" />
                    <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">Thi trắc nghiệm</span>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-600">
                    {quizzes.length} bài thi
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
                      <p className="text-sm font-medium">Chưa có bài thi nào</p>
                      <p className="text-xs mt-1">Giáo viên chưa phân công bài thi trắc nghiệm cho lớp học này</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {quizzes.map(quiz => (
                        <button
                          key={quiz.uid}
                          type="button"
                          onClick={() => router.push(`/consumer/classroom/${uid}/quiz/${quiz.uid}`)}
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

            {/* Meeting Tab */}
            {activeTab === 'meeting' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ height: '520px' }}>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video size={17} className="text-indigo-600" />
                    <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">Phòng họp trực tuyến</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {rtcConnected ? (
                      <><Wifi size={13} className="text-emerald-500" /><span className="text-emerald-500">Đã kết nối tín hiệu</span></>
                    ) : (
                      <><WifiOff size={13} className="text-slate-400" /><span className="text-slate-400">Đang chờ tín hiệu...</span></>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {remoteStream ? (
                      <ScreenShareViewer stream={remoteStream} label="Giảng viên" />
                    ) : activeRoom ? (
                      <div className="aspect-video bg-indigo-900/20 rounded-2xl flex flex-col items-center justify-center text-indigo-600 gap-4 border-2 border-indigo-200 border-dashed animate-pulse">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Video size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black uppercase tracking-widest">Lớp học đang diễn ra!</p>
                          <p className="text-xs font-medium opacity-80 mt-1">Bấm nút bên dưới để tham gia</p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-3 border-2 border-dashed border-slate-800">
                        <Video size={48} className="opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest">Chưa có buổi học nào...</p>
                      </div>
                    )}

                    {localStream && (
                      <ScreenShareViewer stream={localStream} label={localSource === 'camera' ? 'Camera của bạn' : 'Màn hình của bạn'} />
                    )}
                  </div>

                  <div className="mt-auto flex justify-center gap-4">
                    {!localStream ? (
                      <>
                        <Button
                          onClick={() => void startMediaShare('screen')}
                          className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-12 rounded-xl gap-2 shadow-lg shadow-indigo-100"
                        >
                          <MonitorUp size={18} />
                          CHIA SẺ MÀN HÌNH
                        </Button>
                        <Button
                          onClick={() => void startMediaShare('camera')}
                          variant="outline"
                          className="font-bold px-8 h-12 rounded-xl gap-2"
                        >
                          <Camera size={18} />
                          BẬT CAMERA
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={stopMediaShare}
                        variant="destructive"
                        className="font-bold px-8 h-12 rounded-xl gap-2 shadow-lg shadow-rose-100"
                      >
                        <WifiOff size={18} />
                        DỪNG CHIA SẺ
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    WebRTC Peer-to-Peer Connection • Bảo mật đầu cuối
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ height: '540px' }}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-indigo-50/60 to-violet-50/60">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">AI Trợ giảng</p>
                    <p className="text-[11px] text-slate-400 font-medium">Hỏi đáp từ tài liệu lớp học</p>
                  </div>
                  {aiMessages.length > 0 && (
                    <button onClick={() => setAiMessages([])} className="ml-auto text-xs text-slate-400 hover:text-slate-600 font-medium">Xoá</button>
                  )}
                </div>
                {/* Messages */}
                <div ref={aiScrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {aiMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <Sparkles size={28} className="text-indigo-300 mb-3" />
                      <p className="text-sm font-bold text-slate-700">AI Trợ giảng</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">Đặt câu hỏi về tài liệu của lớp học để nhận câu trả lời ngay!</p>
                    </div>
                  )}
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot size={14} className="text-white" />
                        </div>
                      )}
                      <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-sm'}`}>
                        <div className="text-sm font-medium leading-relaxed space-y-1">
                          {msg.text
                            ? msg.text.split('\n\n').map((para, pi) => (
                                <p key={pi}>
                                  {para.split('\n').map((line, li, arr) => (
                                    <React.Fragment key={li}>
                                      {line}
                                      {li < arr.length - 1 && <br />}
                                    </React.Fragment>
                                  ))}
                                  {pi === msg.text.split('\n\n').length - 1 && msg.loading && (
                                    <span className="inline-block w-0.5 h-3.5 bg-current ml-0.5 animate-pulse rounded align-middle" />
                                  )}
                                </p>
                              ))
                            : msg.loading && (
                                <span className="inline-flex gap-1">{[0,1,2].map(d => (
                                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                                ))}</span>
                              )
                          }
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nguồn tham khảo</p>
                            {msg.sources.slice(0, 3).map((src, j) => {
                              const docName = src.metadata?.doc_name ?? 'Tài liệu';
                              const docUrl = src.metadata?.doc_url
                                ?? docUrlMap[src.metadata?.resource_uid]?.url
                                ?? null;
                              const score = (src.score * 100).toFixed(0);
                              return (
                                <div key={j} className="text-[10px] text-slate-500 flex items-center justify-between gap-2">
                                  {docUrl ? (
                                    <a
                                      href={docUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      className="truncate text-indigo-500 hover:text-indigo-700 hover:underline font-medium"
                                      title={`Xem / tải: ${docName}`}
                                    >
                                      {docName}
                                    </a>
                                  ) : (
                                    <span className="truncate">{docName}</span>
                                  )}
                                  <span className="shrink-0 text-indigo-500 font-bold">{score}%</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Input */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={e => setAiQuestion(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleAiAsk(); } }}
                      placeholder="Đặt câu hỏi về tài liệu lớp học..."
                      disabled={aiLoading}
                      className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                    />
                    <button
                      onClick={() => void handleAiAsk()}
                      disabled={!aiQuestion.trim() || aiLoading}
                      className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-50 transition-colors shrink-0"
                    >
                      {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'discussion' && activeTab !== 'exams' && activeTab !== 'quiz' && activeTab !== 'meeting' && activeTab !== 'ai' && (
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
                          const isOnline = exam.exam_mode === 'online';

                          return (
                            <div
                              key={exam.uid}
                              className={`w-full rounded-2xl border bg-white p-4 shadow-sm ${deadline.cardClassName}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="line-clamp-2 text-sm font-black leading-snug text-slate-900">{exam.title}</h4>
                                    {isOnline && (
                                      <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-black uppercase text-violet-600 ring-1 ring-violet-100">
                                        Online
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">
                                    {exam.description || 'Không có mô tả'}
                                  </p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase ${getExamStatusClass(exam.status)}`}>
                                  {exam.status === 'ongoing' ? '🔴 Đang thi' : exam.status === 'closed' ? 'Đã kết thúc' : exam.status}
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
                                {isOnline && exam.status === 'ongoing' ? (
                                  <button
                                    type="button"
                                    onClick={() => void handleJoinOnlineExam(exam.uid)}
                                    disabled={joiningExamUid === exam.uid}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-violet-700 disabled:opacity-60 animate-pulse"
                                  >
                                    {joiningExamUid === exam.uid ? <Loader2 size={11} className="animate-spin" /> : <Wifi size={11} />}
                                    Vào phòng thi
                                  </button>
                                ) : isOnline && exam.status === 'closed' ? (
                                  <span className="text-[10px] font-black uppercase text-slate-400">
                                    Đã kết thúc
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/consumer/classroom/${uid}/exams/${exam.uid}`)}
                                    className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-700"
                                  >
                                    Xem chi tiết
                                  </button>
                                )}
                              </div>
                            </div>
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
  if (normalized === 'ongoing') {
    return 'bg-rose-50 text-rose-600 border border-rose-100';
  }
  if (normalized === 'published' || normalized === 'active' || normalized === 'open') {
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  }
  if (normalized === 'draft') {
    return 'bg-amber-50 text-amber-600 border border-amber-100';
  }
  if (normalized === 'closed' || normalized === 'expired') {
    return 'bg-slate-100 text-slate-500 border border-slate-200';
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
    .filter(exam => exam.status !== 'draft')
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
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function formatDateTime(value: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}
