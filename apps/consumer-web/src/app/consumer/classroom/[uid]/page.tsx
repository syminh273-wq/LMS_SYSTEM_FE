'use client';

import * as React from 'react';
import { useEffect, useRef, useState, use } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { classroomApi, examSessionApi, notificationApi, ClassroomProps, Exam, consumerQuizApi } from '@/lib/api';
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
  MessageSquare,
  FileText,
  Video,
  BarChart3,
  ShieldCheck,
  Send,
  Hash,
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
  MonitorUp,
  Camera,
  CameraOff,
  PhoneOff,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import {
  Message,
  MessageAvatarImage,
  MessageContent,
  Bubble,
  BubbleContent,
  BubbleMeta,
  TypingIndicator,
} from '@shared/components/ui/message';
import { useRequireAuth } from '@/features/auth/hooks/useRequireAuth';
import { useMe } from '@/features/auth/hooks/useMe';
import { useClassroomChat } from '@/lib/hooks/use-classroom-chat';
import { useRTC } from '@/lib/hooks/use-rtc';
import { useMeetingPresence } from '@/lib/hooks/use-meeting-presence';
import { MeetingTab } from '@/components/rtc/meeting-tab';
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
          <img src={url} alt={name} className={`max-w-[240px] rounded-xl mt-1 object-cover ${isMe ? 'border border-primary/60' : 'border border-border'}`} />
        </a>
      );
    }
    if (type === "video") {
      return (
        <video
          key={url}
          controls
          src={url}
          className={`max-w-[280px] rounded-xl mt-1 ${isMe ? 'border border-primary/60' : 'border border-border'}`}
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
          isMe ? 'bg-primary/30 border border-primary/60 hover:bg-primary/40' : 'bg-card border border-border hover:bg-muted'
        }`}
      >
        <Icon size={18} className={`shrink-0 ${isMe ? 'text-white' : 'text-primary'}`} />
        <span className={`text-xs font-medium truncate ${isMe ? 'text-white' : 'text-foreground'}`}>{name}</span>
      </a>
    );
  };

  const roleLabel = msg.sender_type === 'space' ? 'Giáo viên' : 'Sinh viên';
  const isTeacher = msg.sender_type === 'space';
  const senderLabel = isMe ? 'Bạn' : msg.sender_name || 'Ẩn danh';

  return (
    <Message from={isMe ? 'user' : 'assistant'} align={isMe ? 'right' : 'left'}>
      <MessageAvatarImage
        src={msg.sender_avatar ?? undefined}
        alt={senderLabel}
        fallback={senderLabel}
      />
      <MessageContent>
        <div className={`flex items-baseline gap-2 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[11px] font-bold text-foreground">{senderLabel}</span>
          {!isMe && (
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                isTeacher
                  ? 'border border-warning/20 bg-warning/10 text-warning'
                  : 'border border-info/20 bg-info/10 text-info'
              }`}
            >
              {roleLabel}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>
        <Bubble
          variant={isMe ? 'primary' : 'muted'}
          size="md"
          className={isMe ? 'rounded-bl-md' : 'rounded-br-md'}
        >
          <BubbleContent>
            {msg.content && (
              <p className="break-words whitespace-pre-wrap">{msg.content}</p>
            )}
            {renderAttachment()}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

function JoinRequiredPage({
  classroom,
  onJoin,
  joining,
}: {
  classroom: ClassroomProps;
  onJoin: () => void;
  joining: boolean;
}) {
  const isPaid = classroom.pricing_type === 'paid';
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-white flex flex-col items-center justify-center p-4">
      <div className="bg-card p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          {isPaid ? <Crown size={32} /> : <Sparkles size={32} />}
        </div>
        <h2 className="text-xl font-bold text-foreground">{classroom.name}</h2>
        <p className="text-muted-foreground text-sm">
          {classroom.description || 'Bạn cần tham gia lớp học này để xem nội dung bên trong.'}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <Hash size={12} /> Mã lớp: {classroom.pid}
        </div>
        {isPaid && classroom.price_vnd ? (
          <div className="text-2xl font-black text-warning">
            {(classroom.price_vnd).toLocaleString('vi-VN')}đ
          </div>
        ) : (
          <div className="text-xs font-bold uppercase tracking-widest text-success bg-success/10 inline-block px-3 py-1 rounded-full">
            Miễn phí
          </div>
        )}
        <p className="text-xs text-muted-foreground">
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
  const { isAuthenticated, isMounted } = useRequireAuth();
  const { status: meStatus, me } = useMe();
  const [classroom, setClassroom] = useState<ClassroomProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [membershipStatus, setMembershipStatus] = useState<'approved' | 'pending' | null>(null);
  const [draft, setDraft] = useState("");
  const sendingDraftRef = useRef(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [examError, setExamError] = useState("");
  const [assignments, setAssignments] = useState<Exam[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
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
  const autoJoinAttemptedUidRef = useRef<string | null>(null);
  const { marker: liveMarker, room: liveRoomFromPresence } = useMeetingPresence({
    classroomUid: isAuthenticated && activeTab === 'meeting' ? uid : null,
  });
  const {
    localStream,
    remoteFrame,
    localSource,
    isConnected: rtcConnected,
    isJoined: rtcJoined,
    joinRoom,
    leave: leaveMeeting,
    startMediaShare,
    stopMediaShare,
    toggleCamera,
    error: rtcError,
  } = useRTC(activeRoom?.uid ?? null);

  // useRTC's WS/media errors were previously silent (no UI surface) — a failed
  // ws/rtc/ connection or getUserMedia rejection would look exactly like "the
  // join button does nothing". Surface it so it's visible instead of silent.
  useEffect(() => {
    if (rtcError) {
      console.error('[meeting] RTC error:', rtcError);
      toast.error(rtcError);
    }
  }, [rtcError]);

  const cameraEnabled = localSource === 'camera' && (localStream?.getVideoTracks()[0]?.enabled ?? true);

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
        const data: any = await classroomApi.getClassroom(uid);
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

  const notifyTeacherOfJoin = React.useCallback((status: 'pending' | 'approved') => {
    if (!classroom?.teacher_id) {
      console.warn('[notifyTeacherOfJoin] skip — classroom.teacher_id is empty', { classroom });
      return;
    }
    const studentName = me?.full_name || me?.username || 'Học viên';
    const title = status === 'pending'
      ? `Yêu cầu tham gia lớp "${classroom.name}"`
      : `Học viên mới tham gia lớp "${classroom.name}"`;
    const content = status === 'pending'
      ? `${studentName} đã gửi yêu cầu tham gia lớp "${classroom.name}" và đang chờ duyệt.`
      : `${studentName} vừa tham gia lớp "${classroom.name}".`;
    const targetUid = classroom.teacher_id;
    console.log('[notifyTeacherOfJoin] →', { targetUid, status, classroom_uid: classroom.uid });
    notificationApi
      .send({
        target_uid: targetUid,
        title,
        content,
        notify_type: 'system',
        metadata: {
          classroom_uid: classroom.uid,
          classroom_name: classroom.name,
          student_uid: me?.uid,
          student_name: studentName,
          status,
        },
      })
      .then((res) => {
        console.log('[notifyTeacherOfJoin] ✓ sent', res);
      })
      .catch((err) => {
        console.error('[notifyTeacherOfJoin] ✗ failed', err);
        toast.error(`Gửi thông báo thất bại: ${err?.message || 'unknown'}`);
      });
  }, [classroom, me]);

  const handleJoinPaidClassroom = async () => {
    if (!classroom) return;
    try {
      setJoiningCheckout(true);
      const res = await classroomApi.joinByCode(classroom.pid);
      if (res.requires_payment && res.pay_url) {
        window.location.href = `/consumer/classroom/checkout/${classroom.uid}?order_id=${res.order_id || ''}`;
      } else {
        notifyTeacherOfJoin(res.membership_status === 'pending' ? 'pending' : 'approved');
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
      const res = await classroomApi.joinClassroomQuickly(classroom.uid);
      if (res.requires_payment && res.pay_url) {
        toast.info('Lớp học trả phí, đang chuyển đến MoMo...');
        const orderId = res.order_id ? `?order_id=${res.order_id}` : '';
        window.location.href = `/consumer/classroom/checkout/${classroom.uid}${orderId}`;
        return;
      }
      notifyTeacherOfJoin(res.membership_status === 'pending' ? 'pending' : 'approved');
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
        const data = await classroomApi.getClassroomExams(uid);
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
    if (!isAuthenticated || !uid || activeTab !== 'assignments') return;

    const fetchAssignments = async () => {
      try {
        setLoadingAssignments(true);
        setAssignmentError("");
        const data = await classroomApi.getClassroomAssignments(uid);
        setAssignments((data as Exam[]).filter(item => item.status !== 'draft'));
      } catch (err: unknown) {
        setAssignmentError(err instanceof Error ? err.message : 'Không thể tải danh sách bài tập');
      } finally {
        setLoadingAssignments(false);
      }
    };

    void fetchAssignments();
  }, [isAuthenticated, uid, activeTab]);

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
          pMap[c.uid] = c.progress ?? {
            total: c.quiz_count, passed: 0, is_completed: false, percent: 0, passed_quiz_ids: [], missing_quiz_ids: [],
          };
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
    if (activeTab === 'meeting' && isAuthenticated) {
      console.log('[meeting] presence state:', {
        liveMarker,
        liveRoomFromPresence,
        activeRoomUid: activeRoom?.uid ?? null,
      });
    }
  }, [activeTab, isAuthenticated, liveMarker, liveRoomFromPresence, activeRoom?.uid]);

  // Auto-join: khi vào tab meeting mà đã có activeRoom thì tự động vào lớp
  // luôn, không chờ user bấm nút. User vẫn có thể bấm "RỜI PHÒNG" để thoát.
  //
  // autoJoinAttemptedUidRef chặn việc thử lại vô hạn: setJoiningMeeting(false)
  // trong finally khiến effect này tự kích hoạt lại (vì joiningMeeting nằm
  // trong deps), và nếu activeRoom vẫn còn cùng uid (ví dụ presence poll
  // chưa kịp cập nhật sau khi giáo viên kết thúc phòng) thì nó sẽ join lại
  // ngay lập tức — join lại thất bại — lặp lại vô hạn, spam lỗi/toast liên
  // tục. Ref này đảm bảo mỗi room uid chỉ được thử tự động vào 1 lần.
  useEffect(() => {
    if (activeTab !== 'meeting') return;
    if (!isAuthenticated) return;
    if (!activeRoom?.uid) return;
    if (rtcJoined || joiningMeeting) return;
    if (autoJoinAttemptedUidRef.current === activeRoom.uid) return;
    autoJoinAttemptedUidRef.current = activeRoom.uid;

    console.log('[meeting] auto-joining room:', activeRoom.uid);
    void (async () => {
      setJoiningMeeting(true);
      try {
        await joinRoom(activeRoom.uid);
        toast.success('Đã vào lớp!');
      } catch (err) {
        console.error('[meeting] auto-join failed:', err);
        const message = err instanceof Error ? err.message : 'Không thể tham gia lớp học';
        if (message.toLowerCase().includes('ended')) {
          // Phòng đã kết thúc trước khi kịp vào — dọn state ngay thay vì
          // chờ vòng poll/presence tiếp theo, và không cần báo lỗi ồn ào.
          setActiveRoom(null);
        } else {
          toast.error(message);
        }
        setJoiningMeeting(false);
        return;
      }
      setJoiningMeeting(false);
      try {
        await startMediaShare('camera');
      } catch (err) {
        console.warn('[meeting] auto-start camera failed:', err);
        toast.warning('Đã vào lớp nhưng không bật được camera. Bạn có thể bật lại bằng nút "Bật camera".');
      }
    })();
  }, [activeTab, isAuthenticated, activeRoom?.uid, rtcJoined, joiningMeeting, joinRoom, startMediaShare]);

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

  if (!isMounted) return null;

  if (meStatus === 'loading') {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium text-sm">Đang xác thực...</p>
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
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="text-3xl">🔒</div>
          <h2 className="text-xl font-bold text-foreground">Đây là lớp học bạn đang giảng dạy</h2>
          <p className="text-muted-foreground text-sm">
            Đang chuyển sang trang quản lý lớp học...
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium text-sm">Đang tải dữ liệu lớp học...</p>
      </div>
    );
  }

  if (membershipStatus === 'pending') {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto">
            <Clock size={32} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Đang chờ phê duyệt</h2>
          <p className="text-muted-foreground text-sm">
            Yêu cầu tham gia lớp học của bạn đang chờ giáo viên xem xét. Bạn sẽ có thể vào lớp sau khi được chấp thuận.
          </p>
          <Button onClick={() => router.push('/consumer/classroom')} className="w-full bg-primary">
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
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <Info size={32} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Lỗi tải dữ liệu</h2>
          <p className="text-muted-foreground text-sm">{error || 'Không tìm thấy lớp học'}</p>
          <Button onClick={() => router.push('/consumer/classroom')} className="w-full bg-primary">
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
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Hero Banner Section */}
      <div className="bg-primary h-48 md:h-64 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-card" />
          <div className="absolute bottom-[-20px] right-20 w-48 h-48 rounded-full bg-card" />
          <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-lg bg-card rotate-12" />
        </div>
        <div className="max-w-[1600px] mx-auto px-6 h-full flex flex-col justify-end pb-8 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center px-2 py-1 rounded bg-black/20 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase mb-2">
              MÃ LỚP: {classroom.pid}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-sm">
              {classroom.name}
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl text-sm md:text-base font-medium line-clamp-2">
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
            <div className="bg-card rounded-2xl border border-border p-2 shadow-sm flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
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
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => goToTab(item.key)}
                    data-active={isActive || undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm whitespace-nowrap cursor-pointer text-left w-full transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon size={18} className={`shrink-0 ${isActive ? 'text-primary' : ''}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-6 min-w-0">

            {/* Chat Feed */}
            {/* ?tab=discussion */}
            {activeTab === 'discussion' && (
              <div className="bg-card rounded-3xl border border-border shadow-sm flex flex-col overflow-hidden" style={{ height: '520px' }}>
                {/* Chat header */}
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-primary" />
                    <span className="font-black text-foreground text-sm uppercase tracking-tighter">Thảo luận chung</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {connected ? (
                      <><Wifi size={13} className="text-success" /><span className="text-success">Trực tuyến</span></>
                    ) : (
                      <><WifiOff size={13} className="text-muted-foreground" /><span className="text-muted-foreground">Đang kết nối...</span></>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {/* Top sentinel — IntersectionObserver triggers loadMore when scrolled here */}
                  <div ref={topSentinelRef} className="h-1" />

                  {loadingMore && (
                    <div className="flex justify-center py-1">
                      <Loader2 size={14} className="text-primary animate-spin" />
                    </div>
                  )}

                  {chatLoading && (
                    <div className="flex justify-center pt-8">
                      <Loader2 size={24} className="text-primary animate-spin" />
                    </div>
                  )}

                  {!chatLoading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                      <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center text-slate-300">
                        <MessageSquare size={28} />
                      </div>
                      <p className="text-muted-foreground text-sm font-medium">Chưa có tin nhắn nào. Hãy bắt đầu thảo luận!</p>
                    </div>
                  )}

                  {messages.map((msg: ChatMessage) => <MessageBubble key={msg.uid} msg={msg} currentUserId={me?.uid ?? null} />)}
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-border flex gap-2">
                  <input
                    className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground border border-border outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition"
                    placeholder="Nhập tin nhắn..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && draft.trim()) {
                        e.preventDefault();
                        if (sendingDraftRef.current) return;
                        sendingDraftRef.current = true;
                        sendMessage(draft.trim());
                        setDraft('');
                        sendingDraftRef.current = false;
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="rounded-xl bg-primary hover:bg-primary shrink-0"
                    disabled={!draft.trim() || !connected}
                    onClick={() => {
                      if (sendingDraftRef.current || !draft.trim()) return;
                      sendingDraftRef.current = true;
                      sendMessage(draft.trim());
                      setDraft('');
                      sendingDraftRef.current = false;
                    }}
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* Exam Quiz Tab */}
            {/* ?tab=quiz */}
            {activeTab === 'quiz' && (
              <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={17} className="text-primary" />
                    <span className="font-black text-foreground text-sm uppercase tracking-tighter">Thi trắc nghiệm</span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase text-primary">
                    {quizzes.length} bài thi
                  </span>
                </div>
                <div className="p-5">
                  {loadingQuizzes ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <Loader2 size={26} className="animate-spin" />
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
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
                          className="w-full h-auto flex items-center gap-4 rounded-2xl border border-border bg-muted/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/20 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                            <Trophy size={22} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-foreground text-sm truncate">{quiz.title}</h4>
                            {quiz.description && (
                              <p className="text-xs text-muted-foreground font-medium mt-0.5 line-clamp-1">{quiz.description}</p>
                            )}
                            <div className="mt-1 text-[10px] font-black uppercase text-primary">
                              {quiz.questions_count} câu hỏi trắc nghiệm
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mission Collections Tab */}
            {/* ?tab=collections */}
            {activeTab === 'collections' && (
              <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={17} className="text-primary" />
                    <span className="font-black text-foreground text-sm uppercase tracking-tighter">{t('quizCollection.title')}</span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase text-primary">
                    {collections.length} bộ
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  {loadingCollections ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <Loader2 size={26} className="animate-spin" />
                    </div>
                  ) : collections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
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
                            isExpanded ? 'border-primary/20 shadow-sm' : 'border-border'
                          }`}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => void handleToggleCollection(c)}
                            className="w-full h-auto text-left p-4 flex items-start gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                              p?.is_completed ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                            }`}>
                              {p?.is_completed ? <Trophy size={22} /> : <Layers size={22} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-foreground text-sm truncate">{c.title}</h4>
                              {c.description && (
                                <p className="text-xs text-muted-foreground font-medium mt-0.5 line-clamp-1">{c.description}</p>
                              )}
                              {p && p.total > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all ${
                                        p.is_completed ? 'bg-warning' : 'bg-primary'
                                      }`}
                                      style={{ width: `${p.percent}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-black text-muted-foreground shrink-0">
                                    {t('quizCollection.card_progress', undefined, { done: p.passed, total: p.total })}
                                  </span>
                                </div>
                              )}
                            </div>
                            {isExpanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                          </Button>

                          {isExpanded && (
                            <div className="border-t border-border bg-muted/40 p-4 space-y-4">
                              {isLoadingDetail ? (
                                <div className="flex items-center justify-center py-8 text-muted-foreground">
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
              <div className="mb-4 bg-gradient-to-r from-warning/10 to-warning/10 border border-warning/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
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
                  className="bg-warning hover:bg-amber-700 text-white font-bold text-xs h-10 rounded-xl px-5 shadow-md shadow-amber-500/20"
                >
                  {joiningCheckout ? <Loader2 size={14} className="animate-spin mr-1" /> : <Crown size={14} className="mr-1" />}
                  NÂNG CẤP {classroom.price_vnd ? `${(classroom.price_vnd).toLocaleString('vi-VN')}đ` : ''}
                </Button>
              </div>
            )}

            {/* Docs Tab */}
            {/* ?tab=docs */}
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
            {/* ?tab=calendar */}
            {activeTab === 'calendar' && (
              <div className="bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6">
                <ConsumerClassroomCalendarTab classroomUid={uid} classroomName={classroom?.name} />
              </div>
            )}

            {/* Leaderboard Tab */}
            {/* ?tab=leaderboard */}
            {activeTab === 'leaderboard' && (
              <LeaderboardTab classroomUid={uid} />
            )}

            {/* Leave Request Tab */}
            {/* ?tab=leave_request */}
            {activeTab === 'leave_request' && (
              <div className="bg-card rounded-3xl border border-border shadow-sm p-5 sm:p-6">
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
            {/* ?tab=meeting */}
            {activeTab === 'meeting' && (
              <div className="space-y-3">
                {/* Thanh điều khiển tách riêng khỏi khung video để tránh bị overlay che */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Video size={16} className="text-primary" />
                    <span>Điều khiển phòng họp</span>
                    {joiningMeeting && (
                      <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 size={12} className="animate-spin" />
                        Đang vào lớp...
                      </span>
                    )}
                    {rtcJoined && !rtcConnected && !joiningMeeting && (
                      <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-warning">
                        <Loader2 size={12} className="animate-spin" />
                        Đang kết nối...
                      </span>
                    )}
                    {rtcJoined && rtcConnected && (
                      <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-success">
                        <Wifi size={12} />
                        Đã kết nối
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => void startMediaShare('screen')}
                      variant="outline"
                      className="font-bold px-4 h-10 rounded-xl gap-2"
                    >
                      <MonitorUp size={15} />
                      Chia sẻ màn hình
                    </Button>
                    {localSource === 'camera' ? (
                      <Button
                        type="button"
                        onClick={() => toggleCamera()}
                        variant="outline"
                        className={`font-bold px-4 h-10 rounded-xl gap-2 ${
                          cameraEnabled ? '' : 'text-rose-600 border-rose-200 hover:bg-rose-50'
                        }`}
                      >
                        {cameraEnabled ? <Camera size={15} /> : <CameraOff size={15} />}
                        {cameraEnabled ? 'Tắt camera' : 'Bật lại camera'}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => void startMediaShare('camera')}
                        variant="outline"
                        className="font-bold px-4 h-10 rounded-xl gap-2"
                        disabled={Boolean(localStream)}
                      >
                        <Camera size={15} />
                        Bật camera
                      </Button>
                    )}
                    {localStream && (
                      <Button
                        type="button"
                        onClick={() => void stopMediaShare()}
                        variant="outline"
                        className="font-bold px-4 h-10 rounded-xl gap-2"
                      >
                        <WifiOff size={15} />
                        Dừng chia sẻ
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={() => void leaveMeeting()}
                      variant="destructive"
                      disabled={!rtcJoined}
                      className="font-bold px-5 h-10 rounded-xl gap-2 shadow-lg shadow-rose-100"
                    >
                      <PhoneOff size={15} />
                      RỜI PHÒNG
                    </Button>
                  </div>
                </div>

                <MeetingTab
                  activeRoom={activeRoom}
                  rtcJoined={rtcJoined}
                  rtcConnected={rtcConnected}
                  remoteFrame={remoteFrame}
                  localStream={localStream}
                  localSource={localSource}
                  joining={joiningMeeting}
                />
              </div>
            )}

            {/* ?tab=ai */}
            {activeTab === 'ai' && (
              <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col" style={{ height: '540px' }}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center gap-3 bg-gradient-to-r from-primary/10 to-primary/10">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black text-foreground text-sm">AI Trợ giảng</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Hỏi đáp từ tài liệu lớp học</p>
                  </div>
                  {aiMessages.length > 0 && (
                    <Button onClick={() => setAiMessages([])} className="ml-auto text-xs text-muted-foreground hover:text-muted-foreground font-medium cursor-pointer">Xoá</Button>
                  )}
                </div>
                {/* Messages */}
                <div ref={aiScrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {aiMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <Sparkles size={28} className="text-primary mb-3" />
                      <p className="text-sm font-bold text-foreground">AI Trợ giảng</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">Đặt câu hỏi về tài liệu của lớp học để nhận câu trả lời ngay!</p>
                    </div>
                  )}
                  {aiMessages.map((msg, i) => (
                    <Message
                      key={i}
                      from={msg.role === 'user' ? 'user' : 'assistant'}
                      align={msg.role === 'user' ? 'left' : 'right'}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 self-end">
                          <Bot size={14} className="text-white" />
                        </div>
                      )}
                      <MessageContent>
                        <Bubble
                          variant={msg.role === 'user' ? 'primary' : 'muted'}
                          size="md"
                          className={msg.role === 'user' ? 'rounded-bl-sm' : 'rounded-br-sm'}
                        >
                          <BubbleContent>
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
                                : msg.loading && <TypingIndicator />
                              }
                            </div>
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Nguồn tham khảo</p>
                                {msg.sources.slice(0, 3).map((src, j) => {
                                  const docName = src.metadata?.doc_name ?? 'Tài liệu';
                                  const docUrl = src.metadata?.doc_url
                                    ?? docUrlMap[src.metadata?.resource_uid]?.url
                                    ?? null;
                                  const score = (src.score * 100).toFixed(0);
                                  return (
                                    <div key={j} className="text-[10px] text-muted-foreground flex items-center justify-between gap-2">
                                      {docUrl ? (
                                        <a
                                          href={docUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          download
                                          className="truncate text-primary hover:text-primary hover:underline font-medium cursor-pointer"
                                          title={`Xem / tải: ${docName}`}
                                        >
                                          {docName}
                                        </a>
                                      ) : (
                                        <span className="truncate">{docName}</span>
                                      )}
                                      <span className="shrink-0 text-primary font-bold">{score}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  ))}
                </div>
                {/* Input */}
                <div className="px-4 py-3 border-t border-border bg-muted/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={e => setAiQuestion(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleAiAsk(); } }}
                      placeholder="Đặt câu hỏi về tài liệu lớp học..."
                      disabled={aiLoading}
                      className="flex-1 h-10 rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    />
                    <Button
                      onClick={() => void handleAiAsk()}
                      disabled={!aiQuestion.trim() || aiLoading}
                      className="h-10 w-10 rounded-xl bg-primary hover:bg-primary text-white flex items-center justify-center disabled:opacity-50 transition-colors shrink-0"
                    >
                      {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'discussion' && activeTab !== 'assignments' && activeTab !== 'exams' && activeTab !== 'quiz' && activeTab !== 'meeting' && activeTab !== 'ai' && (
              <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
                  <FileText size={38} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nội dung đang được cập nhật.</p>
                </div>
              </div>
            )}


            {/* Assignments */}
            {/* ?tab=assignments */}
            {activeTab === 'assignments' && (
              <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={17} className="text-primary" />
                    <span className="font-black text-foreground text-sm uppercase tracking-tighter">Bài tập</span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase text-primary">
                    {assignments.length} bài
                  </span>
                </div>

                <div className="p-5">
                  {loadingAssignments ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <Loader2 size={26} className="animate-spin" />
                    </div>
                  ) : assignmentError ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                      {assignmentError}
                    </div>
                  ) : assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                      <FileText size={38} className="mb-3 opacity-30" />
                      <p className="text-sm font-medium">Chưa có bài tập nào</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...assignments]
                        .sort((left, right) => getDueTimestamp(left.due_date) - getDueTimestamp(right.due_date))
                        .map(assignment => {
                          const deadline = getDeadlineMeta(assignment.due_date);
                          const ContentIcon = getContentTypeIcon(assignment.content_type);

                          return (
                            <div
                              key={assignment.uid}
                              className={`w-full rounded-2xl border bg-card p-4 shadow-sm ${deadline.cardClassName}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className="line-clamp-2 text-sm font-black leading-snug text-foreground">{assignment.title}</h4>
                                  <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-muted-foreground">
                                    {assignment.description || 'Không có mô tả'}
                                  </p>
                                </div>
                              </div>

                              <div className={`mt-4 rounded-xl border px-3 py-2 ${deadline.badgeClassName}`}>
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="shrink-0" />
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-black">{deadline.label}</div>
                                    <div className="truncate text-[10px] font-bold opacity-80">{formatDateTime(assignment.due_date)}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-black uppercase text-muted-foreground ring-1 ring-border">
                                  <ContentIcon size={12} />
                                  {getContentTypeLabel(assignment.content_type)}
                                </span>
                                {deadline.isExpired ? (
                                  <Button
                                    type="button"
                                    disabled
                                    variant="ghost"
                                    className="text-[10px] font-black uppercase text-muted-foreground opacity-60 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                                  >
                                    Đã hết hạn
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    onClick={() => router.push(`/consumer/classroom/${uid}/exams/${assignment.uid}`)}
                                    className="rounded-xl bg-primary px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-primary/90 cursor-pointer"
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
              </div>
            )}

            {/* Exams */}
            {/* ?tab=exams */}
            {activeTab === 'exams' && (
              <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={17} className="text-primary" />
                    <span className="font-black text-foreground text-sm uppercase tracking-tighter">Bài kiểm tra</span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase text-primary">
                    {exams.filter(exam => exam.exam_type !== 'assignment').length} bài
                  </span>
                </div>

                <div className="p-5">
                  {loadingExams ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <Loader2 size={26} className="animate-spin" />
                    </div>
                  ) : examError ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                      {examError}
                    </div>
                  ) : exams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                      <ClipboardList size={38} className="mb-3 opacity-30" />
                      <p className="text-sm font-medium">Chưa có bài kiểm tra nào</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      {groupedExams.map(group => (
                        <Button
                          key={group.key}
                          type="button"
                          variant="ghost"
                          onClick={() => setSelectedExamGroup(group.key)}
                          className={`h-auto w-full items-stretch justify-start whitespace-normal rounded-2xl border p-4 text-left shadow-none transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/20 ${
                            selectedExamGroup === group.key
                              ? 'border-primary/20 bg-primary/10 shadow-sm hover:bg-primary/10'
                              : 'border-border bg-muted/60 hover:bg-muted/60'
                          } cursor-pointer`}
                        >
                          <div className="flex w-full min-w-0 items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-black text-foreground">{group.label}</div>
                              <div className="text-[10px] font-black uppercase text-muted-foreground">{group.items.length} bài</div>
                            </div>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm ring-1 ring-border">
                              <ClipboardList size={17} />
                            </div>
                          </div>
                        </Button>
                    ))}
                  </div>
                )}

                {selectedGroup && (
                  <div className="mt-5 rounded-2xl border border-border bg-muted p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-primary">Danh sách bài kiểm tra</div>
                        <h4 className="mt-1 text-lg font-black text-foreground">{selectedGroup.label}</h4>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedExamGroup(null)} className="rounded-lg text-xs font-bold">
                        Đóng
                      </Button>
                    </div>

                    {selectedGroup.items.length === 0 ? (
                      <div className="mt-4 flex h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card text-center text-muted-foreground">
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
                              className={`w-full rounded-2xl border bg-card p-4 shadow-sm ${deadline.cardClassName}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="line-clamp-2 text-sm font-black leading-snug text-foreground">{exam.title}</h4>
                                    {isOnline && (
                                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase text-primary ring-1 ring-violet-100">
                                        Online
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-muted-foreground">
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
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-black uppercase text-muted-foreground ring-1 ring-border">
                                  <ContentIcon size={12} />
                                  {getContentTypeLabel(exam.content_type)}
                                </span>
                                {isOnline && exam.status === 'ongoing' ? (
                                  <Button
                                    type="button"
                                    onClick={() => void handleJoinOnlineExam(exam.uid)}
                                    disabled={joiningExamUid === exam.uid}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-primary disabled:opacity-60 animate-pulse"
                                  >
                                    {joiningExamUid === exam.uid ? <Loader2 size={11} className="animate-spin" /> : <Wifi size={11} />}
                                    Vào phòng thi
                                  </Button>
                                ) : isOnline && exam.status === 'closed' ? (
                                  <span className="text-[10px] font-black uppercase text-muted-foreground">
                                    Đã kết thúc
                                  </span>
                                ) : deadline.isExpired ? (
                                  <Button
                                    type="button"
                                    disabled
                                    variant="ghost"
                                    className="text-[10px] font-black uppercase text-muted-foreground opacity-60 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                                  >
                                    Đã hết hạn
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    onClick={() => router.push(`/consumer/classroom/${uid}/exams/${exam.uid}`)}
                                    className="rounded-xl bg-primary px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-primary/90 cursor-pointer"
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
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-black text-foreground uppercase tracking-tighter flex items-center gap-2">
                  <Info size={18} className="text-primary" />
                  THÔNG TIN LỚP HỌC
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center border border-success/20 shadow-sm">
                      <Users size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sĩ số tối đa</div>
                      <div className="text-sm font-bold text-foreground">{classroom.max_students} học sinh</div>
                    </div>
                  </div>
                  <ShieldCheck size={18} className="text-success" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-info/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ngày khởi tạo</div>
                    <div className="text-sm font-bold text-foreground">{new Date(classroom.created_at).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">Mô tả</div>
                  <div className="bg-muted rounded-2xl p-4 border border-border">
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">
                      "{classroom.description || 'Lớp học này chưa có mô tả chi tiết.'}"
                    </p>
                  </div>
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
    return 'bg-destructive/10 text-destructive border border-destructive/20';
  }
  if (normalized === 'published' || normalized === 'active' || normalized === 'open') {
    return 'bg-success/10 text-success border border-success/20';
  }
  if (normalized === 'draft') {
    return 'bg-warning/10 text-warning border border-warning/20';
  }
  if (normalized === 'closed' || normalized === 'expired') {
    return 'bg-muted text-muted-foreground border border-border';
  }
  return 'bg-muted text-muted-foreground border border-border';
}

const EXAM_GROUPS = [
  {
    key: 'regular',
    label: 'Kiểm tra thường xuyên',
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
    .filter(exam => exam.status !== 'draft' && exam.exam_type !== 'assignment')
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
      cardClassName: 'border-border hover:border-primary/20 focus:ring-primary/20',
      badgeClassName: 'border-border bg-muted text-muted-foreground',
      isExpired: false,
    };
  }

  const due = new Date(value).getTime();
  const hoursLeft = (due - Date.now()) / (1000 * 60 * 60);

  if (Number.isNaN(due)) {
    return {
      label: 'Hạn nộp không hợp lệ',
      cardClassName: 'border-border hover:border-primary/20 focus:ring-primary/20',
      badgeClassName: 'border-border bg-muted text-muted-foreground',
      isExpired: false,
    };
  }

  if (hoursLeft <= 0) {
    return {
      label: 'Đã hết hạn',
      cardClassName: 'border-destructive/20 hover:border-destructive/20 focus:ring-destructive/20',
      badgeClassName: 'border-destructive/20 bg-destructive/10 text-destructive',
      isExpired: true,
    };
  }

  if (hoursLeft < 24) {
    return {
      label: `Còn ${Math.ceil(hoursLeft)} giờ`,
      cardClassName: 'border-destructive/20 hover:border-destructive/20 focus:ring-destructive/20',
      badgeClassName: 'border-destructive/20 bg-destructive/10 text-destructive',
      isExpired: false,
    };
  }

  if (hoursLeft <= 72) {
    return {
      label: `Còn ${Math.ceil(hoursLeft / 24)} ngày`,
      cardClassName: 'border-warning/20 hover:border-warning/20 focus:ring-warning/20',
      badgeClassName: 'border-warning/20 bg-warning/10 text-warning',
      isExpired: false,
    };
  }

  return {
    label: `Còn ${Math.ceil(hoursLeft / 24)} ngày`,
    cardClassName: 'border-success/20 hover:border-success/20 focus:ring-success/20',
    badgeClassName: 'border-success/20 bg-success/10 text-success',
    isExpired: false,
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
        <h4 className="text-sm font-black text-foreground">{detail.title}</h4>
        {detail.description && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{detail.description}</p>
        )}
      </div>

      {progress && progress.total > 0 && (
        <section className="bg-card border border-border rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {t('quizCollection.progress_label')}
            </h5>
            <span className="text-[11px] font-black text-foreground">
              {t('quizCollection.progress_percent', undefined, { percent: Math.round(progress.percent) })}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                progress.is_completed ? 'bg-warning' : 'bg-primary'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            {t('quizCollection.card_progress', undefined, { done: progress.passed, total: progress.total })}
          </p>
        </section>
      )}

      <div className="bg-card border border-border rounded-xl p-1 flex gap-1">
        <Button
          type="button"
          onClick={() => handleSelectMode('game')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
            mode === 'game'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
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
              ? 'bg-warning text-white shadow-sm'
              : certUnlocked
              ? 'text-muted-foreground hover:bg-muted'
              : 'text-muted-foreground/60 cursor-not-allowed'
          }`}
        >
          {certUnlocked ? <Award size={12} /> : <Lock size={10} />}
          {t('quizCollection.mode_certificate')}
        </Button>
      </div>

      {mode === 'game' && (
        <section className="space-y-2">
          <h5 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            {t('quizCollection.items_section')}
          </h5>
          {detail.items.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-4 text-center">{t('quizCollection.items_empty')}</p>
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
          <h5 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Award size={11} className="text-warning" />
            {t('quizCollection.completion_section')}
          </h5>
          {loadingCert ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : !hasCertificateConfig ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <Award size={26} className="mb-2 opacity-30" />
              <p className="text-[11px] font-medium">{t('quizCollection.mode_certificate_empty_no_cert')}</p>
            </div>
          ) : certificate ? (
            <div className="rounded-xl p-3 bg-gradient-to-r from-warning/10 to-warning/20 border border-warning/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 text-warning flex items-center justify-center shrink-0">
                <Trophy size={20} />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="font-black text-foreground text-[12px]">{t('quizCollection.certificate_card_title')}</p>
                <p className="text-[10px] text-muted-foreground">
                  {t('quizCollection.certificate_card_issued_at', undefined, {
                    date: certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString('vi-VN') : '',
                  })}
                </p>
                <div className="flex items-center gap-1 text-[9px] text-warning font-mono font-bold">
                  <ShieldCheck size={9} />
                  <span className="truncate">{t('quizCollection.certificate_card_verification')}: {certificate.verification_code}</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push(`/consumer/certificate/${certificate.uid}`)}
                className="bg-warning hover:bg-warning text-white font-bold text-[10px] gap-1 shrink-0 h-7 px-2.5"
              >
                {t('quizCollection.certificate_card_view_btn')}
                <ArrowRight size={11} />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
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
    <div className={`rounded-xl border transition-colors ${isOpen ? 'border-primary/20 bg-primary/10' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Button
          type="button"
          onClick={handleToggle}
          disabled={isLocked}
          className={`h-auto flex items-center gap-2.5 flex-1 min-w-0 text-left ${
            isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className={`w-6 h-6 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
            isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
          }`}>
            {index}
          </div>
          {status === 'passed' ? (
            <CheckCircle2 size={15} className="text-success shrink-0" />
          ) : isLocked ? (
            <Lock size={13} className="text-muted-foreground shrink-0" />
          ) : (
            <Circle size={15} className="text-warning shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-foreground truncate">
              {detail?.title ?? `Nhiệm vụ #${index}`}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{t(statusLabelKey)}</p>
          </div>
          {!isLocked && (
            isOpen
              ? <ChevronUp size={13} className="text-muted-foreground" />
              : <ChevronDown size={13} className="text-muted-foreground" />
          )}
        </Button>
        <Button
          size="sm"
          onClick={onStart}
          className="h-6 px-2.5 bg-primary hover:bg-primary text-white rounded-md font-bold text-[10px] gap-1 shrink-0"
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
        <div className="border-t border-border bg-muted/30 px-3 py-2.5 space-y-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-3 text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
            </div>
          ) : (
            <>
              <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                {t('quizCollection.questions_list_title')} · {detail?.questions_count ?? 0}
              </div>
              {(detail?.questions ?? []).length === 0 ? (
                <p className="text-[10px] text-muted-foreground py-2 text-center">
                  {t('quizCollection.questions_list_empty')}
                </p>
              ) : (
                <ol className="space-y-1">
                  {(detail?.questions ?? []).map((q, idx) => (
                    <li key={q.uid} className="flex items-start gap-2 bg-card border border-border rounded-md px-2.5 py-1.5">
                      <span className="w-4 h-4 rounded bg-primary/10 text-primary text-[8px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-[10px] font-bold text-foreground leading-relaxed line-clamp-2">{q.question_text}</p>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>
      )}

      {isLocked && (
        <div className="border-t border-border bg-muted/30 px-3 py-2.5 flex items-start gap-2">
          <Lock size={12} className="text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-foreground">
              {t('quizCollection.questions_locked_title')}
            </p>
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              {t('quizCollection.questions_locked_hint')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
