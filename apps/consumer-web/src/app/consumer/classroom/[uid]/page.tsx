'use client';

import * as React from 'react';
import { useEffect, useRef, useState, use } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { classroomApi, examSessionApi, Classroom, Exam, consumerQuizApi } from '@/lib/api';
import { consumerQuizCollectionApi } from '@/lib/api/quiz-collection';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import type {
  Message as ChatMessage, ExamSessionInfo, QuizSummary,
  QuizCollection, QuizCollectionDetail, QuizCollectionProgress,
  IssuedCertificate, QuizPublicDetail,
} from '@/lib/api/types';
import {
  Loader2,
  ArrowLeft,
  Users,
  Info,
  CalendarOff,
  Calendar,
  BookOpen,
  MessageSquare,
  FileText,
  Video,
  MonitorUp,
  Camera,
  BarChart3,
  ShieldCheck,
  Send,
  Hash,
  Wifi,
  WifiOff,
  PhoneOff,
  FileDown,
  ClipboardList,
  Clock,
  File,
  Image as ImageIcon,
  Trophy,
  ChevronRight,
  Bot,
  Sparkles,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Lock,
  CheckCircle2,
  Circle,
  ArrowRight,
  FolderOpen,
  Crown,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { useMe } from '@/lib/hooks/use-me';
import { useClassroomChat } from '@/lib/hooks/use-classroom-chat';
import { useRTC } from '@/lib/hooks/use-rtc';
import { useMeetingPresence } from '@/lib/hooks/use-meeting-presence';
import { ScreenShareViewer } from '@/components/rtc/screen-share-viewer';
import { ClassroomDocsViewer } from '@/components/classroom/docs-viewer/ClassroomDocsViewer';
import { ConsumerClassroomCalendarTab } from '@/components/calendar/ConsumerClassroomCalendarTab';
import { LeaveRequestTab } from '@shared/components/leave-request';
import { LeaderboardTab } from '@/components/classroom/LeaderboardTab';
import { consumerCalendarApi, consumerLeaveRequestApi } from '@/lib/api';

type ClassroomTab = 'discussion' | 'docs' | 'assignments' | 'exams' | 'quiz' | 'meeting' | 'ai' | 'collections' | 'calendar' | 'leave_request' | 'leaderboard';

function MessageBubble({ msg, currentUserId }: { msg: ChatMessage; currentUserId: string | null }) {
  const isMe = !!currentUserId && msg.sender_id === currentUserId;
  const time = new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const initials = (msg.sender_name || "?").trim().slice(0, 2).toUpperCase();

  const renderAttachment = () => {
    if (!msg.attachment) return null;
    const { url, name, type } = msg.attachment;

    if (type === "image") {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={name} className={`max-w-[240px] rounded-xl mt-1 object-cover ${isMe ? 'border border-indigo-300/60' : 'border border-slate-200'}`} />
        </a>
      );
    }
    if (type === "video") {
      return (
        <video
          key={url}
          controls
          src={url}
          className={`max-w-[280px] rounded-xl mt-1 ${isMe ? 'border border-indigo-300/60' : 'border border-slate-200'}`}
          onError={(e) => {
            const err = (e.currentTarget.error as MediaError | null)?.message ?? "unknown";
            if (err.toLowerCase().includes("aborted")) return;
            console.warn("Video load error", { url, err });
          }}
        >
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
        className={`flex items-center gap-2 mt-1 rounded-xl px-3 py-2 transition max-w-[280px] cursor-pointer ${
          isMe ? 'bg-indigo-500/30 border border-indigo-300/60 hover:bg-indigo-500/40' : 'bg-white border border-slate-200 hover:bg-slate-50'
        }`}
      >
        <Icon size={18} className={`shrink-0 ${isMe ? 'text-white' : 'text-indigo-500'}`} />
        <span className={`text-xs font-medium truncate ${isMe ? 'text-white' : 'text-slate-700'}`}>{name}</span>
      </a>
    );
  };

  const roleLabel = msg.sender_type === 'space' ? 'Giáo viên' : 'Sinh viên';
  const isTeacher = msg.sender_type === 'space';

  return (
    <div className={`flex gap-2 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
      {!isMe && (
        <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center mt-1">
          {initials}
        </div>
      )}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? 'items-start' : 'items-end'}`}>
        <div className="flex items-baseline gap-2 px-1">
          <span className="text-[11px] font-bold text-slate-700">
            {isMe ? 'Bạn' : msg.sender_name || 'Ẩn danh'}
          </span>
          {!isMe && (
            <span
              className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                isTeacher
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-sky-100 text-sky-700 border border-sky-200'
              }`}
            >
              {roleLabel}
            </span>
          )}
          <span className="text-[10px] text-slate-400">{time}</span>
        </div>
        <div
          className={`rounded-2xl text-sm font-medium shadow-sm ${
            isMe
              ? 'bg-indigo-600 text-white rounded-bl-md'
              : 'bg-slate-100 text-slate-800 rounded-br-md'
          }`}
        >
          {msg.content && (
            <div className="px-4 py-2.5 break-words whitespace-pre-wrap">{msg.content}</div>
          )}
          {renderAttachment()}
        </div>
      </div>
    </div>
  );
}

function JoinRequiredPage({
  classroom,
  onJoin,
  joining,
}: {
  classroom: Classroom;
  onJoin: () => void;
  joining: boolean;
}) {
  const isPaid = classroom.pricing_type === 'paid';
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          {isPaid ? <Crown size={32} /> : <Sparkles size={32} />}
        </div>
        <h2 className="text-xl font-bold text-slate-900">{classroom.name}</h2>
        <p className="text-slate-500 text-sm">
          {classroom.description || 'Bạn cần tham gia lớp học này để xem nội dung bên trong.'}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <Hash size={12} /> Mã lớp: {classroom.pid}
        </div>
        {isPaid && classroom.price_vnd ? (
          <div className="text-2xl font-black text-amber-600">
            {(classroom.price_vnd).toLocaleString('vi-VN')}đ
          </div>
        ) : (
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 inline-block px-3 py-1 rounded-full">
            Miễn phí
          </div>
        )}
        <p className="text-xs text-slate-500">
          Yêu cầu của bạn sẽ được giáo viên duyệt sau khi {isPaid ? 'thanh toán thành công' : 'gửi yêu cầu'}.
        </p>
        <Button
          onClick={onJoin}
          disabled={joining}
          className="w-full h-12 rounded-xl bg-primary-brand hover:bg-primary-brand-dark text-white font-bold"
        >
          {joining ? (
            <><Loader2 size={16} className="animate-spin mr-2" /> Đang xử lý...</>
          ) : isPaid ? (
            <><Crown size={16} className="mr-2" /> Mua &amp; yêu cầu tham gia</>
          ) : (
            <><Sparkles size={16} className="mr-2" /> Yêu cầu tham gia</>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={() => (typeof window !== 'undefined' ? window.history.back() : null)}
          className="w-full text-xs text-muted-foreground"
        >
          Quay lại
        </Button>
      </div>
    </div>
  );
}

export default function ClassroomDetailPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, mounted } = useRequireAuth();
  const { status: meStatus, me } = useMe();
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
  const { t } = useTranslation();

  type ActiveTab = typeof activeTab;
  const VALID_TABS: ActiveTab[] = ['discussion', 'docs', 'assignments', 'exams', 'quiz', 'meeting', 'ai', 'collections', 'calendar', 'leave_request', 'leaderboard'];

  const buildQueryString = React.useCallback(
    (overrides: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  const goToTab = React.useCallback(
    (tab: ActiveTab) => {
      const url = buildQueryString({ tab: tab === 'discussion' ? null : tab });
      router.replace(url, { scroll: false });
      setActiveTab(tab);
    },
    [buildQueryString, router],
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && (VALID_TABS as string[]).includes(tab)) {
      setActiveTab(tab as ActiveTab);
    } else {
      setActiveTab('discussion');
    }
  }, [searchParams]);
  const [collections, setCollections] = useState<QuizCollection[]>([]);
  const [collectionProgress, setCollectionProgress] = useState<Record<string, QuizCollectionProgress>>({});
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [expandedCollectionUid, setExpandedCollectionUid] = useState<string | null>(null);
  const [collectionDetailsByUid, setCollectionDetailsByUid] = useState<Record<string, QuizCollectionDetail | undefined>>({});
  const [loadingCollectionDetailUid, setLoadingCollectionDetailUid] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [joiningMeeting, setJoiningMeeting] = useState(false);
  const { marker: liveMarker, room: liveRoomFromPresence } = useMeetingPresence({
    classroomUid: isAuthenticated && activeTab === 'meeting' ? uid : null,
  });
  const {
    localStream,
    remoteStream,
    localSource,
    isConnected: rtcConnected,
    isJoined: rtcJoined,
    joinRoom,
    leave: leaveMeeting,
    startMediaShare,
    stopMediaShare,
    renegotiate,
  } = useRTC(activeRoom?.uid ?? null);

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


  useEffect(() => {
    if (!isAuthenticated || !uid) return;

    const fetchClassroom = async () => {
      try {
        setLoading(true);
        setError("");
        const data: any = await classroomApi.retrieve(uid);
        setClassroom(data);
        setMembershipStatus((data.membership_status as any) || (data.join_required ? null : 'approved'));
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
    if (!classroom) return;
    if (activeTab !== 'docs') return;

    const fetchLessons = async () => {
      try {
        await classroomApi.access(uid);
      } catch {
      }
    };
    void fetchLessons();
  }, [activeTab, isAuthenticated, uid, classroom]);

  const [joiningCheckout, setJoiningCheckout] = useState(false);
  const handleJoinPaidClassroom = async () => {
    if (!classroom) return;
    try {
      setJoiningCheckout(true);
      const res = await classroomApi.joinByCode(classroom.pid);
      if (res.requires_payment && res.pay_url) {
        window.location.href = `/consumer/classroom/checkout/${classroom.uid}?order_id=${res.order_id || ''}`;
      } else {
        toast.success('Đã tham gia lớp');
        router.refresh();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Không thể bắt đầu thanh toán');
    } finally {
      setJoiningCheckout(false);
    }
  };

  const handleJoinClassroom = async () => {
    if (!classroom) return;
    try {
      setJoiningCheckout(true);
      const res = await classroomApi.quickJoin(classroom.uid);
      if (res.requires_payment && res.pay_url) {
        toast.info('Lớp học trả phí, đang chuyển đến MoMo...');
        const orderId = res.order_id ? `?order_id=${res.order_id}` : '';
        window.location.href = `/consumer/classroom/checkout/${classroom.uid}${orderId}`;
        return;
      }
      if (res.membership_status === 'pending') {
        toast.success(`Đã gửi yêu cầu tham gia lớp "${classroom.name}". Vui lòng chờ giáo viên duyệt.`);
      } else {
        toast.success(`Đã tham gia lớp "${classroom.name}"!`);
      }
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Không thể tham gia lớp');
    } finally {
      setJoiningCheckout(false);
    }
  };

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
    if (!isAuthenticated || !uid || activeTab !== 'collections') return;

    const fetchCollections = async () => {
      setLoadingCollections(true);
      try {
        const list = await consumerQuizCollectionApi.listByClassroom(uid);
        setCollections(list);
        const pMap: Record<string, QuizCollectionProgress> = {};
        for (const c of list) {
          try {
            pMap[c.uid] = await consumerQuizCollectionApi.getProgress(c.uid, uid);
          } catch {
            pMap[c.uid] = { total: c.quiz_count, passed: 0, is_completed: false, percent: 0, passed_quiz_ids: [], missing_quiz_ids: [] };
          }
        }
        setCollectionProgress(pMap);
      } catch {
        setCollections([]);
      } finally {
        setLoadingCollections(false);
      }
    };

    void fetchCollections();
  }, [activeTab, isAuthenticated, uid]);

  useEffect(() => {
    if (!loadingMore && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loadingMore, scrollContainerRef]);

  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMessages]);

  const handleToggleCollection = async (collection: QuizCollection) => {
    if (expandedCollectionUid === collection.uid) {
      setExpandedCollectionUid(null);
      return;
    }
    setExpandedCollectionUid(collection.uid);
    if (collectionDetailsByUid[collection.uid]) return;
    setLoadingCollectionDetailUid(collection.uid);
    try {
      const data = await consumerQuizCollectionApi.retrieve(collection.uid, uid);
      setCollectionDetailsByUid(prev => ({ ...prev, [collection.uid]: data }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.load_error'));
    } finally {
      setLoadingCollectionDetailUid(null);
    }
  };

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
    let cancelled = false;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    fetch(`${apiBase}/api/v1/consumer/course/classrooms/${uid}/docs/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then((docs: Array<{ uid: string; name: string; url: string }>) => {
        if (cancelled) return;
        const map: Record<string, { name: string; url: string }> = {};
        for (const d of docs) map[d.uid] = { name: d.name, url: d.url };
        setDocUrlMap(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated, uid, activeTab]);

  useEffect(() => {
    if (isAuthenticated && uid && activeTab === 'meeting') {
      setActiveRoom(liveRoomFromPresence || null);
      setLoadingRoom(Boolean(uid) && activeTab === 'meeting' && !liveMarker && !liveRoomFromPresence);
    } else if (activeTab !== 'meeting') {
      setActiveRoom(null);
    }
  }, [isAuthenticated, uid, activeTab, liveMarker, liveRoomFromPresence]);

  useEffect(() => {
    const onPeerJoined = (event: Event) => {
      const peer = (event as CustomEvent<{ user_type?: string }>).detail;
      if (!peer || !rtcJoined) return;
      if (peer.user_type !== 'space') return;
      if (!localStream) {
        void startMediaShare('camera').catch((err) => {
          console.warn('[consumer] auto-start camera for new peer failed:', err);
        });
      }
    };
    window.addEventListener('rtc:peer-joined', onPeerJoined);
    return () => window.removeEventListener('rtc:peer-joined', onPeerJoined);
  }, [rtcJoined, localStream, startMediaShare]);

  if (!mounted) return null;

  if (meStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Đang xác thực...</p>
      </div>
    );
  }

  if (classroom && me && classroom.teacher_id === me.uid) {
    if (typeof window !== 'undefined') {
      const base =
        (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SPACE_WEB_URL) ||
        'http://localhost:3003';
      window.location.replace(`${base.replace(/\/+$/, '')}/space/classrooms/${uid}/details`);
    }
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="text-3xl">🔒</div>
          <h2 className="text-xl font-bold text-slate-900">Đây là lớp học bạn đang giảng dạy</h2>
          <p className="text-slate-500 text-sm">
            Đang chuyển sang trang quản lý lớp học...
          </p>
        </div>
      </div>
    );
  }

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

  if (classroom && (classroom as any).join_required && membershipStatus === null) {
    return <JoinRequiredPage classroom={classroom} onJoin={handleJoinClassroom} joining={joiningCheckout} />;
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
        <div className="max-w-[1600px] mx-auto px-6 h-full flex flex-col justify-end pb-8 relative z-10">
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
      <main className="flex-1 max-w-[1600px] w-full mx-auto py-6 pl-2 pr-6 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] xl:grid-cols-[220px_1fr_320px] gap-4">
          {/* Left Sidebar - Nav */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="bg-white rounded-2xl border border-slate-200 lg:p-1.5 p-2 shadow-sm flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
              {[
                { key: 'discussion' as const, icon: MessageSquare, label: 'Thảo luận' },
                { key: 'docs' as const, icon: FolderOpen, label: 'Tài liệu' },
                { key: 'assignments' as const, icon: FileText, label: 'Bài tập' },
                { key: 'exams' as const, icon: ClipboardList, label: 'Bài kiểm tra' },
                { key: 'quiz' as const, icon: Trophy, label: 'Thi trắc nghiệm' },
                { key: 'leaderboard' as const, icon: BarChart3, label: 'Bảng xếp hạng' },
                { key: 'meeting' as const, icon: Video, label: 'Phòng họp' },
                { key: 'calendar' as const, icon: Calendar, label: 'Lịch' },
                { key: 'leave_request' as const, icon: CalendarOff, label: 'Xin nghỉ' },
                { key: 'ai' as const, icon: Bot, label: 'AI Trợ giảng' },
                { key: 'collections' as const, icon: Layers, label: 'Bộ Nhiệm Vụ' },
              ].map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <Button
                    key={item.key}
                    type="button"
                    onClick={() => goToTab(item.key)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer text-left w-full ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                        : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <item.icon size={18} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-6 min-w-0">

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

                  {messages.map((msg: ChatMessage) => <MessageBubble key={msg.uid} msg={msg} currentUserId={me?.uid ?? null} />)}
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
                        <Button
                          key={quiz.uid}
                          type="button"
                          onClick={() => router.push(`/consumer/classroom/${uid}/quiz/${quiz.uid}`)}
                          className="w-full flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 cursor-pointer"
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
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mission Collections Tab */}
            {activeTab === 'collections' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={17} className="text-indigo-600" />
                    <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">{t('quizCollection.title')}</span>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-600">
                    {collections.length} bộ
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  {loadingCollections ? (
                    <div className="flex items-center justify-center h-32 text-slate-400">
                      <Loader2 size={26} className="animate-spin" />
                    </div>
                  ) : collections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400">
                      <Layers size={38} className="mb-3 opacity-30" />
                      <p className="text-sm font-medium">{t('quizCollection.empty')}</p>
                      <p className="text-xs mt-1">{t('quizCollection.empty_hint')}</p>
                    </div>
                  ) : (
                    collections.map(c => {
                      const isExpanded = expandedCollectionUid === c.uid;
                      const detail = collectionDetailsByUid[c.uid];
                      const isLoadingDetail = loadingCollectionDetailUid === c.uid;
                      const p = collectionProgress[c.uid];
                      return (
                        <div
                          key={c.uid}
                          className={`rounded-2xl border transition-all overflow-hidden ${
                            isExpanded ? 'border-indigo-200 shadow-sm' : 'border-slate-100'
                          }`}
                        >
                          <Button
                            type="button"
                            onClick={() => void handleToggleCollection(c)}
                            className="w-full text-left p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                              p?.is_completed ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                            }`}>
                              {p?.is_completed ? <Trophy size={22} /> : <Layers size={22} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-slate-900 text-sm truncate">{c.title}</h4>
                              {c.description && (
                                <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">{c.description}</p>
                              )}
                              {p && p.total > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all ${
                                        p.is_completed ? 'bg-amber-500' : 'bg-indigo-600'
                                      }`}
                                      style={{ width: `${p.percent}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-500 shrink-0">
                                    {t('quizCollection.card_progress', undefined, { done: p.passed, total: p.total })}
                                  </span>
                                </div>
                              )}
                            </div>
                            {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                          </Button>

                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/40 p-4 space-y-4">
                              {isLoadingDetail ? (
                                <div className="flex items-center justify-center py-8 text-slate-400">
                                  <Loader2 size={22} className="animate-spin" />
                                </div>
                              ) : detail ? (
                                <CollectionExpandedPanel
                                  classroomUid={uid}
                                  detail={detail}
                                  progress={p ?? null}
                                />
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Paid banner + CTA */}
            {classroom?.is_paid_classroom && !classroom?.has_paid && (
              <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Crown size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Lớp học trả phí</div>
                    <div className="text-xs text-muted-foreground">
                      Bạn chỉ xem được nội dung miễn phí (Preview folder + bài học xem trước). Nâng cấp để mở khóa toàn bộ.
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleJoinPaidClassroom}
                  disabled={joiningCheckout}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 rounded-xl px-5 shadow-md shadow-amber-500/20"
                >
                  {joiningCheckout ? <Loader2 size={14} className="animate-spin mr-1" /> : <Crown size={14} className="mr-1" />}
                  NÂNG CẤP {classroom.price_vnd ? `${(classroom.price_vnd).toLocaleString('vi-VN')}đ` : ''}
                </Button>
              </div>
            )}

            {/* Docs Tab */}
            {activeTab === 'docs' && (
              <ClassroomDocsViewer
                classroomUid={uid}
                accessToken={typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null}
                apiBase={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
                t={t}
                isPaidClassroom={Boolean(classroom?.is_paid_classroom)}
                hasPaid={Boolean(classroom?.has_paid)}
                onUpgrade={handleJoinPaidClassroom}
                upgrading={joiningCheckout}
              />
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <ConsumerClassroomCalendarTab classroomUid={uid} classroomName={classroom?.name} />
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <LeaderboardTab classroomUid={uid} />
            )}

            {/* Leave Request Tab */}
            {activeTab === 'leave_request' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <LeaveRequestTab
                  role="student"
                  classroomId={uid}
                  classroomName={classroom?.name}
                  api={{
                    list: (params) => consumerLeaveRequestApi.list({ classroom_id: params.classroom_id, status: params.status }),
                    create: (input) => consumerLeaveRequestApi.create(input),
                    cancel: (lrUid) => consumerLeaveRequestApi.cancel(lrUid),
                  }}
                  listEvents={async () => {
                    const now = new Date();
                    const start = new Date(now);
                    start.setDate(start.getDate() - 7);
                    const end = new Date(now);
                    end.setDate(end.getDate() + 60);
                    const data = await consumerCalendarApi.list({
                      startDate: start.toISOString(),
                      endDate: end.toISOString(),
                      classroomId: uid,
                    });
                    return (data || []).map((e) => ({
                      uid: e.uid,
                      title: e.title,
                      start_time: e.start_time,
                      end_time: e.end_time,
                      classroom_name: e.classroom_name ?? null,
                    }));
                  }}
                />
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
                    {rtcJoined ? (
                      rtcConnected ? (
                        <><Wifi size={13} className="text-emerald-500" /><span className="text-emerald-500">Đã kết nối tín hiệu</span></>
                      ) : (
                        <><Loader2 size={13} className="animate-spin text-amber-500" /><span className="text-amber-500">Đang kết nối...</span></>
                      )
                    ) : (
                      <><WifiOff size={13} className="text-slate-400" /><span className="text-slate-400">Chưa tham gia</span></>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto relative">
                  <div className="flex-1 min-h-0">
                    {remoteStream ? (
                      <ScreenShareViewer stream={remoteStream} label="Giảng viên" />
                    ) : rtcJoined && activeRoom ? (
                      <div className="aspect-video bg-indigo-900/20 rounded-2xl flex flex-col items-center justify-center text-indigo-600 gap-4 border-2 border-indigo-200 border-dashed">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Video size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black uppercase tracking-widest">Đang chờ giảng viên chia sẻ</p>
                          <p className="text-xs font-medium opacity-80 mt-1">Bạn đã vào lớp, vui lòng chờ...</p>
                        </div>
                      </div>
                    ) : activeRoom ? (
                      <div className="aspect-video bg-indigo-900/20 rounded-2xl flex flex-col items-center justify-center text-indigo-600 gap-4 border-2 border-indigo-200 border-dashed animate-pulse">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Video size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black uppercase tracking-widest">Lớp học đang diễn ra!</p>
                          <p className="text-xs font-medium opacity-80 mt-1">Bấm "Tham gia" để vào lớp của giáo viên</p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-3 border-2 border-dashed border-slate-800">
                        <Video size={48} className="opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest">Chưa có buổi học nào...</p>
                        <p className="text-xs font-medium opacity-70">Giáo viên sẽ mở lớp, thông báo sẽ hiện tại đây</p>
                      </div>
                    )}
                  </div>

                  {localStream && (
                    <div className="absolute bottom-24 right-6 w-44 md:w-56 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-black/40 z-10">
                      <ScreenShareViewer stream={localStream} label={localSource === 'camera' ? 'Bạn' : 'Màn hình của bạn'} />
                    </div>
                  )}

                  <div className="mt-auto flex flex-col items-center gap-3">
                    {!rtcJoined && activeRoom ? (
                      <Button
                        onClick={async () => {
                          if (!activeRoom?.uid) return;
                          try {
                            setJoiningMeeting(true);
                            await joinRoom(activeRoom.uid);
                            await startMediaShare('camera');
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Không thể tham gia lớp học');
                          } finally {
                            setJoiningMeeting(false);
                          }
                        }}
                        disabled={joiningMeeting}
                        className="bg-indigo-600 hover:bg-indigo-700 font-bold px-10 h-12 rounded-xl gap-2 shadow-lg shadow-indigo-100"
                      >
                        {joiningMeeting ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Video size={18} />
                        )}
                        THAM GIA
                      </Button>
                    ) : rtcJoined ? (
                      <div className="flex flex-wrap justify-center gap-3">
                        <Button
                          onClick={() => void startMediaShare('screen')}
                          variant="outline"
                          className="font-bold px-6 h-11 rounded-xl gap-2"
                        >
                          <MonitorUp size={16} />
                          Chia sẻ màn hình
                        </Button>
                        <Button
                          onClick={() => void startMediaShare('camera')}
                          variant="outline"
                          className="font-bold px-6 h-11 rounded-xl gap-2"
                          disabled={Boolean(localStream)}
                        >
                          <Camera size={16} />
                          Bật camera
                        </Button>
                        <Button
                          onClick={() => void stopMediaShare()}
                          variant="outline"
                          className="font-bold px-6 h-11 rounded-xl gap-2"
                          disabled={!localStream}
                        >
                          <WifiOff size={16} />
                          Dừng chia sẻ
                        </Button>
                        <Button
                          onClick={() => void leaveMeeting()}
                          variant="destructive"
                          className="font-bold px-6 h-11 rounded-xl gap-2 shadow-lg shadow-rose-100"
                        >
                          <PhoneOff size={16} />
                          RỜI PHÒNG
                        </Button>
                      </div>
                    ) : null}
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
                    <Button onClick={() => setAiMessages([])} className="ml-auto text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer">Xoá</Button>
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
                                      className="truncate text-indigo-500 hover:text-indigo-700 hover:underline font-medium cursor-pointer"
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
                    <Button
                      onClick={() => void handleAiAsk()}
                      disabled={!aiQuestion.trim() || aiLoading}
                      className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-50 transition-colors shrink-0"
                    >
                      {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </Button>
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
                        <Button
                          key={group.key}
                          type="button"
                          onClick={() => setSelectedExamGroup(group.key)}
                          className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                            selectedExamGroup === group.key
                              ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                              : 'border-slate-100 bg-slate-50/60'
                          } cursor-pointer`}
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
                        </Button>
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
                                  <Button
                                    type="button"
                                    onClick={() => void handleJoinOnlineExam(exam.uid)}
                                    disabled={joiningExamUid === exam.uid}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-violet-700 disabled:opacity-60 animate-pulse"
                                  >
                                    {joiningExamUid === exam.uid ? <Loader2 size={11} className="animate-spin" /> : <Wifi size={11} />}
                                    Vào phòng thi
                                  </Button>
                                ) : isOnline && exam.status === 'closed' ? (
                                  <span className="text-[10px] font-black uppercase text-slate-400">
                                    Đã kết thúc
                                  </span>
                                ) : (
                                  <Button
                                    type="button"
                                    onClick={() => router.push(`/consumer/classroom/${uid}/exams/${exam.uid}`)}
                                    className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-700 cursor-pointer"
                                  >
                                    Xem chi tiết
                                  </Button>
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

function CollectionExpandedPanel({
  classroomUid, detail, progress,
}: {
  classroomUid: string;
  detail: QuizCollectionDetail;
  progress: QuizCollectionProgress | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<'game' | 'certificate'>('game');
  const [certificate, setCertificate] = useState<IssuedCertificate | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);

  const passedSet = new Set(progress?.passed_quiz_ids ?? []);
  const certUnlocked = !!progress?.is_completed && !!detail.certificate_id;
  const hasCertificateConfig = !!detail.certificate_id;

  React.useEffect(() => {
    if (progress?.is_completed && detail.certificate_id) {
      setMode('certificate');
    }
  }, [progress?.is_completed, detail.certificate_id]);

  const handleSelectMode = (next: 'game' | 'certificate') => {
    if (next === 'certificate' && !certUnlocked) return;
    setMode(next);
    if (next === 'certificate' && !certificate && detail.certificate_id) {
      void loadCertificate();
    }
  };

  const loadCertificate = async () => {
    try {
      setLoadingCert(true);
      const cert = await consumerQuizCollectionApi.getCertificate(detail.uid, classroomUid);
      setCertificate(cert);
    } catch { /* not yet issued */ }
    finally {
      setLoadingCert(false);
    }
  };

  return (
    <>
      <div>
        <h4 className="text-sm font-black text-slate-900">{detail.title}</h4>
        {detail.description && (
          <p className="text-[11px] text-slate-500 mt-0.5">{detail.description}</p>
        )}
      </div>

      {progress && progress.total > 0 && (
        <section className="bg-white border border-slate-100 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              {t('quizCollection.progress_label')}
            </h5>
            <span className="text-[11px] font-black text-slate-700">
              {t('quizCollection.progress_percent', undefined, { percent: Math.round(progress.percent) })}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                progress.is_completed ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 text-center">
            {t('quizCollection.card_progress', undefined, { done: progress.passed, total: progress.total })}
          </p>
        </section>
      )}

      <div className="bg-white border border-slate-100 rounded-xl p-1 flex gap-1">
        <Button
          type="button"
          onClick={() => handleSelectMode('game')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
            mode === 'game'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Gamepad2 size={12} />
          {t('quizCollection.mode_game')}
        </Button>
        <Button
          type="button"
          onClick={() => handleSelectMode('certificate')}
          disabled={!certUnlocked}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
            mode === 'certificate'
              ? 'bg-amber-500 text-white shadow-sm'
              : certUnlocked
              ? 'text-slate-500 hover:bg-slate-50'
              : 'text-slate-400/60 cursor-not-allowed'
          }`}
        >
          {certUnlocked ? <Award size={12} /> : <Lock size={10} />}
          {t('quizCollection.mode_certificate')}
        </Button>
      </div>

      {mode === 'game' && (
        <section className="space-y-2">
          <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            {t('quizCollection.items_section')}
          </h5>
          {detail.items.length === 0 ? (
            <p className="text-[11px] text-slate-500 py-4 text-center">{t('quizCollection.items_empty')}</p>
          ) : (
            <div className="space-y-2">
              {detail.items.map((item, idx) => {
                const passed = passedSet.has(item.quiz_id);
                return (
                  <MissionAccordion
                    key={item.quiz_id}
                    classroomUid={classroomUid}
                    quizId={item.quiz_id}
                    index={idx + 1}
                    passed={passed}
                    onStart={() => router.push(`/consumer/classroom/${classroomUid}/quiz/${item.quiz_id}`)}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {mode === 'certificate' && (
        <section className="space-y-2">
          <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Award size={11} className="text-amber-500" />
            {t('quizCollection.completion_section')}
          </h5>
          {loadingCert ? (
            <div className="flex items-center justify-center py-6 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : !hasCertificateConfig ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
              <Award size={26} className="mb-2 opacity-30" />
              <p className="text-[11px] font-medium">{t('quizCollection.mode_certificate_empty_no_cert')}</p>
            </div>
          ) : certificate ? (
            <div className="rounded-xl p-3 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                <Trophy size={20} />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="font-black text-slate-900 text-[12px]">{t('quizCollection.certificate_card_title')}</p>
                <p className="text-[10px] text-slate-500">
                  {t('quizCollection.certificate_card_issued_at', undefined, {
                    date: certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString('vi-VN') : '',
                  })}
                </p>
                <div className="flex items-center gap-1 text-[9px] text-amber-700 font-mono font-bold">
                  <ShieldCheck size={9} />
                  <span className="truncate">{t('quizCollection.certificate_card_verification')}: {certificate.verification_code}</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push(`/consumer/certificate/${certificate.uid}`)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] gap-1 shrink-0 h-7 px-2.5"
              >
                {t('quizCollection.certificate_card_view_btn')}
                <ArrowRight size={11} />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
              <Award size={26} className="mb-2 opacity-30" />
              <p className="text-[11px] font-medium">{t('quizCollection.completion_pending')}</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}

function MissionAccordion({
  classroomUid, quizId, index, passed, onStart,
}: {
  classroomUid: string;
  quizId: string;
  index: number;
  passed: boolean;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<QuizPublicDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'passed'>(
    passed ? 'passed' : 'not_started'
  );

  React.useEffect(() => {
    if (passed) {
      setStatus('passed');
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const attempts = await consumerQuizApi.listAttempts(quizId, classroomUid);
        if (cancelled) return;
        if (attempts.length === 0) {
          setStatus('not_started');
        } else {
          setStatus('in_progress');
        }
      } catch {
        if (!cancelled) setStatus('not_started');
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [quizId, classroomUid, passed]);

  const handleToggle = async () => {
    if (status === 'not_started') return;
    const next = !isOpen;
    setIsOpen(next);
    if (next && !detail) {
      setLoading(true);
      try {
        const data = await consumerQuizApi.retrieve(quizId, classroomUid);
        setDetail(data);
      } catch {
        /* keep silent */
      } finally {
        setLoading(false);
      }
    }
  };

  const statusLabelKey =
    status === 'passed'
      ? 'quizCollection.quiz_status_passed'
      : status === 'in_progress'
      ? 'quizCollection.quiz_status_in_progress'
      : 'quizCollection.quiz_status_not_started';

  const isLocked = status === 'not_started';

  return (
    <div className={`rounded-xl border transition-colors ${isOpen ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-white'}`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Button
          type="button"
          onClick={handleToggle}
          disabled={isLocked}
          className={`flex items-center gap-2.5 flex-1 min-w-0 text-left ${
            isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className={`w-6 h-6 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
            isLocked ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'
          }`}>
            {index}
          </div>
          {status === 'passed' ? (
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
          ) : isLocked ? (
            <Lock size={13} className="text-slate-400 shrink-0" />
          ) : (
            <Circle size={15} className="text-amber-500 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-slate-900 truncate">
              {detail?.title ?? `Nhiệm vụ #${index}`}
            </p>
            <p className="text-[9px] text-slate-500 mt-0.5">{t(statusLabelKey)}</p>
          </div>
          {!isLocked && (
            isOpen
              ? <ChevronUp size={13} className="text-slate-400" />
              : <ChevronDown size={13} className="text-slate-400" />
          )}
        </Button>
        <Button
          size="sm"
          onClick={onStart}
          className="h-6 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-[10px] gap-1 shrink-0"
        >
          <Gamepad2 size={11} />
          {status === 'passed'
            ? t('quizCollection.redo_quiz_btn')
            : status === 'in_progress'
            ? t('quizCollection.resume_quiz_btn')
            : t('quizCollection.start_quiz_btn')}
        </Button>
      </div>

      {isOpen && !isLocked && (
        <div className="border-t border-slate-100 bg-slate-50/30 px-3 py-2.5 space-y-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-3 text-slate-400">
              <Loader2 size={14} className="animate-spin" />
            </div>
          ) : (
            <>
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                {t('quizCollection.questions_list_title')} · {detail?.questions_count ?? 0}
              </div>
              {(detail?.questions ?? []).length === 0 ? (
                <p className="text-[10px] text-slate-500 py-2 text-center">
                  {t('quizCollection.questions_list_empty')}
                </p>
              ) : (
                <ol className="space-y-1">
                  {(detail?.questions ?? []).map((q, idx) => (
                    <li key={q.uid} className="flex items-start gap-2 bg-white border border-slate-100 rounded-md px-2.5 py-1.5">
                      <span className="w-4 h-4 rounded bg-indigo-100 text-indigo-600 text-[8px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-[10px] font-bold text-slate-700 leading-relaxed line-clamp-2">{q.question_text}</p>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>
      )}

      {isLocked && (
        <div className="border-t border-slate-100 bg-slate-50/30 px-3 py-2.5 flex items-start gap-2">
          <Lock size={12} className="text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-slate-700">
              {t('quizCollection.questions_locked_title')}
            </p>
            <p className="text-[9px] text-slate-500 leading-relaxed">
              {t('quizCollection.questions_locked_hint')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
