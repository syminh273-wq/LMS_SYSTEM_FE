'use client';

import * as React from 'react';
import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { classroomApi, meetingRoomApi, examSessionApi, Classroom, Exam, consumerQuizApi } from '@/lib/api';
import type { Message as ChatMessage, ExamSessionInfo, QuizSummary } from '@/lib/api/types';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { toast } from 'sonner';
import { sendJoinClassroomNotification } from '@/lib/firebase-notifications';
import { useMembershipRealtime } from '@/lib/hooks/use-membership-realtime';
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

function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const [showFullTime, setShowFullTime] = React.useState(false);
  const time = new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const fullTime = new Date(msg.created_at).toLocaleString("vi-VN", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit"
  });

  const initials = msg.sender_name
    ? msg.sender_name.slice(0, 2).toUpperCase()
    : '??';

  const renderAttachment = () => {
    if (!msg.attachment) return null;
    const { url, name, type } = msg.attachment;

    if (type === "image") {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={name} className="max-w-[240px] rounded-xl mt-1 border border-slate-200 object-cover shadow-sm transition-transform hover:scale-[1.02]" />
        </a>
      );
    }
    if (type === "video") {
      return (
        <video controls src={url} className="max-w-[280px] rounded-xl mt-1 border border-slate-200 shadow-sm">
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
        className={`flex items-center gap-2 mt-1 border rounded-xl px-3 py-2.5 transition-all max-w-[280px] shadow-sm ${
          isMe 
            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
            : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200'
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-indigo-50'}`}>
          <Icon size={18} className={isMe ? 'text-white' : 'text-indigo-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold truncate leading-none">{name}</p>
          <p className={`text-[8px] mt-0.5 uppercase font-black tracking-widest ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
            {type} file
          </p>
        </div>
      </a>
    );
  };

  return (
    <div className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
      {!isMe && (
        <div className="flex items-center gap-2 mb-0.5 ml-1">
          <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[#4F46E5] text-[9px] font-black flex items-center justify-center border border-indigo-100/50">
            {initials}
          </div>
          <span className="text-[10px] font-black text-slate-500 tracking-tight uppercase">
            {msg.sender_name || "Ẩn danh"}
          </span>
        </div>
      )}
      <div 
        className={`max-w-[85%] group relative cursor-pointer`}
        onClick={() => setShowFullTime(!showFullTime)}
      >
        {msg.content && (
          <div className={`rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm transition-all active:scale-[0.98] ${
            isMe 
              ? 'bg-[#4F46E5] text-white rounded-tr-sm shadow-indigo-100/50' 
              : 'bg-white border border-gray-100 text-slate-700 rounded-tl-sm'
          }`}>
            {msg.content}
          </div>
        )}
        {renderAttachment()}
        
        <div className={`overflow-hidden transition-all duration-300 ${showFullTime ? 'max-h-10 mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
          <p className={`text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-indigo-400 text-right' : 'text-slate-400'}`}>
            {fullTime}
          </p>
        </div>
      </div>
      {!showFullTime && (
        <span className={`text-[9px] font-black text-slate-400 px-1 uppercase tracking-tighter ${isMe ? 'text-right' : ''}`}>
          {time}
        </span>
      )}
    </div>
  );
}

export default function ClassroomDetailPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const router = useRouter();
  const { isAuthenticated, mounted } = useRequireAuth();
  const userId = useSelector((state: RootState) => state.user.profile?.uid);
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
  type AiSource = { doc_name: string; resource_uid?: string; doc_url?: string; pages?: number[]; score?: number };
  type AiMsg = { role: 'user' | 'assistant'; text: string; loading?: boolean; sources?: AiSource[] };
  type AiSession = { session_id: string; title: string; msg_count: number; updated_at: string | null };

  const [aiView, setAiView] = useState<'list' | 'chat'>('list');
  const [aiSessions, setAiSessions] = useState<AiSession[]>([]);
  const [aiSessionsLoading, setAiSessionsLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMsg[]>([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const [docUrlMap, setDocUrlMap] = useState<Record<string, { name: string; url: string }>>({});
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiSessionLoading, setAiSessionLoading] = useState(false);

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

  const _apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const _apiHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  const fetchSessionList = async () => {
    setAiSessionsLoading(true);
    try {
      const res = await fetch(`${_apiBase}/api/v1/consumer/course/classrooms/${uid}/ai-sessions/`, { headers: _apiHeaders() });
      if (res.ok) setAiSessions(await res.json() as AiSession[]);
    } catch { /* ignore */ }
    finally { setAiSessionsLoading(false); }
  };

  const handleSelectSession = async (sessionId: string) => {
    setAiSessionLoading(true);
    try {
      const res = await fetch(
        `${_apiBase}/api/v1/consumer/course/classrooms/${uid}/ai-session/history/?session_id=${sessionId}`,
        { headers: _apiHeaders() }
      );
      if (res.ok) {
        const data = await res.json() as { session_id: string; messages: Array<{ role: string; content: string }> };
        setAiSessionId(data.session_id);
        setAiMessages(data.messages.map(m => ({ role: m.role as 'user' | 'assistant', text: m.content })));
        setAiView('chat');
      }
    } catch { /* ignore */ }
    finally { setAiSessionLoading(false); }
  };

  const fetchAiSession = async (oldSessionId?: string) => {
    try {
      setAiSessionLoading(true);
      const res = await fetch(`${_apiBase}/api/v1/consumer/course/classrooms/${uid}/ai-session/`, {
        method: 'POST',
        headers: _apiHeaders(),
        body: JSON.stringify(oldSessionId ? { session_id: oldSessionId } : {}),
      });
      if (res.ok) {
        const data = await res.json() as { session_id: string };
        setAiSessionId(data.session_id);
      }
    } catch { /* ignore */ }
    finally { setAiSessionLoading(false); }
  };

  const handleNewSession = async () => {
    await fetchAiSession();
    setAiMessages([]);
    setAiView('chat');
  };

  const handleClearSession = async () => {
    setAiMessages([]);
    await fetchAiSession(aiSessionId ?? undefined);
    setAiView('chat');
  };

  const handleBackToList = async () => {
    setAiView('list');
    setAiSessionId(null);
    setAiMessages([]);
    await fetchSessionList();
  };

  const handleAiAsk = async () => {
    if (!aiQuestion.trim() || aiLoading || !aiSessionId) return;
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
        method: 'POST', headers, body: JSON.stringify({ question, session_id: aiSessionId, mode: 'doc' }),
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
    if (!isAuthenticated || !uid || activeTab !== 'ai') return;
    void fetchSessionList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, uid, activeTab]);

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
    <div className="flex-1 flex flex-col bg-[#F8FAFF] dark:bg-background">
      {/* Banner Section */}
      <div className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white p-8 md:p-12 relative overflow-hidden mx-6 mt-6 rounded-[32px] shadow-xl shadow-indigo-100/50">
        <div className="absolute top-0 right-0 w-1/4 h-full bg-white/5 skew-x-[-15deg] translate-x-1/4" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2.5">
             <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">
                Mã lớp: {classroom.pid}
             </div>
             <div className="px-3 py-1 bg-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest text-[#064E3B] flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#064E3B] animate-pulse" />
                Active
             </div>
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              {classroom.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-indigo-50 text-sm font-semibold opacity-90">
              <span className="flex items-center gap-1.5"><BookOpen size={16} /> Advanced Scientific Research</span>
              <span className="hidden md:block w-1 h-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1.5"><Users size={16} /> 123 Students enrolled</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8">
        {/* Left Content Area */}
        <div className="flex-1 space-y-8">
          {/* Custom Tabs */}
          <div className="bg-white dark:bg-card p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-border flex flex-wrap items-center gap-1">
            {[
              { id: 'discussion' as const, label: 'Thảo luận', icon: MessageSquare },
              { id: 'lessons' as const, label: 'Bài học', icon: BookOpen },
              { id: 'assignments' as const, label: 'Bài tập', icon: ClipboardList },
              { id: 'exams' as const, label: 'Bài kiểm tra', icon: FileText },
              { id: 'quiz' as const, label: 'Thi trắc nghiệm', icon: Trophy },
              { id: 'ai' as const, label: 'AI Trợ giảng', icon: Bot },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/20' 
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-muted/50 dark:text-gray-400'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-card rounded-[32px] border border-gray-100 dark:border-border shadow-sm min-h-[500px] flex flex-col overflow-hidden">
            {activeTab === 'discussion' && (
              <>
                <div className="p-6 border-b border-gray-50 dark:border-border/50 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4F46E5] shadow-sm">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Thảo luận chung</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          {connected ? 'Trực tuyến' : 'Ngoại tuyến'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white dark:border-card flex items-center justify-center text-[8px] font-bold text-gray-500">
                        U{i}
                      </div>
                    ))}
                    <div className="w-7 h-7 rounded-full bg-indigo-50 border-2 border-white dark:border-card flex items-center justify-center text-[8px] font-bold text-[#4F46E5]">
                      +12
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar" ref={scrollContainerRef}>
                  <div ref={topSentinelRef} />
                  {loadingMore && (
                    <div className="flex justify-center py-2">
                      <Loader2 className="animate-spin text-gray-400" size={16} />
                    </div>
                  )}
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-muted rounded-full flex items-center justify-center">
                         <MessageSquare size={32} className="text-gray-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900 dark:text-white">Chưa có tin nhắn nào.</p>
                        <p className="text-xs text-gray-500 max-w-[240px]">Hãy bắt đầu cuộc hội thoại bằng cách đặt câu hỏi hoặc chia sẻ tài liệu hữu ích với lớp học của bạn!</p>
                      </div>
                      <button 
                        onClick={() => document.querySelector('textarea')?.focus()}
                        className="bg-[#4F46E5] text-white px-6 py-2 rounded-xl font-bold text-xs"
                      >
                        Bắt đầu thảo luận
                      </button>
                    </div>
                  ) : (
                    messages.map((m: ChatMessage) => <MessageBubble key={m.uid} msg={m} isMe={m.sender_id === userId} />)
                  )}
                </div>

                <div className="p-6 bg-gray-50/50 dark:bg-muted/20 border-t border-gray-50 dark:border-border/50">
                   <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#4F46E5]/20 transition-all">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Nhập nội dung thảo luận..."
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium resize-none min-h-[80px] p-2 dark:text-white"
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(draft); setDraft(""); } }}
                      />
                      <div className="flex items-center justify-between border-t border-gray-50 dark:border-border/50 pt-2 px-1">
                        <div className="flex gap-1">
                          {[ImageIcon, File, Video].map((Icon, i) => (
                            <button key={i} className="p-2 text-gray-400 hover:text-[#4F46E5] hover:bg-gray-50 dark:hover:bg-muted rounded-lg transition-colors">
                               <Icon size={18} />
                            </button>
                          ))}
                        </div>
                        <button
                          disabled={!draft.trim() || !connected}
                          onClick={() => { sendMessage(draft); setDraft(""); }}
                          className="bg-[#4F46E5] text-white p-2.5 rounded-xl hover:bg-[#4338CA] disabled:opacity-50 transition-all shadow-lg shadow-[#4F46E5]/20 active:scale-95"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                   </div>
                </div>
              </>
            )}
            
            {activeTab === 'exams' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Bài kiểm tra</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{exams.length} bài kiểm tra</p>
                    </div>
                  </div>
                </div>

                {loadingExams ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 size={28} className="animate-spin text-[#4F46E5]" />
                  </div>
                ) : examError ? (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-600">
                    {examError}
                  </div>
                ) : exams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400">
                    <ClipboardList size={38} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">Chưa có bài kiểm tra nào</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {groupedExams.map(group => (
                        <button
                          key={group.key}
                          type="button"
                          onClick={() => setSelectedExamGroup(group.key)}
                          className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                            selectedExamGroup === group.key
                              ? 'border-[#4F46E5]/30 bg-indigo-50 shadow-sm dark:bg-indigo-900/20'
                              : 'border-gray-100 bg-gray-50/60 dark:bg-muted/40 dark:border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-black text-gray-900 dark:text-white">{group.label}</div>
                              <div className="text-[10px] font-black uppercase text-gray-400">{group.items.length} bài</div>
                            </div>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-card text-[#4F46E5] shadow-sm ring-1 ring-gray-100 dark:ring-border">
                              <ClipboardList size={17} />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedGroup && (
                      <div className="rounded-2xl border border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/30 p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-[#4F46E5]">Danh sách bài kiểm tra</div>
                            <h4 className="mt-1 text-lg font-black text-gray-900 dark:text-white">{selectedGroup.label}</h4>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedExamGroup(null)} className="rounded-lg text-xs font-bold">
                            Đóng
                          </Button>
                        </div>

                        {selectedGroup.items.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-28 rounded-2xl border border-dashed border-gray-200 bg-white dark:bg-card text-center text-gray-400">
                            <ClipboardList size={24} className="mb-2 opacity-30" />
                            <p className="text-xs font-bold">Chưa có bài kiểm tra nào trong nhóm này</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedGroup.items.map(exam => {
                              const deadline = getDeadlineMeta(exam.due_date);
                              const ContentIcon = getContentTypeIcon(exam.content_type);
                              const isOnline = exam.exam_mode === 'online';

                              return (
                                <button
                                  key={exam.uid}
                                  type="button"
                                  disabled={joiningExamUid === exam.uid}
                                  onClick={() => isOnline ? handleJoinOnlineExam(exam.uid) : router.push(`/consumer/classroom/${uid}/exams/${exam.uid}`)}
                                  className={`w-full rounded-2xl border bg-white dark:bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 disabled:opacity-60 ${deadline.cardClassName}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <h4 className="line-clamp-2 text-sm font-black leading-snug text-gray-900 dark:text-white">{exam.title}</h4>
                                      <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-gray-500">
                                        {exam.description || 'Không có mô tả'}
                                      </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                      <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${getExamStatusClass(exam.status)}`}>
                                        {exam.status}
                                      </span>
                                      {isOnline && (
                                        <span className="rounded-full px-2 py-1 text-[9px] font-black uppercase bg-indigo-50 text-[#4F46E5] border border-indigo-100 flex items-center gap-1">
                                          <Wifi size={10} /> Online
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className={`mt-3 rounded-xl border px-3 py-2 ${deadline.badgeClassName}`}>
                                    <div className="flex items-center gap-2">
                                      <Clock size={14} className="shrink-0" />
                                      <div className="min-w-0">
                                        <div className="truncate text-xs font-black">{deadline.label}</div>
                                        <div className="truncate text-[10px] font-bold opacity-80">{formatDateTime(exam.due_date)}</div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3 flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 dark:bg-muted px-2.5 py-1 text-[10px] font-black uppercase text-gray-500 ring-1 ring-gray-100 dark:ring-border">
                                      <ContentIcon size={12} />
                                      {getContentTypeLabel(exam.content_type)}
                                    </span>
                                    <span className="text-[10px] font-black uppercase text-[#4F46E5]">
                                      {joiningExamUid === exam.uid ? 'Đang vào...' : isOnline ? 'Vào phòng thi' : 'Xem chi tiết'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Thi trắc nghiệm</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{quizzes.length} quiz</p>
                  </div>
                </div>

                {loadingQuizzes ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 size={28} className="animate-spin text-[#4F46E5]" />
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400">
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
                        onClick={() => router.push(`/consumer/classroom/${uid}/quiz/${quiz.uid}`)}
                        className="w-full flex items-center gap-4 rounded-2xl border border-gray-100 dark:border-border bg-gray-50/60 dark:bg-muted/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                          <Trophy size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-gray-900 dark:text-white text-sm truncate">{quiz.title}</h4>
                          {quiz.description && (
                            <p className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-1">{quiz.description}</p>
                          )}
                          <div className="mt-1 text-[10px] font-black uppercase text-[#4F46E5]">
                            {quiz.questions_count} câu hỏi trắc nghiệm
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ai' && aiView === 'list' && (
              <>
                {/* Session List Header */}
                <div className="p-6 border-b border-gray-50 dark:border-border/50 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4F46E5] shadow-sm">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">AI Trợ giảng</h2>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Chọn hoặc bắt đầu hội thoại</p>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleNewSession()}
                    disabled={aiSessionLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-all disabled:opacity-50 shadow-lg shadow-[#4F46E5]/20"
                  >
                    {aiSessionLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Hội thoại mới
                  </button>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {aiSessionsLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 size={28} className="animate-spin text-[#4F46E5]" />
                    </div>
                  ) : aiSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center space-y-3 opacity-60">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Bot size={28} className="text-[#4F46E5]" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-gray-900 dark:text-white text-sm">Chưa có hội thoại nào</p>
                        <p className="text-xs text-gray-500">Bấm &quot;Hội thoại mới&quot; để bắt đầu</p>
                      </div>
                    </div>
                  ) : (
                    aiSessions.map(s => (
                      <button
                        key={s.session_id}
                        onClick={() => void handleSelectSession(s.session_id)}
                        disabled={aiSessionLoading}
                        className="w-full flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-border bg-gray-50/60 dark:bg-muted/40 hover:border-indigo-200 hover:bg-indigo-50/30 hover:-translate-y-0.5 hover:shadow-md transition-all text-left disabled:opacity-50"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot size={18} className="text-[#4F46E5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 dark:text-white truncate">{s.title || 'Hội thoại mới'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{s.msg_count} câu hỏi</span>
                            {s.updated_at && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="text-[10px] font-bold text-gray-400">
                                  {new Date(s.updated_at).toLocaleDateString('vi-VN')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 shrink-0 mt-1" />
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'ai' && aiView === 'chat' && (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-50 dark:border-border/50 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => void handleBackToList()}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#4F46E5] hover:bg-indigo-50 transition-all"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                      <Sparkles size={16} />
                    </div>
                    <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">AI Trợ giảng</h2>
                  </div>
                  <button
                    onClick={() => void handleClearSession()}
                    disabled={aiLoading || aiSessionLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide text-gray-500 hover:text-[#4F46E5] hover:bg-indigo-50 transition-all disabled:opacity-40"
                  >
                    {aiSessionLoading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                    Hội thoại mới
                  </button>
                </div>

                {/* Chat Messages */}
                <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 min-h-[320px]">
                  {aiMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 opacity-60">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Bot size={28} className="text-[#4F46E5]" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-gray-900 dark:text-white text-sm">Xin chào! Tôi là AI Trợ giảng.</p>
                        <p className="text-xs text-gray-500 max-w-[240px]">Hãy đặt câu hỏi về nội dung tài liệu trong lớp học.</p>
                      </div>
                    </div>
                  )}
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 ml-1 mb-0.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Sparkles size={11} className="text-[#4F46E5]" />
                          </div>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">AI</span>
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-[#4F46E5] text-white rounded-tr-sm'
                          : 'bg-white border border-gray-100 text-slate-700 rounded-tl-sm'
                      }`}>
                        {msg.loading ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        )}
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1 ml-1">
                          {msg.sources.map((src, si) => {
                            const docInfo = src.resource_uid ? docUrlMap[src.resource_uid] : null;
                            const label = docInfo?.name ?? src.doc_name ?? 'Tài liệu';
                            const href = docInfo?.url ?? src.doc_url;
                            return href ? (
                              <a key={si} href={href} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-[#4F46E5] rounded-lg text-[10px] font-black hover:bg-indigo-100 transition-colors">
                                <FileText size={10} />
                                {label}{src.pages && src.pages.length > 0 ? ` (tr.${src.pages.join(',')})` : ''}
                              </a>
                            ) : (
                              <span key={si} className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-black">
                                <FileText size={10} />
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-6 bg-gray-50/50 dark:bg-muted/20 border-t border-gray-50 dark:border-border/50">
                  <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#4F46E5]/20 transition-all">
                    <textarea
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder={aiSessionId ? 'Đặt câu hỏi về tài liệu lớp học...' : 'Đang khởi tạo phiên...'}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium resize-none min-h-[72px] p-2 dark:text-white"
                      disabled={aiLoading || !aiSessionId}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleAiAsk(); } }}
                    />
                    <div className="flex items-center justify-end border-t border-gray-50 dark:border-border/50 pt-2 px-1">
                      <button
                        disabled={!aiQuestion.trim() || aiLoading || !aiSessionId}
                        onClick={() => void handleAiAsk()}
                        className="bg-[#4F46E5] text-white p-2.5 rounded-xl hover:bg-[#4338CA] disabled:opacity-50 transition-all shadow-lg shadow-[#4F46E5]/20 active:scale-95 flex items-center gap-2 px-4 text-[11px] font-black uppercase tracking-wide"
                      >
                        {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                        {aiLoading ? 'Đang trả lời...' : 'Gửi'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab !== 'discussion' && activeTab !== 'exams' && activeTab !== 'quiz' && activeTab !== 'ai' && (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-12 space-y-4">
                <div className="w-20 h-20 bg-gray-50 dark:bg-muted/50 rounded-3xl flex items-center justify-center">
                  <FileText className="text-gray-300" size={32} />
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Chưa có nội dung</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm font-medium leading-relaxed">
                  Giáo viên chưa đăng nội dung cho phần này.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Info Area */}
        <div className="w-full lg:w-[380px] space-y-8">
          <Card className="rounded-[32px] border-gray-100 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden">
             <CardHeader className="p-6 pb-2 flex flex-row items-center gap-3">
                <Info size={18} className="text-[#4F46E5]" />
                <h2 className="text-[13px] font-black text-[#4F46E5] uppercase tracking-widest">Thông tin lớp học</h2>
             </CardHeader>
             <CardContent className="p-6 pt-2 space-y-5">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-muted/50 rounded-2xl group transition-all hover:bg-white dark:hover:bg-card border border-transparent hover:border-gray-100 dark:hover:border-border hover:shadow-xl hover:shadow-[#4F46E5]/5">
                   <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[#4F46E5]">
                      <Users size={20} />
                   </div>
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sĩ số tối đa</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">30 học sinh</p>
                   </div>
                   <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <div className="bg-emerald-500 rounded-full w-2 h-2 p-0 border-none" />
                   </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-muted/50 rounded-2xl group transition-all hover:bg-white dark:hover:bg-card border border-transparent hover:border-gray-100 dark:hover:border-border hover:shadow-xl hover:shadow-[#4F46E5]/5">
                   <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[#4F46E5]">
                      <Calendar size={20} />
                   </div>
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngày khởi tạo</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">1/6/2026</p>
                   </div>
                </div>

                <div className="space-y-3 p-4 bg-[#F8FAFF] dark:bg-muted/30 rounded-2xl">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mô tả</p>
                   <p className="text-sm italic font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                      &quot;{classroom.description || 'Khóa học chuyên sâu về các kiến thức cốt lõi và ứng dụng thực tế.'}&quot;
                   </p>
                </div>

                <button className="w-full bg-[#0F172A] hover:bg-black text-white h-12 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] transition-all shadow-lg shadow-gray-100 dark:shadow-none active:scale-95">
                   Yêu cầu trợ giúp
                </button>
             </CardContent>
          </Card>

          <Card className="rounded-[32px] border-none bg-white dark:bg-card shadow-sm overflow-hidden group">
             <div className="relative h-64">
                <div className="absolute inset-0 bg-gray-900">
                  <img 
                    src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80" 
                    alt="Library" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                   <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Thư viện tài liệu</p>
                   <h3 className="text-white font-black text-lg leading-tight">Khám phá kho tàng kiến thức được chia sẻ riêng cho lớp.</h3>
                </div>
             </div>
          </Card>
        </div>
      </div>
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
