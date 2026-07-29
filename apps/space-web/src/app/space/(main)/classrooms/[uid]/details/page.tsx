'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, use, useRef } from 'react';
import { usePendingRealtime } from '@/lib/hooks/use-pending-realtime';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { spaceApi, SharingLink, Classroom, Exam, userSettingsApi } from '@/lib/api';
import type { ClassroomMember, StudentExamRecord, ActivityLog, BlacklistEntry } from '@/lib/api/types';
import {
  QrCode,
  Download,
  Loader2,
  Info,
  Calendar,
  FileText,
  MessageSquare,
  File,
  X,
  UploadCloud,
  FolderOpen,
  Tag,
  Bot,
  Sparkles,
  Send,
  Mic,
  Square,
  ArrowLeft,
  Settings,
  ClipboardList,
  Plus,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  Gamepad2,
  Check,
  BookOpen,
  Clock,
  RotateCcw,
  RefreshCw,
  Shuffle,
  HelpCircle,
  Video,
  MonitorUp,
  Camera,
  Wifi,
  WifiOff,
  Users,
  UserX,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart2,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Wand2,
  Timer,
  UserPlus,
  FileCheck,
  GraduationCap,
  CheckCircle2,
  Clock as ClockIcon,
  ShieldBan,
  ShieldOff,
  ShieldAlert,
  Trophy,
} from 'lucide-react';
import { quizApi } from '@/lib/api/quiz';
import QuizLeaderboardModal from '@/components/quiz/QuizLeaderboardModal';
import type { Quiz } from '@/lib/api/types';
import type { MeetingRoom } from '@/lib/api/meeting-room';
import { Button } from '@shared/components/ui/button';
import { Card } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { VoiceSettingsDialog } from '@shared/components/VoiceSettingsDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { QRCodeSVG } from 'qrcode.react';
import { renderToStaticMarkup } from 'react-dom/server';
import { toast } from 'sonner';
import { chatApi } from '@/lib/api/chat';
import ClassroomChatPanel from '@/components/chat/ClassroomChatPanel';
import { ScreenShareViewer } from '@/components/rtc/screen-share-viewer';
import { useRTC } from '@/lib/hooks/use-rtc';
import { useTranslation } from '@shared/components/LocaleProvider';
import { ClassroomDocsManager } from '@/components/classroom/docs-manager/ClassroomDocsManager';
import { ClassroomCalendarTab } from '@/components/calendar/ClassroomCalendarTab';
import SpaceClassroomRankingView from '@/components/ranking/SpaceClassroomRankingView';
import { LeaveRequestTab } from '@shared/components/leave-request';
import { spaceLeaveRequestApi, calendarApi as spaceCalendarApi } from '@/lib/api';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ClassroomDetailsPageProps {
  params: Promise<{ uid: string }>;
}

import type { ActivityLogEventType } from '@/lib/api/types';

function getActivityMeta(eventType: ActivityLogEventType, t: (key: string) => string): {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
} {
  const map: Record<ActivityLogEventType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    classroom_created:  { icon: GraduationCap, color: 'text-primary-brand', bg: 'bg-primary-brand-light',  label: t('classroom.ui.activity_classroom_created') },
    document_uploaded:  { icon: File,          color: 'text-blue-600',   bg: 'bg-blue-100',    label: t('classroom.ui.activity_document_uploaded') },
    document_deleted:   { icon: Trash2,        color: 'text-red-500',    bg: 'bg-red-100',     label: t('classroom.ui.activity_document_deleted') },
    exam_created:       { icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-100',  label: t('classroom.ui.activity_exam_created') },
    exam_published:     { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-100',   label: t('classroom.ui.activity_exam_published') },
    exam_opened:        { icon: Timer,         color: 'text-emerald-600',bg: 'bg-emerald-100', label: t('classroom.ui.activity_exam_opened') },
    exam_closed:        { icon: ClockIcon,     color: 'text-muted-foreground',  bg: 'bg-muted',   label: t('classroom.ui.activity_exam_closed') },
    exam_deleted:       { icon: Trash2,        color: 'text-red-500',    bg: 'bg-red-100',     label: t('classroom.ui.activity_exam_deleted') },
    quiz_assigned:      { icon: Gamepad2,      color: 'text-purple-600', bg: 'bg-purple-100',  label: t('classroom.ui.activity_quiz_assigned') },
    meeting_started:    { icon: Video,         color: 'text-sky-600',    bg: 'bg-sky-100',     label: t('classroom.ui.activity_meeting_started') },
    meeting_ended:      { icon: Video,         color: 'text-muted-foreground',  bg: 'bg-muted',   label: t('classroom.ui.activity_meeting_ended') },
    member_joined:      { icon: UserPlus,      color: 'text-blue-500',   bg: 'bg-blue-100',    label: t('classroom.ui.activity_member_joined') },
    member_approved:    { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-100',   label: t('classroom.ui.activity_member_approved') },
    member_rejected:    { icon: UserX,         color: 'text-red-500',    bg: 'bg-red-100',     label: t('classroom.ui.activity_member_rejected') },
    member_kicked:      { icon: UserX,         color: 'text-red-500',    bg: 'bg-red-100',     label: t('classroom.ui.activity_member_kicked') },
    member_left:        { icon: Users,         color: 'text-muted-foreground',  bg: 'bg-muted',   label: t('classroom.ui.activity_member_left') },
    exam_submitted:     { icon: FileCheck,     color: 'text-teal-600',   bg: 'bg-teal-100',    label: t('classroom.ui.activity_exam_submitted') },
  };
  return map[eventType] ?? { icon: ClipboardList, color: 'text-muted-foreground', bg: 'bg-muted', label: eventType };
}

type ExamKind = 'midterm' | 'final' | 'regular';

const EXAM_KIND_KEYWORDS: Record<ExamKind, string[]> = {
  midterm: ['kiem tra giua ki', 'kiểm tra giữa kì', 'kiểm tra giữa kỳ', 'giua ki', 'giữa kì', 'giữa kỳ'],
  final: ['kiem tra cuoi ki', 'kiểm tra cuối kì', 'kiểm tra cuối kỳ', 'cuoi ki', 'cuối kì', 'cuối kỳ'],
  regular: ['kiem tra thuong xuyen', 'kiểm tra thường xuyên', 'thuong xuyen', 'thường xuyên'],
};

export default function ClassroomDetailsPage({ params }: ClassroomDetailsPageProps) {
  const { uid } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, formatDateTime: localeFormatDateTime, formatDate: localeFormatDate, locale } = useTranslation();
  const formatDateTime = React.useCallback((v: string) => (v ? localeFormatDateTime(v) : '--'), [localeFormatDateTime]);
  const formatDate = React.useCallback((v: string | null | undefined) => (v ? localeFormatDate(v) : '--'), [localeFormatDate]);
  const [fetching, setFetching] = useState(false);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [linkData, setLinkData] = useState<SharingLink | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'chat' | 'meeting' | 'exams' | 'final_exams' | 'quiz' | 'students' | 'ai' | 'blacklist' | 'calendar' | 'leave_request' | 'ranking'>('info');
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [pendingMembers, setPendingMembers] = useState<ClassroomMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [blockingMemberId, setBlockingMemberId] = useState<string | null>(null);
  const [memberToBlock, setMemberToBlock] = useState<{ member: ClassroomMember; scope: 'classroom' | 'global' } | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [memberToKick, setMemberToKick] = useState<ClassroomMember | null>(null);
  const [showPendingSheet, setShowPendingSheet] = useState(false);
  const [detailsMember, setDetailsMember] = useState<ClassroomMember | null>(null);
  const [analyzeMember, setAnalyzeMember] = useState<ClassroomMember | null>(null);
  const [openGroups, setOpenGroups] = useState({ classroom: true, learning: true, students: true });
  const toggleGroup = (key: keyof typeof openGroups) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversationUid, setConversationUid] = useState<string | null>(null);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [meetingAction, setMeetingAction] = useState<'start' | 'end' | null>(null);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLevel, setActivityLevel] = useState<'major' | 'detail'>('major');
  const [loadingActivity, setLoadingActivity] = useState(false);

  // AI Bot state
  type AiMode = 'doc' | 'manage' | 'free';
  type AiToolCall = { tool: string; args: Record<string, unknown>; result: string };
  type AiMessage = { role: 'user' | 'assistant'; text: string; loading?: boolean; sources?: Array<{ document: string; metadata: Record<string, string>; score: number }>; tool_calls?: AiToolCall[] };
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiMode, setAiMode] = useState<AiMode>('doc');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiSessions, setAiSessions] = useState<any[]>([]);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const AI_MODES: { key: AiMode; label: string; icon: React.ElementType; placeholder: string; description: string }[] = [
    { key: 'doc',    label: t('classroom.ui.ai_mode_doc_label'),    icon: BookOpen,    placeholder: t('classroom.ui.ai_mode_doc_placeholder'),    description: t('classroom.ui.ai_mode_doc_desc') },
    { key: 'manage', label: t('classroom.ui.ai_mode_manage_label'), icon: Users,       placeholder: t('classroom.ui.ai_mode_manage_placeholder'), description: t('classroom.ui.ai_mode_manage_desc') },
    { key: 'free',   label: t('classroom.ui.ai_mode_free_label'),   icon: Sparkles,    placeholder: t('classroom.ui.ai_mode_free_placeholder'),   description: t('classroom.ui.ai_mode_free_desc') },
  ];

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamKind, setSelectedExamKind] = useState<ExamKind>('midterm');
  const [loadingExams, setLoadingExams] = useState(false);
  const [examSubTab, setExamSubTab] = useState<'ongoing' | 'closed'>('ongoing');
  const [deletingExamUid, setDeletingExamUid] = useState<string | null>(null);
  const [canManageExams, setCanManageExams] = useState(false);

  type ActiveTab = typeof activeTab;
  const VALID_TABS: ActiveTab[] = ['info', 'docs', 'chat', 'meeting', 'exams', 'final_exams', 'quiz', 'students', 'ai', 'blacklist', 'calendar', 'leave_request', 'ranking'];

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
    (tab: ActiveTab, extras: Record<string, string | null> = {}) => {
      const overrides: Record<string, string | null> = { tab: tab === 'info' ? null : tab, ...extras };
      if (tab === 'exams' || tab === 'final_exams') {
        if (!('kind' in overrides)) {
          overrides.kind = null;
        }
      } else {
        overrides.kind = null;
      }
      const url = buildQueryString(overrides);
      router.replace(url, { scroll: false });
      setActiveTab(tab);
    },
    [buildQueryString, router],
  );

  const goToExamKind = React.useCallback(
    (kind: ExamKind) => {
      router.replace(buildQueryString({ kind: kind === 'midterm' ? null : kind }), { scroll: false });
      setSelectedExamKind(kind);
    },
    [buildQueryString, router],
  );

  // Quiz tab state
  const [assignedQuizzes, setAssignedQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOpenExamModal, setShowOpenExamModal] = useState(false);
  const [unassigningUid, setUnassigningUid] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [leaderboardQuiz, setLeaderboardQuiz] = useState<Quiz | null>(null);
  const activeMeeting = meetingRooms.find(room => room.status === 'active') || null;
  const { localStream, remoteStream, localSource, isConnected: rtcConnected, startMediaShare, stopMediaShare, stopScreenShare, renegotiate } = useRTC(activeMeeting?.uid ?? null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setFetching(true);
        const details = await spaceApi.classrooms.retrieve(uid);
        setClassroom(details);
        if (details.resolve_link) {
          setLinkData(details.resolve_link);
        } else {
          const link = await spaceApi.classrooms.getSharingLink(uid);
          setLinkData(link);
        }
      } catch (error) {
        console.error("Failed to fetch classroom details:", error);
        toast.error(t('classroom.ui.classroom_load_error'));
      } finally {
        setFetching(false);
      }
    };

    fetchDetails();
  }, [uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Permissions are read from browser storage after mount.
    setCanManageExams(getCanManageExams());
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const kind = searchParams.get('kind');

    if (tab && (VALID_TABS as string[]).includes(tab)) {
      setActiveTab(tab as ActiveTab);
    } else {
      setActiveTab('info');
    }
    if (isExamKind(kind)) {
      setSelectedExamKind(kind);
    }
  }, [searchParams]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const isTeacher = typeof window !== 'undefined' && (localStorage.getItem('userType') === 'space' || localStorage.getItem('role') === 'teacher');

  // Load or create conversation when chat tab is opened
  useEffect(() => {
    if (activeTab !== 'chat' || conversationUid) return;
    chatApi
      .getConversations(uid)
      .then((convs) => {
        if (convs && convs.length > 0) {
          setConversationUid(convs[0].uid);
        } else {
          // No channel yet — create one (list endpoint auto-creates)
          return chatApi.getConversations(uid).then((created) => {
            if (created && created.length > 0) {
              setConversationUid(created[0].uid);
            }
          });
        }
      })
      .catch(() => {
        toast.error(t('classroom.messages.chat_load_error'));
      });
  }, [activeTab, uid, conversationUid]);

  const fetchActivity = React.useCallback(async (level: 'major' | 'detail') => {
    setLoadingActivity(true);
    try {
      const logs = await spaceApi.classrooms.getActivity(uid, level, 30);
      setActivityLogs(logs);
    } catch {
      // silently fail — activity log is non-critical
    } finally {
      setLoadingActivity(false);
    }
  }, [uid]);

  useEffect(() => {
    if (activeTab === 'info') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Entering the tab initiates its request.
      void fetchActivity(activityLevel);
    }
  }, [activeTab, activityLevel, fetchActivity]);

  const fetchMeetingRooms = React.useCallback(async () => {
    setLoadingMeetings(true);
    try {
      const rooms = await spaceApi.meetingRooms.getByClassroom(uid);
      setMeetingRooms(rooms);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.meetings_load_error'));
    } finally {
      setLoadingMeetings(false);
    }
  }, [uid]);

  useEffect(() => {
    if (activeTab === 'meeting') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Entering the tab initiates its request.
      void fetchMeetingRooms();
    }
  }, [activeTab, fetchMeetingRooms]);

  useEffect(() => {
    const onPeerJoined = (event: Event) => {
      const peer = (event as CustomEvent<{ user_type?: string }>).detail;
      if (!peer || !activeMeeting) return;
      if (peer.user_type !== 'consumer') return;
      if (!localStream) {
        void startMediaShare('camera').catch((err) => {
          console.warn('[space] auto-start camera for new peer failed:', err);
        });
      }
    };
    window.addEventListener('rtc:peer-joined', onPeerJoined);
    return () => window.removeEventListener('rtc:peer-joined', onPeerJoined);
  }, [activeMeeting, localStream, startMediaShare]);

  const fetchAssignedQuizzes = React.useCallback(async () => {
    setLoadingQuizzes(true);
    try {
      const data = await quizApi.list(uid);
      setAssignedQuizzes(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.quiz_load_error'));
    } finally {
      setLoadingQuizzes(false);
    }
  }, [uid]);

  useEffect(() => {
    if (activeTab === 'quiz') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Entering the tab initiates its request.
      void fetchAssignedQuizzes();
    }
  }, [activeTab, fetchAssignedQuizzes]);

  useEffect(() => {
    // Load members on mount for sidebar count, then reload when tab is opened for full list.
    spaceApi.classrooms.members(uid)
      .then(setMembers)
      .catch(() => {/* silently fail for sidebar count */});
  }, [uid]);

  useEffect(() => {
    if (activeTab !== 'students') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Entering the tab initiates its request.
    setLoadingMembers(true);
    spaceApi.classrooms.members(uid)
      .then(setMembers)
      .catch(() => toast.error(t('classroom.ui.students_load_error')))
      .finally(() => setLoadingMembers(false));
  }, [activeTab, uid]);

  useEffect(() => {
    if (activeTab !== 'blacklist') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Entering the tab initiates its request.
    setLoadingBlacklist(true);
    Promise.all([
      spaceApi.classrooms.listClassroomBlacklist(uid),
      spaceApi.classrooms.listGlobalBlacklist(),
    ])
      .then(([classroomEntries, globalEntries]) => {
        // Merge: nếu cùng consumer_uid xuất hiện ở cả 2, global ưu tiên
        const map = new Map<string, typeof classroomEntries[0]>();
        for (const e of classroomEntries) map.set(e.consumer_uid, e);
        for (const e of globalEntries)    map.set(e.consumer_uid, e); // global ghi đè
        setBlacklist(Array.from(map.values()));
      })
      .catch(() => toast.error(t('classroom.ui.blacklist_load_error')))
      .finally(() => setLoadingBlacklist(false));
  }, [activeTab, uid]);

  const loadPendingMembers = useCallback(() => {
    setLoadingPending(true);
    spaceApi.classrooms.pendingMembers(uid)
      .then(setPendingMembers)
      .catch(() => toast.error(t('classroom.ui.pending_load_error')))
      .finally(() => setLoadingPending(false));
  }, [uid]);

  useEffect(() => {
    loadPendingMembers();
  }, [loadPendingMembers]);

  // Realtime Firebase: khi học sinh join → badge tự cập nhật không cần refresh
  usePendingRealtime({ classroomUid: uid, onNewRequest: loadPendingMembers });

  const handleApproveMember = async (member: ClassroomMember) => {
    setApprovingId(member.member_id);
    try {
      const approved = await spaceApi.classrooms.approveMember(uid, member.member_id);
      setPendingMembers(prev => prev.filter(m => m.member_id !== member.member_id));
      setMembers(prev => [...prev, approved]);
      toast.success(t('classroom.ui.pending_approve_success', undefined, { name: member.member_name }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.pending_approve_error'));
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectMember = async (member: ClassroomMember) => {
    setRejectingId(member.member_id);
    try {
      await spaceApi.classrooms.rejectMember(uid, member.member_id);
      setPendingMembers(prev => prev.filter(m => m.member_id !== member.member_id));
      toast.success(t('classroom.ui.pending_reject_success', undefined, { name: member.member_name }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.pending_reject_error'));
    } finally {
      setRejectingId(null);
    }
  };

  const handleApproveAll = async () => {
    for (const member of pendingMembers) {
      await handleApproveMember(member);
    }
  };

  const handleKickConfirm = async () => {
    if (!memberToKick) return;
    setKickingId(memberToKick.member_id);
    try {
      await spaceApi.classrooms.kickMember(uid, memberToKick.member_id);
      setMembers(prev => prev.filter(m => m.member_id !== memberToKick.member_id));
      toast.success(t('classroom.ui.kick_success', undefined, { name: memberToKick.member_name }));
      setMemberToKick(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.kick_error'));
    } finally {
      setKickingId(null);
    }
  };

  const handleBlockConfirm = async () => {
    if (!memberToBlock) return;
    const { member, scope } = memberToBlock;
    setBlockingMemberId(member.member_id);
    try {
      if (scope === 'global') {
        await spaceApi.classrooms.addGlobalBlacklist(member.member_id);
        toast.success(t('classroom.ui.block_global_success', undefined, { name: member.member_name }));
      } else {
        await spaceApi.classrooms.addClassroomBlacklist(uid, member.member_id);
        toast.success(t('classroom.ui.block_classroom_success', undefined, { name: member.member_name }));
      }
      try { await spaceApi.classrooms.kickMember(uid, member.member_id); } catch { /* already kicked */ }
      setMembers(prev => prev.filter(m => m.member_id !== member.member_id));
      setMemberToBlock(null);
    } catch {
      toast.error(t('classroom.ui.block_error'));
    } finally {
      setBlockingMemberId(null);
    }
  };

  const handleUnassignQuiz = async (quiz: Quiz) => {
    if (!window.confirm(t('classroom.ui.quiz_unassign_confirm', undefined, { title: quiz.title }))) return;
    setUnassigningUid(quiz.uid);
    try {
      await quizApi.unassignFromClassroom(quiz.uid, uid);
      setAssignedQuizzes(prev => prev.filter(q => q.uid !== quiz.uid));
      toast.success(t('classroom.ui.quiz_unassign_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.quiz_unassign_error'));
    } finally {
      setUnassigningUid(null);
    }
  };

  const handleOpenOnlineForExam = async (exam: Exam) => {
    try {
      const opened = await spaceApi.exams.openOnline(exam.uid, {
        late_threshold_seconds: 15 * 60,
        duration_seconds: (exam.duration_seconds || 45 * 60),
        camera_required: exam.camera_required ?? false,
        max_tab_leaves: exam.max_tab_leaves ?? 3,
        max_face_warnings: exam.max_face_warnings ?? 0,
      });
      setExams(prev => prev.map(e => e.uid === exam.uid ? opened.exam : e));
      toast.success(t('classroom.ui.exams_open_success', undefined, { count: opened.sessions.length }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_open_error'));
    }
  };

  const handleCloseOnline = async (exam: Exam) => {
    try {
      await spaceApi.exams.closeOnline(exam.uid);
      setExams(prev => prev.map(e =>
        e.uid === exam.uid ? { ...e, is_online_active: false, status: 'closed' } : e
      ));
      toast.success(t('classroom.ui.exams_close_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_close_error'));
    }
  };

  const fetchExams = React.useCallback(async () => {
    setLoadingExams(true);
    try {
      const data = await spaceApi.exams.listByClassroom(uid);
      setExams(getCanManageExams() ? data : data.filter(exam => exam.status === 'published'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_load_error'));
    } finally {
      setLoadingExams(false);
    }
  }, [uid]);

  useEffect(() => {
    if (activeTab === 'exams' || activeTab === 'final_exams') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Entering the tab initiates its request.
      void fetchExams();
    }
  }, [activeTab, fetchExams]);

  const fetchAiSessions = useCallback(async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/v1/space/course/classrooms/${uid}/ai-sessions/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAiSessions(data);
        if (!aiSessionId && data.length > 0) {
          setAiSessionId(data[0].session_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI sessions', err);
    }
  }, [uid, aiSessionId]);

  const fetchAiHistory = useCallback(async (sid: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/v1/space/course/classrooms/${uid}/ai-session/history/?session_id=${sid}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAiMessages(data.messages.map((m: any) => ({
          role: m.role,
          text: m.content,
          loading: false
        })));
      }
    } catch (err) {
      console.error('Failed to fetch AI history', err);
    }
  }, [uid]);

  const createNewAiSession = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/v1/space/course/classrooms/${uid}/ai-session/`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setAiSessionId(data.session_id);
        void fetchAiSessions();
      }
    } catch (err) {
      toast.error(t('classroom.ui.ai_create_session_error'));
    }
  };

  const clearAiSession = async () => {
    if (!aiSessionId) return;
    if (!window.confirm(t('classroom.ui.ai_delete_confirm'))) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/v1/space/course/classrooms/${uid}/ai-session/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: aiSessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSessionId(data.session_id);
        void fetchAiSessions();
      }
    } catch (err) {
      toast.error(t('classroom.ui.ai_delete_session_error'));
    }
  };

  useEffect(() => {
    if (activeTab === 'ai') {
      void fetchAiSessions();
    }
  }, [activeTab, fetchAiSessions]);

  useEffect(() => {
    if (aiSessionId) {
      void fetchAiHistory(aiSessionId);
    } else {
      setAiMessages([]);
    }
  }, [aiSessionId, fetchAiHistory]);




  // Auto-scroll AI chat to bottom on new messages
  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages]);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        void handleAiAsk(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error(t('classroom.ui.ai_mic_error'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleAiAsk = async (audioBlob?: Blob) => {
    if ((!aiQuestion.trim() && !audioBlob) || aiLoading) return;
    const question = aiQuestion.trim();
    setAiQuestion('');
    setAiLoading(true);
    
    if (question) {
      setAiMessages(prev => [...prev, { role: 'user', text: question }, { role: 'assistant', text: '', loading: true }]);
    } else {
      setAiMessages(prev => [...prev, { role: 'user', text: '🎤 [Tin nhắn thoại]' }, { role: 'assistant', text: '', loading: true }]);
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const body = new FormData();
      if (audioBlob) {
        body.append('audio', audioBlob, 'voice.webm');
      } else {
        body.append('question', question);
      }
      body.append('session_id', aiSessionId || '');
      body.append('mode', aiMode);

      const res = await fetch(`${apiBase}/api/v1/space/course/classrooms/${uid}/ask-stream/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: body,
      });

      if (!res.ok || !res.body) throw new Error(t('classroom.ui.ai_connect_error'));

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
            const event = JSON.parse(raw) as { type: string; text?: string; data?: AiMessage['sources'] | AiToolCall[]; message?: string; session_id?: string; transcript?: string; audio?: string };
            if (event.type === 'session_id') {
              if (event.transcript) {
                setAiMessages(prev => {
                  const lastUser = prev[prev.length - 2];
                  if (lastUser && lastUser.text === '🎤 [Tin nhắn thoại]') {
                    return [...prev.slice(0, -2), { ...lastUser, text: `🎤 ${event.transcript}` }, prev[prev.length - 1]];
                  }
                  return prev;
                });
              }
              if (!aiSessionId || aiSessionId !== event.session_id) {
                setAiSessionId(event.session_id as string);
                void fetchAiSessions();
              }
            } else if (event.type === 'chunk' && event.text) {
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                const next = (last.text + event.text!).replace(/\n{3,}/g, '\n\n');
                return [...prev.slice(0, -1), { ...last, loading: false, text: next }];
              });
            } else if (event.type === 'tool_calls') {
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, tool_calls: event.data as AiToolCall[] }];
              });
            } else if (event.type === 'sources') {
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, loading: false, sources: event.data as AiMessage['sources'] }];
              });
            } else if (event.type === 'audio' && event.audio) {
              const audio = new Audio(`data:audio/mpeg;base64,${event.audio}`);
              void audio.play().catch(e => console.error('Audio play failed', e));
            } else if (event.type === 'error') {
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, loading: false, text: event.message ?? t('classroom.ui.ai_error_generic') }];
              });
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }
      // Ensure loading cleared
      setAiMessages(prev => {
        const last = prev[prev.length - 1];
        return last.loading ? [...prev.slice(0, -1), { ...last, loading: false }] : prev;
      });
    } catch (err: unknown) {
      setAiMessages(prev => {
        const last = prev[prev.length - 1];
        return last ? [...prev.slice(0, -1), {
          ...last,
          loading: false,
          text: err instanceof Error ? err.message : t('classroom.ui.ai_error_generic'),
        }] : prev;
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeleteExam = async (exam: Exam) => {
    if (!canManageExams || deletingExamUid) return;
    const confirmed = window.confirm(t('classroom.ui.exams_delete_confirm', undefined, { title: exam.title }));
    if (!confirmed) return;

    setDeletingExamUid(exam.uid);
    try {
      await spaceApi.exams.deleteExam(exam.uid);
      setExams(prev => prev.filter(item => item.uid !== exam.uid));
      toast.success(t('classroom.ui.exams_deleted'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_delete_error'));
    } finally {
      setDeletingExamUid(null);
    }
  };

  const latestMeeting = meetingRooms[0] || null;

  const handleStartMeeting = async (source: 'screen' | 'camera') => {
    if (!classroom || meetingAction) return;
    if (!classroom || meetingAction) return;

    setMeetingAction('start');
    try {
      const room = activeMeeting || await spaceApi.meetingRooms.quickStart({
        classroom_uid: uid,
        title: `Buổi học trực tuyến - ${classroom.name}`,
        description: `Phòng học trực tuyến cho lớp ${classroom.name}`,
        max_participants: classroom.max_students,
      });
      setMeetingRooms(prev => [room, ...prev.filter(item => item.uid !== room.uid)]);
      await startMediaShare(source);
      toast.success(source === 'screen' ? t('classroom.ui.meeting_start_success_screen') : t('classroom.ui.meeting_start_success_camera'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.meeting_start_error'));
    } finally {
      setMeetingAction(null);
    }
  };

  const handleEndMeeting = async () => {
    if (!activeMeeting || meetingAction) return;

    setMeetingAction('end');
    try {
      stopScreenShare();
      const ended = await spaceApi.meetingRooms.end(activeMeeting.uid);
      setMeetingRooms(prev => prev.map(room => room.uid === ended.uid ? ended : room));
      toast.success(t('classroom.ui.meeting_ended_toast'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.meeting_end_error'));
    } finally {
      setMeetingAction(null);
    }
  };

  const handleDownloadQr = () => {
    if (!linkData || !classroom) return;

    try {
      toast.info(t('classroom.messages.creating_qr'));
      const joinUrl = `${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`;

      let svgString = renderToStaticMarkup(
        <QRCodeSVG
          value={joinUrl}
          size={400}
          level="H"
          includeMargin={true}
        />
      );

      if (!svgString.includes('xmlns=')) {
        svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img");
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = 500;
        canvas.height = 500;
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 50, 50, 400, 400);

          const pngUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `QR_Lop_${classroom.name}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          toast.success(t('classroom.messages.qr_downloaded'));
        }
        URL.revokeObjectURL(blobUrl);
      };

      img.onerror = () => {
        toast.error(t('classroom.ui.qr_error_generic'));
        URL.revokeObjectURL(blobUrl);
      };

      img.src = blobUrl;
    } catch {
      toast.error(t('classroom.ui.qr_download_error'));
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="text-sm font-medium">{t('classroom.ui.classroom_loading')}</p>
      </div>
    );
  }

  if (!classroom) return null;

  const visibleExams = canManageExams ? exams : exams.filter(exam => exam.status === 'published');
  const selectedKind: ExamKind = (['midterm', 'final', 'regular'] as ExamKind[]).includes(selectedExamKind) ? selectedExamKind : 'midterm';
  const filteredExams = visibleExams.filter(exam => isExamInKind(exam, selectedKind));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/space/classrooms')}
            className="w-12 h-12 rounded-full bg-card shadow-sm hover:bg-accent transition-all hover:scale-110 active:scale-95"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-black bg-primary-brand text-white px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
                {t('classroom.ui.classroom_id_badge', undefined, { id: classroom.pid })}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                {t('classroom.ui.page_subtitle')}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{classroom.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/space/classrooms/edit/${classroom.uid}`)}
            className="h-12 rounded-xl px-6 gap-2.5 font-bold text-xs hover:bg-card text-muted-foreground uppercase tracking-widest bg-muted/50"
          >
            <Settings size={18} />
            {t('classroom.ui.settings_btn')}
          </Button>
          <Button
            onClick={() => { setShowPendingSheet(true); loadPendingMembers(); }}
            className="relative h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-6 gap-2.5 font-bold text-xs shadow-lg shadow-amber-500/20 uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Users size={18} />
            {t('classroom.ui.approve_btn')}
            {pendingMembers.length > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center px-1 shadow">
                {pendingMembers.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-8 items-start">
        {/* Left Sidebar */}
        <div className={`shrink-0 transition-all duration-300 space-y-3 ${sidebarCollapsed ? 'w-[52px]' : 'w-[268px]'}`}>
          {sidebarCollapsed ? (
            /* ── Collapsed: icon-only ── */
            <div className="bg-card rounded-3xl shadow-sm overflow-hidden py-1">
              {/* Expand button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(false)}
                title={t('classroom.ui.expand_sidebar')}
                className="w-full h-10 rounded-none hover:bg-muted transition-colors"
              >
                <ChevronsRight size={16} className="text-muted-foreground" />
              </Button>
              <div className="mx-3 mb-1" />
              {/* All tabs as icons */}
              {([
                { id: 'info',     label: t('classroom.ui.tab_info'),     icon: Info },
                { id: 'docs',     label: t('classroom.ui.tab_docs'),     icon: FileText },
                { id: 'ai',       label: t('classroom.ui.tab_ai'),       icon: Bot },
                { id: 'chat',     label: t('classroom.ui.tab_chat'),     icon: MessageSquare },
                { id: 'meeting',  label: t('classroom.ui.tab_meeting'),  icon: Video },
                { id: 'calendar', label: t('classroom.ui.tab_calendar'), icon: Calendar },
                { id: 'exams',    label: t('classroom.ui.tab_exams'),    icon: ClipboardList },
                { id: 'final_exams', label: t('classroom.ui.tab_final_exams'), icon: BarChart2 },
                { id: 'quiz',     label: t('classroom.ui.tab_quiz'),     icon: Gamepad2 },
                { id: 'students',  label: t('classroom.ui.tab_students'),  icon: Users },
                { id: 'ranking',  label: t('classroom.ui.tab_ranking'),  icon: Trophy },
                { id: 'leave_request', label: t('classroom.ui.tab_leave_request', 'Xin nghỉ'), icon: ClipboardList },
                { id: 'blacklist', label: t('classroom.ui.tab_blacklist'), icon: ShieldBan },
              ] as const).map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <Button
                    key={id}
                    variant="ghost"
                    size="icon"
                    title={label}
                    onClick={() => goToTab(id as ActiveTab)}
                    className={`relative w-full h-10 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 w-1 h-5 bg-primary-brand rounded-r-full top-1/2 -translate-y-1/2" />}
                    <Icon size={18} />
                    {id === 'meeting' && activeMeeting && (
                      <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                  </Button>
                );
              })}
            </div>
          ) : (
            /* ── Expanded: full labels ── */
            <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
              {/* Collapse button */}
              <div className="flex items-center justify-between px-5 py-2.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{t('classroom.ui.menu_label')}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(true)}
                  title={t('classroom.ui.collapse_sidebar')}
                  className="h-8 w-8 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronsLeft size={15} className="text-muted-foreground" />
                </Button>
              </div>

              {/* Nhóm 1: Thông tin lớp */}
              <Button
                variant="ghost"
                onClick={() => toggleGroup('classroom')}
                className="w-full h-auto flex items-center justify-between px-5 py-3 rounded-none text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {t('classroom.ui.group_class_info')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${openGroups.classroom ? '' : '-rotate-90'}`} />
              </Button>
              {openGroups.classroom && (
                <div className="pb-1 px-1">
                  {[
                    { id: 'info',    label: t('classroom.ui.tab_info'),    icon: Info },
                    { id: 'docs',    label: t('classroom.ui.tab_docs'),    icon: FileText },
                    { id: 'ai',      label: t('classroom.ui.tab_ai'),      icon: Bot },
                    { id: 'chat',    label: t('classroom.ui.tab_chat'),    icon: MessageSquare },
                    { id: 'meeting', label: t('classroom.ui.tab_meeting'), icon: Video },
                    { id: 'calendar', label: t('classroom.ui.tab_calendar'), icon: Calendar },
                  ].map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                      <Button
                        key={id}
                        variant="ghost"
                        onClick={() => goToTab(id as ActiveTab)}
                        className={`w-full h-auto justify-start flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                          isActive
                            ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {isActive && <div className="absolute left-0 w-1.5 h-5 bg-primary-brand rounded-r-full" />}
                        <Icon size={18} className={isActive ? 'text-primary-brand' : 'text-muted-foreground group-hover:text-foreground'} />
                        {label}
                        {id === 'meeting' && activeMeeting && (
                          <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}

              <div className="mx-4" />

              {/* Nhóm 2: Học tập & Đánh giá */}
              <Button
                variant="ghost"
                onClick={() => toggleGroup('learning')}
                className="w-full h-auto flex items-center justify-between px-5 py-3 rounded-none text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {t('classroom.ui.group_learning')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${openGroups.learning ? '' : '-rotate-90'}`} />
              </Button>
              {openGroups.learning && (
                <div className="pb-1 px-1">
                  {[
                    { id: 'final_exams', label: t('classroom.ui.tab_final_exams'), icon: BarChart2 },
                    { id: 'exams', label: t('classroom.ui.tab_exams'), icon: ClipboardList },
                    { id: 'quiz',  label: t('classroom.ui.tab_quiz'),    icon: Gamepad2 },
                  ].map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                      <Button
                        key={id}
                        variant="ghost"
                        onClick={() => goToTab(id as ActiveTab)}
                        className={`w-full h-auto justify-start flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                          isActive
                            ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {isActive && <div className="absolute left-0 w-1.5 h-5 bg-primary-brand rounded-r-full" />}
                        <Icon size={18} className={isActive ? 'text-primary-brand' : 'text-muted-foreground group-hover:text-foreground'} />
                        {label}
                      </Button>
                    );
                  })}
                </div>
              )}

              <div className="mx-4" />

              {/* Nhóm 3: Quản lý sinh viên */}
              <Button
                variant="ghost"
                onClick={() => toggleGroup('students')}
                className="w-full h-auto flex items-center justify-between px-5 py-3 rounded-none text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {t('classroom.ui.group_students')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${openGroups.students ? '' : '-rotate-90'}`} />
              </Button>
              {openGroups.students && (
                <div className="pb-2 px-1">
                  {(() => {
                    const isActive = activeTab === 'students';
                    return (
                      <Button
                        variant="ghost"
                        onClick={() => goToTab('students')}
                        className={`w-full h-auto justify-start flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                          isActive
                            ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {isActive && <div className="absolute left-0 w-1.5 h-5 bg-primary-brand rounded-r-full" />}
                        <Users size={18} className={isActive ? 'text-primary-brand' : 'text-muted-foreground group-hover:text-foreground'} />
                        {t('classroom.ui.tab_students')}
                        {members.filter(m => m.role === 'student').length > 0 && (
                          <span className="ml-auto text-[10px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            {members.filter(m => m.role === 'student').length}
                          </span>
                        )}
                      </Button>
                    );
                  })()}
                  {(() => {
                    const isActive = activeTab === 'ranking';
                    return (
                      <Button
                        variant="ghost"
                        onClick={() => goToTab('ranking')}
                        className={`w-full h-auto justify-start flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                          isActive
                            ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {isActive && <div className="absolute left-0 w-1.5 h-5 bg-primary-brand rounded-r-full" />}
                        <Trophy size={18} className={isActive ? 'text-primary-brand' : 'text-muted-foreground group-hover:text-foreground'} />
                        {t('classroom.ui.tab_ranking')}
                      </Button>
                    );
                  })()}
                  {(() => {
                    const isActive = activeTab === 'blacklist';
                    return (
                      <Button
                        variant="ghost"
                        onClick={() => goToTab('blacklist')}
                        className={`w-full h-auto justify-start flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                          isActive
                            ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {isActive && <div className="absolute left-0 w-1.5 h-5 bg-primary-brand rounded-r-full" />}
                        <ShieldBan size={18} className={isActive ? 'text-primary-brand' : 'text-muted-foreground group-hover:text-foreground'} />
                        {t('classroom.ui.tab_blacklist')}
                        {blacklist.length > 0 && (
                          <span className="ml-auto text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                            {blacklist.length}
                          </span>
                        )}
                      </Button>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {!sidebarCollapsed && <>
            <Card className="shadow-sm rounded-[32px] overflow-hidden bg-card p-8">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">{t('classroom.ui.class_size_title')}</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-foreground tracking-tighter">
                  {members.filter(m => m.role === 'student').length}
                </span>
                <span className="text-muted-foreground font-bold text-lg">{t('classroom.ui.students_count_suffix', undefined, { count: classroom.max_students })}</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-primary-brand rounded-full shadow-[0_0_8px_rgba(79,70,229,0.3)] transition-all duration-1000"
                  style={{ width: `${classroom.max_students > 0 ? Math.min(100, (members.filter(m => m.role === 'student').length / classroom.max_students) * 100) : 0}%` }}
                />
              </div>
            </Card>

            <Card className="shadow-xl rounded-[32px] overflow-hidden bg-gradient-to-br from-primary-brand to-primary-brand-dark text-white p-8 relative group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <QrCode size={140} />
              </div>
              <div className="relative">
                <h3 className="text-[10px] font-bold text-primary-brand-muted uppercase tracking-[0.3em] mb-4">{t('classroom.ui.join_code_title')}</h3>
                <div className="text-4xl font-bold tracking-[0.2em] mb-8">{linkData?.code || t('classroom.ui.join_code_fallback')}</div>
                <Button
                  variant="ghost"
                  onClick={handleDownloadQr}
                  className="w-full bg-card/10 hover:bg-card/20 backdrop-blur-md text-white rounded-2xl h-12 font-bold text-xs tracking-widest gap-3 transition-all uppercase"
                >
                  <QrCode size={18} /> {t('classroom.ui.download_qr_action')}
                </Button>
              </div>
            </Card>
          </>}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-8">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-300">
              {/* Mô tả Card */}
              <div className="bg-card rounded-[32px] p-10 shadow-sm group">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand">
                    <Info size={22} />
                  </div>
                  {t('classroom.ui.info_description_title')}
                </h3>
                <div className="bg-muted/50 p-8 rounded-3xl text-muted-foreground font-medium leading-relaxed italic text-lg relative">
                  <span className="absolute -top-4 -left-2 text-6xl text-muted-foreground/10 font-serif opacity-50">&ldquo;</span>
                  {classroom.description}
                  <span className="absolute -bottom-10 -right-2 text-6xl text-muted-foreground/10 font-serif opacity-50">&rdquo;</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* QR Code Card */}
                <div className="bg-card rounded-[32px] p-10 shadow-sm flex flex-col items-center">
                  <h3 className="text-lg font-bold text-foreground mb-8 self-start flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand">
                      <QrCode size={22} />
                    </div>
                    {t('classroom.ui.info_qr_card_title')}
                  </h3>
                  <div className="p-10 bg-card rounded-[40px] mb-10 shadow-inner group transition-all">
                    <div className="p-6 bg-muted rounded-[32px] group-hover:scale-105 transition-transform duration-500">
                      {linkData && (
                        <QRCodeSVG
                          id="classroom-qr"
                          value={`${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`}
                          size={200}
                          level="H"
                          includeMargin={true}
                          className="dark:bg-card dark:p-2 dark:rounded-xl"
                        />
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadQr}
                    className="w-full h-14 bg-primary-brand/10 hover:bg-primary-brand/20 text-primary-brand rounded-[20px] font-bold text-xs gap-3 transition-all uppercase tracking-widest"
                  >
                    <Download size={20} /> {t('classroom.ui.info_qr_download')}
                  </Button>
                </div>

                {/* Activity Log Timeline Card */}
                <div className="bg-card rounded-[32px] p-10 shadow-sm flex flex-col">
                  <div className="flex flex-col gap-4 mb-8">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand shrink-0">
                        <RotateCcw size={22} />
                      </div>
                      <span>{t('classroom.ui.info_activity_title')}</span>
                    </h3>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        {(['major', 'detail'] as const).map((lvl) => (
                          <Button
                            key={lvl}
                            variant="ghost"
                            onClick={() => setActivityLevel(lvl)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all bg-transparent! hover:bg-transparent! active:bg-transparent! focus-visible:bg-transparent! focus-visible:ring-0! shadow-none ${
                              activityLevel === lvl
                                ? 'text-primary-brand font-black'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {lvl === 'major' ? t('classroom.ui.info_level_major') : t('classroom.ui.info_level_detail')}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => router.push(`/space/classrooms/${uid}/activity`)}
                        className="flex items-center gap-1.5 text-[10px] font-black text-primary-brand hover:text-primary-brand uppercase tracking-widest px-3 py-1.5 rounded-xl bg-transparent! hover:bg-transparent! active:bg-transparent! focus-visible:bg-transparent! focus-visible:ring-0! shadow-none"
                      >
                        {t('classroom.ui.info_view_all')}
                        <ChevronRight size={13} />
                      </Button>
                    </div>
                  </div>

                  {loadingActivity ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 size={28} className="animate-spin text-primary-brand" />
                    </div>
                  ) : activityLogs.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <RotateCcw size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">{t('classroom.ui.info_no_activity')}</p>
                    </div>
                  ) : (
                    <div className="space-y-0 pl-3 overflow-y-auto max-h-80">
                      {activityLogs.map((log, idx) => {
                        const { icon: Icon, color, bg, label } = getActivityMeta(log.event_type, t);
                        const isLast = idx === activityLogs.length - 1;
                        return (
                          <div
                            key={log.uid}
                            className={`flex gap-4 items-start relative${!isLast ? ' pb-6' : ''}`}
                          >
                            {!isLast && (
                              <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-muted" />
                            )}
                            <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center shrink-0 z-10`}>
                              <Icon size={13} className={color} />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="text-sm font-semibold text-foreground leading-snug">
                                {label}{log.target_name ? `: ${log.target_name}` : ''}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                                {log.actor_name && <span className="font-bold">{log.actor_name}</span>}
                                <span>•</span>
                                <span>{localeFormatDateTime(log.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.docs_title')}</h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">{t('classroom.ui.docs_subtitle')}</p>
              </div>
              <ClassroomDocsManager
                classroomUid={uid}
                apiBase={apiBase}
                accessToken={typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null}
                canManage={isTeacher}
                t={t}
              />
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="flex h-[calc(100vh-260px)] animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm">
              {/* AI Sidebar */}
              <div className="w-72 bg-muted/20 flex flex-col hidden md:flex">
                <div className="p-6 flex items-center justify-between bg-card">
                  <h4 className="font-bold text-sm text-foreground">{t('classroom.ui.ai_history_title')}</h4>
                  <Button variant="ghost" size="icon" onClick={createNewAiSession} className="h-8 w-8 rounded-lg hover:bg-primary-brand-light hover:text-primary-brand">
                    <Plus size={16} />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {aiSessions.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <p className="text-xs text-muted-foreground">{t('classroom.ui.ai_no_conversations')}</p>
                    </div>
                  ) : (
                    aiSessions.map((s) => (
                      <Button
                        key={s.session_id}
                        variant="ghost"
                        onClick={() => setAiSessionId(s.session_id)}
                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 group justify-start ${
                          aiSessionId === s.session_id
                            ? '!bg-primary-brand !text-white shadow-md shadow-primary-brand/20 hover:!bg-primary-brand hover:!text-white'
                            : '!bg-transparent text-muted-foreground hover:!bg-primary-brand-light/50 hover:!text-primary-brand'
                        }`}
                      >
                        <p className={`text-xs font-bold truncate ${aiSessionId === s.session_id ? 'text-white' : 'text-foreground group-hover:text-primary-brand'}`}>
                          {s.title || t('classroom.ui.ai_new_conversation')}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`text-[10px] ${aiSessionId === s.session_id ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {t('classroom.ui.ai_messages_count', undefined, { count: s.msg_count })}
                          </span>
                          <span className={`text-[10px] ${aiSessionId === s.session_id ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {localeFormatDate(s.updated_at)}
                          </span>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col min-w-0 bg-card">
                {/* Header */}
                <div className="px-8 py-5 bg-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-brand flex items-center justify-center shadow-lg shadow-primary-brand-muted shrink-0">
                  <Bot size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.ai_assistant')}</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">
                    {AI_MODES.find(m => m.key === aiMode)?.description}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <VoiceSettingsDialog
                    getSettings={() => userSettingsApi.getSettings()}
                    updateSettings={(data) => userSettingsApi.updateSettings(data)}
                    getAvailableVoices={() => userSettingsApi.getAvailableVoices()}
                    previewVoice={(voiceId, text) => userSettingsApi.previewVoice(voiceId, text)}
                  />
                  {aiMessages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAiSession}
                      className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
                    >
                      {t('classroom.ui.ai_clear_history')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
                {aiMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary-brand-light flex items-center justify-center mb-4">
                      <Sparkles size={32} className="text-primary-brand" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{t('classroom.ui.ai_greeting')}</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
                      {t('classroom.ui.ai_greeting_desc')}
                    </p>
                  </div>
                )}

                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-9 h-9 rounded-xl bg-primary-brand flex items-center justify-center shadow-md shrink-0 mt-0.5">
                        <Bot size={16} className="text-white" />
                      </div>
                    )}
                    <div className={`max-w-[76%] rounded-2xl px-5 py-3.5 ${
                      msg.role === 'user'
                        ? 'bg-primary-brand text-white rounded-br-md shadow-md shadow-primary-brand/20'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}>
                      <div className="text-sm font-medium leading-relaxed space-y-1.5">
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
                                  <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse rounded align-middle" />
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
                      {msg.tool_calls && msg.tool_calls.length > 0 && (
                        <div className="mt-3 pt-3 space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('classroom.ui.ai_executed')}</p>
                          {msg.tool_calls.map((tc, j) => (
                            <div key={j} className="text-[11px] text-muted-foreground bg-background/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
                              <span className="shrink-0 text-primary-brand">⚙</span>
                              <span className="font-mono font-semibold text-foreground">{tc.tool}</span>
                              {tc.args && Object.keys(tc.args).length > 0 && (
                                <span className="truncate text-muted-foreground">
                                  ({Object.entries(tc.args).map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`).join(', ')})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('classroom.ui.ai_sources')}</p>
                          {msg.sources.slice(0, 3).map((src, j) => (
                            <div key={j} className="text-[11px] text-muted-foreground bg-background/60 rounded-lg px-3 py-1.5 flex items-center justify-between gap-3">
                              <span className="truncate">{src.metadata?.doc_name ?? src.metadata?.resource_uid ?? t('classroom.ui.ai_doc_label')}</span>
                              <span className="shrink-0 font-bold text-primary-brand">{(src.score * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Users size={16} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-6 bg-muted/30">
                {/* Mode selector */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {AI_MODES.map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant="ghost"
                      onClick={() => setAiMode(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        aiMode === key
                          ? '!bg-primary-brand !text-white shadow-md shadow-primary-brand/20 hover:!bg-primary-brand hover:!text-white'
                          : '!bg-muted !text-muted-foreground hover:!bg-primary-brand-light hover:!text-primary-brand'
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px] flex gap-2">
                    {isRecording ? (
                      <Button
                        variant="ghost"
                        onClick={stopRecording}
                        className="flex-1 h-12 flex items-center justify-center gap-2 !bg-rose-500 !text-white rounded-2xl text-xs font-black uppercase tracking-wide animate-pulse hover:!bg-rose-500 hover:!text-white"
                      >
                        <Square size={14} fill="white" />
                        {t('classroom.ui.ai_speaking')}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          disabled={aiLoading}
                          onClick={() => void startRecording()}
                          className="h-12 w-12 flex items-center justify-center !bg-muted !text-muted-foreground rounded-2xl hover:!bg-primary-brand-light hover:!text-primary-brand disabled:opacity-50 transition-all shrink-0"
                          title={t('classroom.ui.ai_mic_title')}
                        >
                          <Mic size={18} />
                        </Button>
                        <Input
                          type="text"
                          value={aiQuestion}
                          onChange={e => setAiQuestion(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleAiAsk(); } }}
                          placeholder={AI_MODES.find(m => m.key === aiMode)?.placeholder ?? t('classroom.ui.ai_placeholder')}
                          disabled={aiLoading}
                          className="flex-1 h-12 min-w-0 rounded-2xl bg-background px-5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-brand/30 disabled:opacity-60"
                        />
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => void handleAiAsk()}
                    disabled={!aiQuestion.trim() || aiLoading || isRecording}
                    className="h-12 w-12 rounded-2xl !bg-primary-brand hover:!bg-primary-brand-dark !text-white p-0 shadow-lg shadow-primary-brand/20 disabled:opacity-50 shrink-0 hover:!text-white"
                  >
                    {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

          {activeTab === 'chat' && (
            <div className="bg-card rounded-[32px] overflow-hidden shadow-sm h-[calc(100vh-260px)] flex flex-col">
              {conversationUid ? (
                <ClassroomChatPanel
                  conversationUid={conversationUid}
                  classroomUid={uid}
                  active={activeTab === 'chat'}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="animate-spin mb-4 text-primary-brand" size={40} />
                  <p className="text-sm font-bold uppercase tracking-widest">{t('classroom.labels.chat_loading')}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'meeting' && (
            <div className="flex h-full flex-col animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm">
              <div className="p-10 bg-muted/50 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.meeting_title')}</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">{t('classroom.ui.meeting_subtitle')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                    activeMeeting
                      ? 'bg-emerald-50 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-card text-muted-foreground'
                  }`}>
                    {activeMeeting ? <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> : <WifiOff size={14} />}
                    {activeMeeting ? t('classroom.ui.meeting_status_active') : t('classroom.ui.meeting_status_offline')}
                  </span>

                  {activeMeeting ? (
                    <div className="flex items-center gap-3">
                      {!localStream ? (
                        <>
                          <Button
                            onClick={() => void handleStartMeeting('camera')}
                            disabled={meetingAction !== null}
                            variant="outline"
                            className="h-12 rounded-2xl px-6 gap-2.5 text-xs font-bold hover:bg-muted uppercase tracking-widest"
                          >
                            {meetingAction === 'start' ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                            {t('classroom.ui.meeting_enable_camera')}
                          </Button>
                          <Button
                            onClick={() => void handleStartMeeting('screen')}
                            disabled={meetingAction !== null}
                            variant="outline"
                            className="h-12 rounded-2xl px-6 gap-2.5 text-xs font-bold hover:bg-muted uppercase tracking-widest"
                          >
                            {meetingAction === 'start' ? <Loader2 size={18} className="animate-spin" /> : <MonitorUp size={18} />}
                            {t('classroom.ui.meeting_share_screen')}
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={stopMediaShare}
                          disabled={meetingAction !== null}
                          variant="outline"
                          className="h-12 rounded-2xl px-6 gap-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 uppercase tracking-widest"
                        >
                          <WifiOff size={18} />
                          {t('classroom.ui.meeting_stop_streaming')}
                        </Button>
                      )}
                      <Button
                        onClick={() => void handleEndMeeting()}
                        disabled={meetingAction !== null}
                        variant="destructive"
                        className="h-12 rounded-2xl px-6 gap-2.5 text-xs font-bold shadow-lg shadow-rose-100 uppercase tracking-widest"
                      >
                        {meetingAction === 'end' ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                        {t('classroom.ui.meeting_end')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => void handleStartMeeting('camera')}
                        disabled={meetingAction !== null}
                        className="h-12 rounded-2xl bg-primary-brand px-8 gap-2.5 text-xs font-bold text-white shadow-lg shadow-primary-brand/20 hover:bg-primary-brand-dark uppercase tracking-widest transition-all"
                      >
                        {meetingAction === 'start' ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
                        {t('classroom.ui.meeting_open_class')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                {loadingMeetings ? (
                  <div className="flex h-60 items-center justify-center text-muted-foreground/50">
                    <Loader2 size={48} className="animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                      <div className="rounded-3xl bg-card p-6 shadow-sm group transition-all">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">{t('classroom.ui.meeting_status_label')}</div>
                        <div className="text-lg font-bold text-foreground flex items-center gap-2">
                          {activeMeeting ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              {t('classroom.ui.meeting_teaching')}
                            </>
                          ) : t('classroom.ui.meeting_ready')}
                        </div>
                        <div className="mt-2 text-xs font-medium text-muted-foreground leading-relaxed">
                          {activeMeeting ? `${t('classroom.ui.meeting_started_at', undefined, { time: formatDateTime(activeMeeting.started_at || activeMeeting.created_at) })}` : t('classroom.ui.meeting_ready_desc')}
                        </div>
                      </div>
                      <div className="rounded-3xl bg-card p-6 shadow-sm group transition-all">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Học viên đang tham gia</div>
                        <div className="flex items-center gap-3 text-lg font-bold text-foreground">
                          <Users size={20} className="text-indigo-500" />
                          {activeMeeting ? `${activeMeeting.participant_count || 0}` : '0'}
                        </div>
                        <div className="mt-2 text-xs font-medium text-muted-foreground leading-relaxed">
                          {activeMeeting ? 'Sinh viên đang ở trong phòng' : 'Mở lớp để học viên tham gia'}
                        </div>
                      </div>
                      <div className="rounded-3xl bg-card p-6 shadow-sm group transition-all">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">{t('classroom.ui.meeting_real_time')}</div>
                        <div className="flex items-center gap-3 text-lg font-bold text-foreground">
                          {rtcConnected ? <Wifi size={20} className="text-emerald-500" /> : <WifiOff size={20} className="text-muted-foreground/50" />}
                          {rtcConnected ? t('classroom.ui.meeting_connected') : t('classroom.ui.meeting_waiting')}
                        </div>
                        <div className="mt-2 text-xs font-medium text-muted-foreground leading-relaxed">{t('classroom.ui.meeting_real_time_desc')}</div>
                      </div>
                      <div className="rounded-3xl bg-card p-6 shadow-sm group transition-all">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">{t('classroom.ui.meeting_latest')}</div>
                        <div className="text-sm font-bold text-foreground truncate">
                          {latestMeeting?.title || t('classroom.ui.meeting_no_history')}
                        </div>
                        <div className="mt-2 text-xs font-medium text-muted-foreground leading-relaxed">
                          {latestMeeting ? `${t('classroom.ui.meeting_started_at', undefined, { time: formatDateTime(latestMeeting.created_at) })}` : t('classroom.ui.meeting_no_history_desc')}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[40px] bg-slate-950 p-6 shadow-2xl shadow-primary-brand/10">
                      {remoteStream ? (
                        <div className="rounded-[24px] overflow-hidden">
                          <ScreenShareViewer stream={remoteStream} label={t('classroom.ui.meeting_remote_stream')} />
                        </div>
                      ) : localStream ? (
                        <div className="rounded-[24px] overflow-hidden">
                          <ScreenShareViewer stream={localStream} label={localSource === 'camera' ? t('classroom.ui.meeting_camera_streaming') : t('classroom.ui.meeting_screen_sharing')} />
                        </div>
                      ) : (
                        <div className="flex aspect-video flex-col items-center justify-center rounded-[32px] text-center text-muted-foreground bg-slate-900/50">
                          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                            <Video size={32} className="opacity-40" />
                          </div>
                          <p className="text-base font-bold text-muted-foreground uppercase tracking-[0.2em]">{t('classroom.ui.meeting_signal_empty')}</p>
                          <p className="mt-2 text-sm font-medium text-muted-foreground">{t('classroom.ui.meeting_signal_empty_desc')}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="animate-in fade-in duration-300 bg-card rounded-3xl shadow-sm p-6 sm:p-8">
              <ClassroomCalendarTab classroomUid={uid} classroomName={classroom?.name} />
            </div>
          )}

          {activeTab === 'leave_request' && (
            <div className="animate-in fade-in duration-300 bg-card rounded-3xl shadow-sm p-6 sm:p-8">
              <LeaveRequestTab
                role="teacher"
                classroomId={uid}
                classroomName={classroom?.name}
                api={{
                  list: (params) => spaceLeaveRequestApi.list({ classroom_id: params.classroom_id, status: params.status }),
                  process: (lrUid, input) => spaceLeaveRequestApi.process(lrUid, input),
                }}
                listEvents={async () => {
                  const now = new Date();
                  const start = new Date(now);
                  start.setDate(start.getDate() - 7);
                  const end = new Date(now);
                  end.setDate(end.getDate() + 60);
                  const data = await spaceCalendarApi.list({
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
                canCreate={false}
              />
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm">
              <div className="p-10 bg-muted/50 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.exams_title')}</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">{t('classroom.ui.exams_subtitle')}</p>
                </div>
                {canManageExams && (
                  <Button
                    onClick={() => router.push(`/space/classrooms/${uid}/exams/create`)}
                    className="h-12 rounded-2xl bg-primary-brand px-8 gap-3 text-xs font-bold text-white shadow-lg shadow-primary-brand/20 hover:bg-primary-brand-dark uppercase tracking-widest transition-all"
                  >
                    <Plus size={20} />
                    {t('classroom.ui.exams_create')}
                  </Button>
                )}
              </div>

              <div className="p-10 flex-1 overflow-y-auto space-y-8">
                <div className="flex flex-wrap items-center gap-3 bg-muted p-1.5 rounded-2xl w-fit">
                  {(['midterm', 'final', 'regular'] as ExamKind[]).map(kind => (
                    <Button
                      key={kind}
                      variant="ghost"
                      onClick={() => goToExamKind(kind)}
                      className={`px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                        selectedExamKind === kind
                          ? '!bg-card !text-primary-brand shadow-sm hover:!bg-card hover:!text-primary-brand'
                          : '!bg-transparent !text-muted-foreground hover:!bg-transparent hover:!text-foreground'
                      }`}
                    >
                      {t(`classroom.ui.exam_kind_${kind}`)}
                    </Button>
                  ))}
                </div>

                <div className="space-y-4">
                  {loadingExams ? (
                    <div className="flex h-40 items-center justify-center text-muted-foreground/50">
                      <Loader2 size={32} className="animate-spin" />
                    </div>
                  ) : filteredExams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 bg-muted/30 rounded-[32px]">
                      <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4 shadow-sm">
                        <ClipboardList size={24} className="opacity-40" />
                      </div>
                      <p className="text-sm font-bold text-foreground uppercase tracking-widest">{t('classroom.ui.exams_empty')}</p>
                      <p className="text-xs font-medium mt-1">{t('classroom.ui.exams_empty_kind', undefined, { kind: t(`classroom.ui.exam_kind_${selectedKind}`).toLowerCase() })}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredExams.map(exam => (
                        <div key={exam.uid} className="bg-card p-6 rounded-[24px] shadow-sm flex items-center gap-6 group transition-all hover:shadow-lg">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all group-hover:scale-110 ${
                            exam.status === 'published' ? 'bg-primary-brand-light text-primary-brand' : 'bg-muted text-muted-foreground'
                          }`}>
                            <FileText size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-base font-bold text-foreground group-hover:text-primary-brand transition-colors">{exam.title}</h4>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                exam.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-muted text-muted-foreground'
                              }`}>
                                {exam.status === 'published' ? t('classroom.ui.exams_published') : t('classroom.ui.exams_draft')}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              <span className="flex items-center gap-1.5"><FileText size={12} /> {exam.content_type}</span>
                              <span className="flex items-center gap-1.5"><Clock size={12} /> {formatDateTime(exam.due_date)}</span>
                              {exam.created_at && (
                                <span className="flex items-center gap-1.5"><Calendar size={12} /> {localeFormatDate(exam.created_at)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => router.push(`/space/classrooms/${uid}/exams/${exam.uid}`)}
                              className="h-10 rounded-xl px-4 font-bold text-xs bg-muted hover:bg-primary-brand hover:text-white text-muted-foreground transition-all uppercase tracking-widest"
                            >
                              {t('classroom.ui.exams_view_detail')}
                            </Button>
                            {canManageExams && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground/50 hover:text-foreground transition-colors">
                                    <MoreVertical size={20} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl">
                                  <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-muted-foreground hover:text-primary-brand cursor-pointer" onClick={() => router.push(`/space/classrooms/${uid}/exams/edit/${exam.uid}`)}>
                                    <Pencil size={16} className="mr-3 text-muted-foreground" />
                                    {t('classroom.ui.exams_edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-2 bg-muted" />
                                  <DropdownMenuItem
                                    className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-rose-600 cursor-pointer"
                                    onClick={() => void handleDeleteExam(exam)}
                                  >
                                    <Trash2 size={16} className="mr-3" />
                                    {t('classroom.ui.exams_delete')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'final_exams' && (() => {
            const activeExams = exams.filter(e => e.status === 'ongoing');
            const completedExams = exams.filter(e => e.status === 'closed');
            const hasAnySession = activeExams.length > 0 || completedExams.length > 0;
            const tabExams = examSubTab === 'ongoing' ? activeExams : completedExams;

            return (
              <div className="flex flex-col h-full animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm">
                {/* Header */}
                <div className="px-10 pt-10 pb-0 bg-muted/50">
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.final_exams_title')}</h3>
                      <p className="text-sm text-muted-foreground font-medium mt-1">{t('classroom.ui.final_exams_subtitle')}</p>
                    </div>
                    <Button
                      onClick={() => setShowOpenExamModal(true)}
                      className="h-12 rounded-2xl bg-primary-brand px-8 gap-3 text-xs font-bold text-white shadow-lg shadow-primary-brand/20 hover:bg-primary-brand-dark uppercase tracking-widest transition-all"
                    >
                      <Wifi size={20} />
                      {t('classroom.ui.final_exams_open')}
                    </Button>
                  </div>

                  {/* Tab bar */}
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      onClick={() => setExamSubTab('ongoing')}
                      className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                        examSubTab === 'ongoing'
                          ? 'text-primary-brand'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="relative flex h-2 w-2">
                        {activeExams.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${activeExams.length > 0 ? 'bg-rose-500' : 'bg-muted-foreground/30'}`} />
                      </span>
                      {t('classroom.ui.final_exams_ongoing')}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${examSubTab === 'ongoing' ? 'bg-primary-brand-light text-primary-brand' : 'bg-muted text-muted-foreground'}`}>
                        {activeExams.length}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setExamSubTab('closed')}
                      className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                        examSubTab === 'closed'
                          ? 'text-primary-brand'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t('classroom.ui.final_exams_closed')}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${examSubTab === 'closed' ? 'bg-primary-brand-light text-primary-brand' : 'bg-muted text-muted-foreground'}`}>
                        {completedExams.length}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-10 flex-1 overflow-y-auto">
                  {loadingExams ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader2 size={32} className="animate-spin text-muted-foreground/40" />
                    </div>
                  ) : !hasAnySession ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-muted/30 rounded-[32px]">
                      <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4 shadow-sm">
                        <BarChart2 size={24} className="opacity-40 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-black text-foreground uppercase tracking-widest">{t('classroom.ui.final_exams_empty')}</p>
                      <p className="text-xs font-medium mt-1 mb-6 text-muted-foreground">{t('classroom.ui.final_exams_empty_hint')}</p>
                      <Button
                        onClick={() => setShowOpenExamModal(true)}
                        className="h-10 rounded-xl bg-primary-brand px-6 gap-2 text-xs font-bold text-white hover:bg-primary-brand-dark uppercase tracking-widest"
                      >
                        <Wifi size={15} />
                        {t('classroom.ui.final_exams_open_first')}
                      </Button>
                    </div>
                  ) : tabExams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[28px]">
                      <BarChart2 size={28} className="opacity-20 text-muted-foreground mb-3" />
                      <p className="text-sm font-bold text-muted-foreground">
                        {examSubTab === 'ongoing' ? t('classroom.ui.final_exams_no_ongoing') : t('classroom.ui.final_exams_no_closed')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {examSubTab === 'ongoing' ? (
                        /* ── ĐANG THI cards ── */
                        tabExams.map(exam => (
                          <div key={exam.uid} className="bg-card rounded-[20px] shadow-md shadow-primary-brand-light">
                            <div className="flex items-center gap-5 p-5">
                              <div className="w-12 h-12 rounded-xl bg-primary-brand text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary-brand-muted">
                                <FileText size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-black text-foreground truncate">{exam.title}</h4>
                                  <span className="shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 uppercase animate-pulse">
                                    {t('classroom.ui.final_exams_live')}
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground">
                                  {t('classroom.ui.final_exams_start', undefined, { time: exam.opened_at ? formatDateTime(exam.opened_at) : '--' })}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <span className="flex items-center gap-1 rounded-full bg-primary-brand-light px-2 py-0.5 text-[10px] font-black text-primary-brand">
                                    <Timer size={9} />
                                    {exam.duration_seconds ? t('classroom.ui.final_exams_minutes', undefined, { count: Math.round(exam.duration_seconds / 60) }) : t('classroom.ui.quiz_no_limit')}
                                  </span>
                                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600">
                                    <Clock size={9} />
                                    {exam.late_threshold_seconds ? t('classroom.ui.final_exams_late', undefined, { minutes: Math.round(exam.late_threshold_seconds / 60) }) : t('classroom.ui.final_exams_no_late')}
                                  </span>
                                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${exam.camera_required ? 'bg-emerald-50 text-emerald-600' : 'bg-muted/50 text-muted-foreground'}`}>
                                    <Camera size={9} />
                                    {exam.camera_required ? t('classroom.ui.final_exams_camera') : t('classroom.ui.final_exams_no_camera')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button onClick={() => router.push(`/space/classrooms/${uid}/exams/${exam.uid}`)} variant="outline" size="sm" className="h-9 rounded-xl px-3 font-bold text-xs gap-1.5">
                                  {t('classroom.ui.exams_view_detail')}
                                </Button>
                                <Button onClick={() => void handleCloseOnline(exam)} size="sm" className="h-9 rounded-xl px-3 font-bold text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white">
                                  <WifiOff size={13} />{t('classroom.ui.exams_close_session')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        /* ── ĐÃ THI cards ── */
                        tabExams.map(exam => (
                          <div key={exam.uid} className="bg-muted/40 rounded-[20px] flex items-center gap-5 p-5 hover:bg-card transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0 group-hover:bg-primary-brand-light group-hover:text-primary-brand transition-colors">
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-black text-foreground truncate group-hover:text-primary-brand transition-colors">{exam.title}</h4>
                              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                                {t('classroom.ui.final_exams_done_at', undefined, { time: exam.opened_at ? formatDateTime(exam.opened_at) : '--' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button onClick={() => router.push(`/space/classrooms/${uid}/exams/${exam.uid}`)} variant="outline" size="sm" className="h-9 rounded-xl px-3 font-bold text-xs gap-1.5">
                                {t('classroom.ui.exams_view_detail')}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          {activeTab === 'quiz' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm">
              <div className="p-10 bg-muted/50 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.quiz_section_title')}</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">{t('classroom.ui.quiz_section_subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/space/quizzes')}
                    className="h-12 rounded-2xl px-6 gap-3 text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    <Wand2 size={18} />
                    {t('classroom.ui.quiz_create_new_btn')}
                  </Button>
                  <Button
                    onClick={() => setShowAssignModal(true)}
                    className="h-12 rounded-2xl bg-primary-brand px-8 gap-3 text-xs font-bold text-white shadow-lg shadow-primary-brand/10 hover:bg-primary-brand-dark uppercase tracking-widest transition-all"
                  >
                    <Plus size={20} />
                    {t('classroom.ui.quiz_assign_new_btn')}
                  </Button>
                </div>
              </div>

              <div className="p-10 flex-1 overflow-y-auto space-y-4">
                {loadingQuizzes ? (
                  <div className="flex h-40 items-center justify-center text-muted-foreground/50">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                ) : assignedQuizzes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 bg-muted/30 rounded-[32px]">
                    <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4 shadow-sm">
                      <Gamepad2 size={24} className="opacity-40" />
                    </div>
                    <p className="text-sm font-bold text-foreground uppercase tracking-widest">{t('classroom.ui.quiz_empty_title')}</p>
                    <p className="text-xs font-medium mt-1">{t('classroom.ui.quiz_empty_hint')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {assignedQuizzes.map(quiz => {
                      const assignment = quiz.assigned_classrooms?.[0];
                      const timeLimitMin = assignment?.time_limit_seconds ? Math.round(assignment.time_limit_seconds / 60) : 0;
                      return (
                        <div key={quiz.uid} className="bg-card p-6 rounded-[24px] shadow-sm flex items-center gap-6 group transition-all hover:shadow-lg">
                          <div className="w-14 h-14 rounded-2xl bg-primary-brand-light text-primary-brand flex items-center justify-center shadow-sm transition-all group-hover:scale-110">
                            <Gamepad2 size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-foreground group-hover:text-primary-brand transition-colors mb-1.5">{quiz.title}</h4>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground">{t('classroom.ui.quiz_questions_count', undefined, { count: quiz.questions_count })}</span>
                              <span className="flex items-center gap-1.5"><Clock size={12} /> {timeLimitMin > 0 ? t('classroom.ui.quiz_time_limit_value', undefined, { count: timeLimitMin }) : t('classroom.ui.quiz_no_limit')}</span>
                              <span className="flex items-center gap-1.5"><RefreshCw size={12} /> {assignment?.max_attempts ? t('classroom.ui.quiz_max_attempts_value', undefined, { count: assignment.max_attempts }) : t('classroom.ui.quiz_unlimited')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 rounded-xl px-4 gap-2 text-xs font-black uppercase tracking-wider text-amber-600 hover:bg-amber-50"
                              onClick={() => setLeaderboardQuiz(quiz)}
                            >
                              <Trophy size={14} />
                              Bảng vàng
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11 rounded-xl text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-50"
                              onClick={() => void handleUnassignQuiz(quiz)}
                              disabled={unassigningUid === quiz.uid}
                            >
                              {unassigningUid === quiz.uid ? <Loader2 size={18} className="animate-spin" /> : <X size={20} />}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {leaderboardQuiz && (
            <QuizLeaderboardModal
              quizUid={leaderboardQuiz.uid}
              classroomId={uid}
              onClose={() => setLeaderboardQuiz(null)}
            />
          )}

          {activeTab === 'blacklist' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="bg-card rounded-[32px] overflow-hidden shadow-sm">
                <div className="p-10 bg-muted/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.blacklist_title')}</h3>
                    <p className="text-sm text-muted-foreground font-medium mt-1">
                      {loadingBlacklist ? t('classroom.ui.blacklist_loading') : (
                        <>
                          {t('classroom.ui.blacklist_count_classroom', undefined, { count: blacklist.filter(e => e.scope === 'classroom').length })}
                          {' · '}
                          {t('classroom.ui.blacklist_count_global', undefined, { count: blacklist.filter(e => e.scope === 'global').length })}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="p-10">
                  {loadingBlacklist ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                      <Loader2 size={32} className="animate-spin" />
                    </div>
                  ) : blacklist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 bg-muted/30 rounded-[32px]">
                      <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4 shadow-sm">
                        <ShieldBan size={24} className="opacity-40" />
                      </div>
                      <p className="text-sm font-bold text-foreground uppercase tracking-widest">{t('classroom.ui.blacklist_empty')}</p>
                      <p className="text-xs font-medium mt-1">{t('classroom.ui.blacklist_empty_hint')}</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-[24px] bg-card shadow-sm">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-4">{t('classroom.ui.blacklist_th_user')}</th>
                            <th className="px-6 py-4">{t('classroom.ui.blacklist_th_reason')}</th>
                            <th className="px-6 py-4">{t('classroom.ui.blacklist_th_blocked_at')}</th>
                            <th className="px-6 py-4 text-right">{t('classroom.ui.blacklist_th_actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blacklist.map(entry => (
                            <tr key={entry.consumer_uid} className="hover:bg-rose-50/20 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${entry.scope === 'global' ? 'bg-rose-100' : 'bg-orange-100'}`}>
                                    <ShieldBan size={16} className={entry.scope === 'global' ? 'text-rose-500' : 'text-orange-500'} />
                                  </div>
                                  <div>
                                    <div className="text-xs font-black text-foreground font-mono">{entry.consumer_uid.slice(0, 8)}…</div>
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                      entry.scope === 'global'
                                        ? 'bg-rose-100 text-rose-600'
                                        : 'bg-orange-100 text-orange-600'
                                    }`}>
                                      {entry.scope === 'global' ? t('classroom.ui.blacklist_scope_global') : t('classroom.ui.blacklist_scope_classroom')}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs">
                                {entry.reason || <span className="italic opacity-50">{t('classroom.ui.blacklist_no_reason')}</span>}
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                                {entry.created_at ? localeFormatDate(entry.created_at) : '—'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={unblockingId === entry.consumer_uid}
                                  className="rounded-xl gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                  onClick={async () => {
                                    setUnblockingId(entry.consumer_uid);
                                    try {
                                      if (entry.scope === 'global') {
                                        await spaceApi.classrooms.removeGlobalBlacklist(entry.consumer_uid);
                                      } else {
                                        await spaceApi.classrooms.removeClassroomBlacklist(uid, entry.consumer_uid);
                                      }
                                      setBlacklist(prev => prev.filter(e => e.consumer_uid !== entry.consumer_uid));
                                      toast.success(t('classroom.ui.blacklist_unblock_success'));
                                    } catch {
                                      toast.error(t('classroom.ui.blacklist_unblock_error'));
                                    } finally {
                                      setUnblockingId(null);
                                    }
                                  }}
                                >
                                  {unblockingId === entry.consumer_uid
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <ShieldOff size={13} />}
                                  {t('classroom.ui.blacklist_unblock')}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="bg-card rounded-[32px] overflow-hidden shadow-sm">
                <div className="p-10 bg-muted/50">
                  <h3 className="text-xl font-bold text-foreground">
                    {t('classroom.ui.tab_ranking', 'Ranking')}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    {t('ranking.subtitle', 'Top students by total XP earned from classroom activities.')}
                  </p>
                </div>
                <div className="p-6">
                  <SpaceClassroomRankingView classroomUid={uid} t={t} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="bg-card rounded-[32px] overflow-hidden shadow-sm">
              <div className="p-10 bg-muted/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.students_title')}</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    {loadingMembers ? t('classroom.ui.students_loading') : t('classroom.ui.students_count_in_class', undefined, { count: members.filter(m => m.role === 'student').length })}
                  </p>
                </div>
              </div>

              <div className="p-10">
                {loadingMembers ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                ) : members.filter(m => m.role === 'student').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 bg-muted/30 rounded-[32px]">
                    <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4 shadow-sm">
                      <Users size={24} className="opacity-40" />
                    </div>
                    <p className="text-sm font-bold text-foreground uppercase tracking-widest">{t('classroom.ui.students_empty')}</p>
                    <p className="text-xs font-medium mt-1">{t('classroom.ui.students_empty_hint')}</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[24px] bg-card shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          <th className="px-6 py-4">{t('classroom.ui.students_th_member')}</th>
                          <th className="px-6 py-4">{t('classroom.ui.students_th_joined_at')}</th>
                          <th className="px-6 py-4 text-right">{t('classroom.ui.students_th_actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.filter(m => m.role === 'student').map(member => (
                          <tr key={member.member_id} className="hover:bg-rose-50/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                {member.member_avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={member.member_avatar} alt={member.member_name} className="w-10 h-10 rounded-2xl object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand font-black text-sm">
                                    {member.member_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-bold text-foreground">{member.member_name}</div>
                                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('classroom.ui.students_role_badge')}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                              {formatDateTime(member.joined_at)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground">
                                    {kickingId === member.member_id
                                      ? <Loader2 size={16} className="animate-spin" />
                                      : <MoreVertical size={16} />}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuItem onClick={() => router.push(`/space/classrooms/${uid}/students/${member.member_id}`)}>
                                    <ClipboardCheck size={14} className="mr-2" />
                                    {t('classroom.ui.students_action_view_detail')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => router.push(`/space/classrooms/${uid}/students/${member.member_id}/analyze`)}>
                                    <BarChart2 size={14} className="mr-2" />
                                    {t('classroom.ui.students_action_view_analysis')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => setMemberToKick(member)}>
                                    <UserX size={14} className="mr-2" />
                                    {t('classroom.ui.students_action_kick')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setMemberToBlock({ member, scope: 'classroom' })}
                                  >
                                    <ShieldBan size={14} className="mr-2" />
                                    {t('classroom.ui.students_action_block_classroom')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setMemberToBlock({ member, scope: 'global' })}
                                  >
                                    <ShieldBan size={14} className="mr-2" />
                                    {t('classroom.ui.students_action_block_global')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAssignModal && (
        <AssignQuizModal
          classroomUid={uid}
          onClose={() => setShowAssignModal(false)}
          onAssigned={(quiz) => {
            setAssignedQuizzes(prev => [quiz, ...prev]);
            setShowAssignModal(false);
            toast.success(t('classroom.labels.quiz_assigned_toast'));
          }}
          localAssigned={new Set(assignedQuizzes.map(q => q.uid))}
        />
      )}

      {showOpenExamModal && (
        <OpenOnlineExamModal
          classroomUid={uid}
          onClose={() => setShowOpenExamModal(false)}
          onOpened={(exam, studentCount) => {
            setExams(prev => [exam, ...prev.filter(item => item.uid !== exam.uid)]);
            setShowOpenExamModal(false);
            goToTab('final_exams');
            toast.success(t('classroom.ui.exams_open_success', undefined, { count: studentCount }));
          }}
        />
      )}

      {editingQuiz && (
        <EditSettingsModal
          quiz={editingQuiz}
          classroomId={uid}
          onClose={() => setEditingQuiz(null)}
          onSaved={(updated) => {
            setAssignedQuizzes(prev => prev.map(q => q.uid === updated.uid ? updated : q));
            setEditingQuiz(null);
            toast.success(t('classroom.labels.settings_updated_toast'));
          }}
        />
      )}

      {/* ── Kick dialog ── */}
      <Dialog open={!!memberToKick} onOpenChange={(open) => { if (!open) setMemberToKick(null); }}>
        <DialogContent showCloseButton={false} className="max-w-sm rounded-[28px] p-0 overflow-hidden shadow-2xl">
          {/* Header strip */}
          <div className="relative bg-gradient-to-br from-rose-500 to-rose-700 px-8 pt-8 pb-12">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative flex flex-col items-center gap-3 text-center">
              <div className="relative">
                {memberToKick?.member_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={memberToKick.member_avatar} alt={memberToKick.member_name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-xl" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-3xl shadow-xl">
                    {memberToKick?.member_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-lg">
                  <UserX size={16} className="text-rose-600" />
                </div>
              </div>
              <div className="text-white mt-1">
                <DialogTitle className="text-lg font-black text-white">{memberToKick?.member_name}</DialogTitle>
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5">{t('classroom.ui.students_role_badge')}</p>
              </div>
            </div>
          </div>
          {/* Body */}
          <div className="px-8 pt-6 pb-8 bg-card">
            <div className="text-center space-y-3 mb-6">
              <DialogDescription className="text-sm font-bold text-foreground">
                {t('classroom.ui.kick_dialog_title', undefined, { name: memberToKick?.member_name ?? '' })}
              </DialogDescription>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('classroom.ui.kick_dialog_desc2')}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold text-sm"
                onClick={() => setMemberToKick(null)} disabled={!!kickingId}>
                {t('classroom.ui.kick_dialog_cancel')}
              </Button>
              <Button className="flex-1 h-11 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white gap-2"
                onClick={() => void handleKickConfirm()} disabled={!!kickingId}>
                {kickingId ? <Loader2 size={15} className="animate-spin" /> : <UserX size={15} />}
                {t('classroom.ui.kick_dialog_confirm')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Block dialog ── */}
      <Dialog open={!!memberToBlock} onOpenChange={(open) => { if (!open) setMemberToBlock(null); }}>
        <DialogContent showCloseButton={false} className="max-w-sm rounded-[28px] p-0 overflow-hidden shadow-2xl">
          {/* Header strip — orange for classroom, rose for global */}
          <div className={`relative px-8 pt-8 pb-12 bg-gradient-to-br ${
            memberToBlock?.scope === 'global'
              ? 'from-rose-600 to-rose-800'
              : 'from-orange-400 to-orange-600'
          }`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative flex flex-col items-center gap-3 text-center">
              <div className="relative">
                {memberToBlock?.member.member_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={memberToBlock.member.member_avatar} alt={memberToBlock.member.member_name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-xl" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-3xl shadow-xl">
                    {memberToBlock?.member.member_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-lg">
                  <ShieldBan size={16} className={memberToBlock?.scope === 'global' ? 'text-rose-600' : 'text-orange-500'} />
                </div>
              </div>
              <div className="text-white mt-1">
                <DialogTitle className="text-lg font-black text-white">{memberToBlock?.member.member_name}</DialogTitle>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-full mt-1">
                  {memberToBlock?.scope === 'global' ? t('classroom.ui.block_global_label') : t('classroom.ui.block_classroom_label')}
                </span>
              </div>
            </div>
          </div>
          {/* Body */}
          <div className="px-8 pt-6 pb-8 bg-card">
            <div className="text-center space-y-3 mb-6">
              {memberToBlock?.scope === 'global' ? (
                <>
                  <DialogDescription className="text-sm font-bold text-foreground">
                    {t('classroom.ui.block_dialog_global_title')}
                  </DialogDescription>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('classroom.ui.block_dialog_global_desc')}
                  </p>
                </>
              ) : (
                <>
                  <DialogDescription className="text-sm font-bold text-foreground">
                    {t('classroom.ui.block_dialog_classroom_title')}
                  </DialogDescription>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('classroom.ui.block_dialog_classroom_desc')}
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold text-sm"
                onClick={() => setMemberToBlock(null)} disabled={!!blockingMemberId}>
                {t('classroom.ui.block_dialog_cancel')}
              </Button>
              <Button
                className={`flex-1 h-11 rounded-xl font-bold text-sm text-white gap-2 ${
                  memberToBlock?.scope === 'global'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
                onClick={() => void handleBlockConfirm()}
                disabled={!!blockingMemberId}
              >
                {blockingMemberId ? <Loader2 size={15} className="animate-spin" /> : <ShieldBan size={15} />}
                {memberToBlock?.scope === 'global' ? t('classroom.ui.block_dialog_confirm_global') : t('classroom.ui.block_dialog_confirm_classroom')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {detailsMember && (
        <StudentDetailsModal
          member={detailsMember}
          classroomUid={uid}
          onClose={() => setDetailsMember(null)}
        />
      )}

      {analyzeMember && (
        <StudentAnalyzeModal
          member={analyzeMember}
          classroomUid={uid}
          onClose={() => setAnalyzeMember(null)}
        />
      )}

      {/* Pending Approval Sheet */}
      {showPendingSheet && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowPendingSheet(false)}
          />
          {/* Panel */}
          <div className="relative z-10 flex h-full w-full max-w-[480px] flex-col bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6">
              <div>
                <h2 className="text-xl font-black text-foreground">{t('classroom.ui.pending_title')}</h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {loadingPending ? t('classroom.ui.students_loading') : t('classroom.ui.pending_count', undefined, { count: pendingMembers.length })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pendingMembers.length >= 1 && (
                  <Button
                    size="sm"
                    className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 gap-1.5"
                    disabled={!!approvingId}
                    onClick={() => void handleApproveAll()}
                  >
                    <Check size={13} />
                    {t('classroom.ui.pending_approve_all')}
                  </Button>
                )}
                <Button
                  onClick={() => setShowPendingSheet(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {loadingPending ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-primary-brand" />
                </div>
              ) : pendingMembers.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Users size={28} className="text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">{t('classroom.ui.pending_empty')}</p>
                  <p className="text-xs font-medium text-muted-foreground">{t('classroom.ui.pending_empty_desc')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingMembers.map(member => (
                    <div
                      key={member.member_id}
                      className="flex items-center gap-4 rounded-2xl bg-muted p-4"
                    >
                      {member.member_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.member_avatar}
                          alt={member.member_name}
                          className="h-11 w-11 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-brand-light text-sm font-black text-primary-brand">
                          {member.member_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{member.member_name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {formatDateTime(member.joined_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 gap-1"
                          disabled={approvingId === member.member_id || rejectingId === member.member_id}
                          onClick={() => void handleApproveMember(member)}
                        >
                          {approvingId === member.member_id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Check size={13} />}
                          {t('classroom.ui.pending_approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold px-3 gap-1"
                          disabled={approvingId === member.member_id || rejectingId === member.member_id}
                          onClick={() => void handleRejectMember(member)}
                        >
                          {rejectingId === member.member_id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <X size={13} />}
                          {t('classroom.ui.pending_reject')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4">
              <Button
                onClick={() => { loadPendingMembers(); }}
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-muted-foreground transition-colors"
              >
                <RefreshCw size={13} />
                {t('classroom.ui.pending_refresh')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modals & Helpers ──────────────────────────────────────────────────────────

function AssignQuizModal({
  classroomUid,
  onClose,
  onAssigned,
  localAssigned,
}: {
  classroomUid: string;
  onClose: () => void;
  onAssigned: (quiz: Quiz) => void;
  localAssigned: Set<string>;
}) {
  const { t } = useTranslation();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<Quiz | null>(null);

  const [timeLimitMin, setTimeLimitMin] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    quizApi.list().then(data => {
      setQuizzes(data);
      setLoading(false);
    }).catch(() => {
      toast.error(t('quiz.assign_modal.load_error'));
      setLoading(false);
    });
  }, [t]);

  const handleConfirmAssign = async () => {
    if (!pendingQuiz) return;
    setAssigning(true);
    try {
      const assignment = await quizApi.assignToClassroom(pendingQuiz.uid, classroomUid, {
        time_limit_seconds: timeLimitMin > 0 ? timeLimitMin * 60 : 0,
        max_attempts: maxAttempts,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_explanation: showExplanation,
        passing_score_pct: 50,
      });
      onAssigned({ ...pendingQuiz, assigned_classrooms: [assignment] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quiz.assign_modal.assign_error'));
    } finally {
      setAssigning(false);
    }
  };

  if (pendingQuiz) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
          <div className="p-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{t('quiz.assign_modal.settings_title')}</h2>
              <p className="text-sm text-muted-foreground font-medium mt-1 truncate max-w-[240px]">{pendingQuiz.title}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPendingQuiz(null)} className="rounded-xl text-muted-foreground">
              <X size={20} />
            </Button>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> {t('quiz.assign_modal.time_label')}</Label>
                <Input type="number" min={0} value={timeLimitMin} onChange={e => setTimeLimitMin(Number(e.target.value))}
                  className="w-full h-12 rounded-2xl bg-muted px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-brand-light transition-all" />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><RotateCcw size={14} /> {t('quiz.assign_modal.max_attempts_label')}</Label>
                <Input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                  className="w-full h-12 rounded-2xl bg-muted px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-brand-light transition-all" />
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: t('quiz.assign_modal.shuffle_questions'), icon: Shuffle, val: shuffleQuestions, set: setShuffleQuestions },
                { label: t('quiz.assign_modal.shuffle_options'), icon: Shuffle, val: shuffleOptions, set: setShuffleOptions },
                { label: t('quiz.assign_modal.show_explanation'), icon: HelpCircle, val: showExplanation, set: setShowExplanation },
              ].map(item => (
                <Label key={item.label} className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted cursor-pointer group transition-all">
                  <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                    <item.icon size={16} className="text-muted-foreground group-hover:text-primary-brand" /> {item.label}
                  </div>
                  <Input type="checkbox" checked={item.val} onChange={e => item.set(e.target.checked)}
                    className="w-5 h-5 rounded-lg text-primary-brand focus:ring-primary-brand transition-all" />
                </Label>
              ))}
            </div>
          </div>

          <div className="p-8 pt-0 flex gap-4">
            <Button variant="outline" onClick={() => setPendingQuiz(null)} className="flex-1 rounded-[20px] font-bold text-xs h-14 uppercase tracking-widest">
              {t('quiz.assign_modal.back')}
            </Button>
            <Button
              onClick={() => void handleConfirmAssign()}
              disabled={assigning}
              className="flex-1 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-[20px] font-bold text-xs h-14 gap-3 shadow-lg shadow-primary-brand/20 uppercase tracking-widest transition-all"
            >
              {assigning ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {t('quiz.assign_modal.assign_to_class')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[80vh] flex flex-col">
        <div className="p-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('quiz.assign_modal.select_quiz_title')}</h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">{t('quiz.assign_modal.select_quiz_hint')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
              <Loader2 size={40} className="animate-spin text-primary-brand" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
              <BookOpen size={48} className="mb-4 opacity-40" />
              <p className="text-sm font-bold text-foreground uppercase tracking-widest">{t('quiz.assign_modal.library_empty')}</p>
              <p className="text-xs font-medium mt-1">{t('quiz.assign_modal.library_empty_hint')}</p>
            </div>
          ) : (
            quizzes.map(quiz => {
              const assigned = localAssigned.has(quiz.uid);
              return (
                <Button
                  key={quiz.uid}
                  type="button"
                  disabled={assigned}
                  onClick={() => { setPendingQuiz(quiz); setTimeLimitMin(0); setMaxAttempts(0); }}
                  className={`w-full text-left rounded-2xl p-5 transition-all flex items-center gap-5 ${
                    assigned
                      ? 'bg-emerald-50 cursor-default opacity-60'
                      : 'bg-card hover:bg-primary-brand-light/30 cursor-pointer group shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${assigned ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground group-hover:bg-primary-brand group-hover:text-white group-hover:shadow-lg'}`}>
                    {assigned ? <Check size={24} /> : <BookOpen size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground group-hover:text-primary-brand transition-colors">{quiz.title}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="bg-muted px-2 py-0.5 rounded">{t('quiz.assign_modal.questions_count', undefined, { count: quiz.questions_count })}</span>
                    </div>
                  </div>
                  {assigned ? (
                    <span className="text-[10px] font-black text-emerald-600 uppercase bg-card px-3 py-1 rounded-full shrink-0 tracking-widest">{t('quiz.assign_modal.assigned_badge')}</span>
                  ) : (
                    <span className="text-[10px] font-black text-primary-brand uppercase bg-primary-brand-light px-3 py-1 rounded-full shrink-0 tracking-widest opacity-0 group-hover:opacity-100 transition-all">{t('quiz.assign_modal.select_badge')}</span>
                  )}
                </Button>
              );
            })
          )}
        </div>

        <div className="p-8">
          <Button onClick={onClose} variant="outline" className="w-full rounded-[20px] font-bold text-xs h-14 uppercase tracking-widest">
            {t('quiz.assign_modal.close_window')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OpenOnlineExamModal({
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
              <div className={`flex items-center justify-between rounded-2xl px-5 py-4 transition-colors${cameraRequired ? 'bg-primary-brand-light' : 'bg-muted/40'}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl${cameraRequired ? 'bg-primary-brand text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Camera size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">{t('classroom.ui.camera_required_label')}</div>
                    <div className="mt-0.5 text-xs font-medium text-muted-foreground">
                      {cameraRequired ? t('classroom.ui.camera_required_short') : t('classroom.ui.camera_optional_label')}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={opening}
                  onClick={() => setCameraRequired(v => !v)}
                  className={`relative ml-4 inline-flex h-7 w-13 shrink-0 items-center rounded-full transition-colors disabled:opacity-60${cameraRequired ? 'bg-primary-brand' : 'bg-slate-300'}`}
                  style={{ width: 52 }}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-card shadow transition-transform${cameraRequired ? 'translate-x-7' : 'translate-x-1'}`} />
                </Button>
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

function EditSettingsModal({
  quiz,
  classroomId,
  onClose,
  onSaved,
}: {
  quiz: Quiz;
  classroomId: string;
  onClose: () => void;
  onSaved: (updated: Quiz) => void;
}) {
  const { t } = useTranslation();
  const existing = quiz.assigned_classrooms?.[0];
  const [timeLimitMin, setTimeLimitMin] = useState(
    existing?.time_limit_seconds ? Math.round(existing.time_limit_seconds / 60) : 0
  );
  const [maxAttempts, setMaxAttempts] = useState(existing?.max_attempts ?? 0);
  const [shuffleQuestions, setShuffleQuestions] = useState(existing?.shuffle_questions ?? false);
  const [shuffleOptions, setShuffleOptions] = useState(existing?.shuffle_options ?? false);
  const [showExplanation, setShowExplanation] = useState(existing?.show_explanation ?? true);
  const [passingScore, setPassingScore] = useState(existing?.passing_score_pct ?? 50);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const assignment = await quizApi.updateAssignment(quiz.uid, classroomId, {
        time_limit_seconds: timeLimitMin > 0 ? timeLimitMin * 60 : 0,
        max_attempts: maxAttempts,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_explanation: showExplanation,
        passing_score_pct: passingScore,
      });
      onSaved({ ...quiz, assigned_classrooms: [assignment] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quiz.settings_modal.save_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('quiz.settings_modal.title')}</h2>
            <p className="text-sm text-muted-foreground font-medium mt-1 truncate max-w-[240px]">{quiz.title}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground">
            <X size={20} />
          </Button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> {t('quiz.settings_modal.time_label')}</Label>
              <Input type="number" min={0} value={timeLimitMin} onChange={e => setTimeLimitMin(Number(e.target.value))}
                className="w-full h-12 rounded-2xl bg-muted px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-brand-light transition-all" />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><RotateCcw size={14} /> {t('quiz.settings_modal.max_attempts_label')}</Label>
              <Input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                className="w-full h-12 rounded-2xl bg-muted px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-brand-light transition-all" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('quiz.settings_modal.passing_score_label', undefined, { score: passingScore })}</Label>
            </div>
            <Input type="range" min={0} max={100} step={5} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
              className="w-full accent-primary-brand" />
          </div>

          <div className="space-y-4">
            {[
              { label: t('quiz.settings_modal.shuffle_questions'), icon: Shuffle, val: shuffleQuestions, set: setShuffleQuestions },
              { label: t('quiz.settings_modal.shuffle_options'), icon: Shuffle, val: shuffleOptions, set: setShuffleOptions },
              { label: t('quiz.settings_modal.show_explanation'), icon: HelpCircle, val: showExplanation, set: setShowExplanation },
            ].map(item => (
              <Label key={item.label} className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted cursor-pointer group transition-all">
                <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                  <item.icon size={16} className="text-muted-foreground group-hover:text-primary-brand" /> {item.label}
                </div>
                <Input type="checkbox" checked={item.val} onChange={e => item.set(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-primary-brand focus:ring-primary-brand transition-all" />
              </Label>
            ))}
          </div>
        </div>

        <div className="p-8 pt-0 flex gap-4">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-[20px] font-bold text-xs h-14 uppercase tracking-widest">
            {t('quiz.settings_modal.cancel')}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-[20px] font-bold text-xs h-14 gap-3 shadow-lg shadow-primary-brand/20 uppercase tracking-widest transition-all"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {t('quiz.settings_modal.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Student Details Modal ─────────────────────────────────────────────────────

function StudentDetailsModal({
  member,
  classroomUid,
  onClose,
}: {
  member: ClassroomMember;
  classroomUid: string;
  onClose: () => void;
}) {
  const { t, formatDateTime } = useTranslation();
  const [records, setRecords] = useState<StudentExamRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    spaceApi.classrooms.studentSubmissions(classroomUid, member.member_id)
      .then(setRecords)
      .catch(() => toast.error(t('classroom.ui.score_load_error')))
      .finally(() => setLoading(false));
  }, [classroomUid, member.member_id, t]);

  const submitted = records.filter(r => r.submission).length;
  const graded = records.filter(r => r.submission?.grade != null).length;
  const avgGrade = graded > 0
    ? records.filter(r => r.submission?.grade != null).reduce((s, r) => s + (r.submission!.grade ?? 0), 0) / graded
    : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {member.member_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.member_avatar} alt={member.member_name} className="w-14 h-14 rounded-2xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand font-black text-xl">
                {member.member_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-black text-foreground">{member.member_name}</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{t('classroom.ui.score_member_label', undefined, { time: formatDateTime(member.joined_at) })}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground shrink-0">
            <X size={20} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 px-8 py-5 shrink-0">
          {[
            { label: t('classroom.ui.score_total_exams'), value: records.length, color: 'text-foreground' },
            { label: t('classroom.ui.score_submitted'), value: submitted, color: 'text-primary-brand' },
            { label: t('classroom.ui.score_avg'), value: avgGrade != null ? avgGrade.toFixed(1) : '--', color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-muted rounded-2xl p-4 text-center">
              <div className={`text-2xl font-black${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <ClipboardCheck size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('classroom.ui.score_no_submission')}</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3">{t('classroom.ui.score_grade_th_exam')}</th>
                  <th className="pb-3">{t('classroom.ui.score_grade_th_status')}</th>
                  <th className="pb-3">{t('classroom.ui.score_grade_th_submitted_at')}</th>
                  <th className="pb-3 text-right">{t('classroom.ui.score_grade_th_grade')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.exam.uid} className="hover:bg-muted/50">
                    <td className="py-3 pr-4 text-sm font-bold text-foreground">{r.exam.title}</td>
                    <td className="py-3 pr-4">
                      {r.submission ? (
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full${getSubmissionStatusClass(r.submission.status)}`}>
                          {getSubmissionStatusLabel(r.submission.status, t)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-muted text-muted-foreground">{t('classroom.ui.score_status_not_submitted')}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs font-bold text-muted-foreground">
                      {r.submission?.submitted_at ? formatDateTime(r.submission.submitted_at) : '--'}
                    </td>
                    <td className="py-3 text-right">
                      {r.submission?.grade != null ? (
                        <span className={`text-sm font-black${r.submission.grade >= 5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {r.submission.grade.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-sm font-black text-muted-foreground/50">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Student Analyze Modal ─────────────────────────────────────────────────────

function StudentAnalyzeModal({
  member,
  classroomUid,
  onClose,
}: {
  member: ClassroomMember;
  classroomUid: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<StudentExamRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    spaceApi.classrooms.studentSubmissions(classroomUid, member.member_id)
      .then(setRecords)
      .catch(() => toast.error(t('classroom.ui.score_load_error')))
      .finally(() => setLoading(false));
  }, [classroomUid, member.member_id, t]);

  const graded = records.filter(r => r.submission?.grade != null);
  const chartData = graded.map((r, i) => ({
    name: r.exam.title.length > 14 ? r.exam.title.slice(0, 14) + '…' : r.exam.title,
    fullName: r.exam.title,
    grade: Number(r.submission!.grade!.toFixed(1)),
    index: i + 1,
  }));

  const trend = chartData.length >= 2
    ? chartData[chartData.length - 1].grade - chartData[0].grade
    : 0;
  const submissionRate = records.length > 0
    ? Math.round((records.filter(r => r.submission).length / records.length) * 100)
    : 0;
  const avgGrade = graded.length > 0
    ? (graded.reduce((s, r) => s + r.submission!.grade!, 0) / graded.length).toFixed(1)
    : '--';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {member.member_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.member_avatar} alt={member.member_name} className="w-12 h-12 rounded-2xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand font-black text-lg">
                {member.member_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-black text-foreground">{t('classroom.ui.analyze_title', undefined, { name: member.member_name })}</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{t('classroom.ui.analyze_subtitle')}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground shrink-0">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted rounded-2xl p-5 text-center">
                  <div className="text-2xl font-black text-foreground">{submissionRate}%</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{t('classroom.ui.analyze_submission_rate')}</div>
                </div>
                <div className="bg-muted rounded-2xl p-5 text-center">
                  <div className="text-2xl font-black text-emerald-600">{avgGrade}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{t('classroom.ui.analyze_avg_score')}</div>
                </div>
                <div className="bg-muted rounded-2xl p-5 text-center flex flex-col items-center gap-1">
                  {trend > 0
                    ? <TrendingUp size={22} className="text-emerald-500" />
                    : trend < 0
                    ? <TrendingDown size={22} className="text-rose-500" />
                    : <Minus size={22} className="text-muted-foreground" />}
                  <div className={`text-2xl font-black${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                    {trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1)}
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('classroom.ui.analyze_trend')}</div>
                </div>
              </div>

              {/* Chart */}
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground bg-muted rounded-2xl">
                  <BarChart2 size={36} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">{t('classroom.ui.analyze_no_grade')}</p>
                </div>
              ) : (
                <div className="bg-muted rounded-2xl p-6">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">{t('classroom.ui.analyze_chart_title')}</p>
                  <GradeLineChart data={chartData} />
                </div>
              )}

              {/* Assessment */}
              <div className="rounded-2xl p-5 space-y-3">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{t('classroom.ui.analyze_auto_assessment')}</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {submissionRate === 0 && t('classroom.ui.analyze_no_submission_msg')}
                  {submissionRate > 0 && submissionRate < 50 && t('classroom.ui.analyze_low_submission_msg')}
                  {submissionRate >= 50 && submissionRate < 100 && trend >= 0 && t('classroom.ui.analyze_stable_msg')}
                  {submissionRate >= 50 && submissionRate < 100 && trend < 0 && t('classroom.ui.analyze_grade_declining_msg')}
                  {submissionRate === 100 && trend > 0 && t('classroom.ui.analyze_excellent_msg')}
                  {submissionRate === 100 && trend === 0 && t('classroom.ui.analyze_consistent_msg')}
                  {submissionRate === 100 && trend < 0 && t('classroom.ui.analyze_submitted_low_grade_msg')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Grade Line Chart (recharts) ───────────────────────────────────────────────

function GradeLineChart({ data }: { data: { name: string; grade: number; index: number }[] }) {
  const { t } = useTranslation();
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{ fontSize: 12, fontWeight: 700 }}
          formatter={value => [typeof value === 'number' ? value.toFixed(1) : String(value ?? '--'), t('classroom.ui.score_avg')]}
        />
        <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: t('classroom.ui.analyze_trend'), fontSize: 10, fill: '#f59e0b' }} />
        <Line
          type="monotone"
          dataKey="grade"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
          activeDot={{ r: 7, fill: '#4f46e5' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function getSubmissionStatusClass(status: string) {
  if (status === 'graded') return 'bg-emerald-50 text-emerald-600';
  if (status === 'submitted') return 'bg-primary-brand-light text-primary-brand';
  if (status === 'late') return 'bg-amber-50 text-amber-600';
  return 'bg-muted text-muted-foreground';
}

function getSubmissionStatusLabel(status: string, t: (key: string) => string) {
  if (status.toLowerCase() === 'graded') return t('classroom.ui.score_status_graded');
  return t('classroom.ui.score_status_submitted');
}

function getExamStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active' || normalized === 'published' || normalized === 'open') {
    return 'bg-emerald-50 text-emerald-600';
  }
  if (normalized === 'draft') {
    return 'bg-amber-50 text-amber-600';
  }
  if (normalized === 'closed' || normalized === 'expired') {
    return 'bg-rose-50 text-rose-600';
  }
  return 'bg-muted text-muted-foreground';
}

function getExamStatusLabel(status: string, t: (key: string) => string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active' || normalized === 'published' || normalized === 'open') return t('classroom.ui.exam_status_open');
  if (normalized === 'draft') return t('classroom.ui.draft_label');
  if (normalized === 'closed' || normalized === 'expired') return t('classroom.ui.exam_status_closed');
  return status;
}

function isExamInKind(exam: Exam, kind: ExamKind) {
  const title = normalizeText(exam.title);
  return EXAM_KIND_KEYWORDS[kind].some(keyword => title.includes(normalizeText(keyword)));
}

function isExamKind(value: string | null): value is ExamKind {
  return value === 'midterm' || value === 'final' || value === 'regular';
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getCanManageExams() {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem('userProfile');
    if (!raw) return true;
    const profile = JSON.parse(raw) as { role?: string; user_type?: string; is_admin?: boolean; is_staff?: boolean };
    const role = (profile.role || profile.user_type || '').toLowerCase();
    return profile.is_admin === true || profile.is_staff === true || role === 'admin' || role === 'teacher' || role === 'space' || !role;
  } catch {
    return true;
  }
}
