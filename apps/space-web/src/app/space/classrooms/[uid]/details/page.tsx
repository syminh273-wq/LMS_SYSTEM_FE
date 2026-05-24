'use client';

import * as React from 'react';
import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { spaceApi, SharingLink, Classroom, Exam } from '@/lib/api';
import type { ClassroomMember, StudentExamRecord } from '@/lib/api/types';
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
  ChevronsLeft,
  ChevronsRight,
  BarChart2,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { quizApi } from '@/lib/api/quiz';
import type { Quiz } from '@/lib/api/types';
import type { MeetingRoom } from '@/lib/api/meeting-room';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
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

interface ClassroomDetailsPageProps {
  params: Promise<{ uid: string }>;
}

const EXAM_KIND_OPTIONS = [
  {
    key: 'midterm',
    label: 'Kiem tra giua ki',
    description: 'Bài kiểm tra giữa kỳ của lớp',
    keywords: ['kiem tra giua ki', 'kiểm tra giữa kì', 'kiểm tra giữa kỳ', 'giua ki', 'giữa kì', 'giữa kỳ'],
  },
  {
    key: 'final',
    label: 'Kiem Tra Cuoi Ki',
    description: 'Bài kiểm tra cuối kỳ của lớp',
    keywords: ['kiem tra cuoi ki', 'kiểm tra cuối kì', 'kiểm tra cuối kỳ', 'cuoi ki', 'cuối kì', 'cuối kỳ'],
  },
  {
    key: 'regular',
    label: 'Kiem Tra Thuong Xuyen',
    description: 'Bài kiểm tra thường xuyên',
    keywords: ['kiem tra thuong xuyen', 'kiểm tra thường xuyên', 'thuong xuyen', 'thường xuyên'],
  },
] as const;

type ExamKind = typeof EXAM_KIND_OPTIONS[number]['key'];

export default function ClassroomDetailsPage({ params }: ClassroomDetailsPageProps) {
  const { uid } = use(params);
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [linkData, setLinkData] = useState<SharingLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'chat' | 'meeting' | 'exams' | 'quiz' | 'students'>('info');
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<ClassroomMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [memberToKick, setMemberToKick] = useState<ClassroomMember | null>(null);
  const [showPendingSheet, setShowPendingSheet] = useState(false);
  const [detailsMember, setDetailsMember] = useState<ClassroomMember | null>(null);
  const [analyzeMember, setAnalyzeMember] = useState<ClassroomMember | null>(null);
  const [gradeTableExam, setGradeTableExam] = useState<Exam | null>(null);
  const [openGroups, setOpenGroups] = useState({ classroom: true, learning: true, students: true });
  const toggleGroup = (key: keyof typeof openGroups) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversationUid, setConversationUid] = useState<string | null>(null);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [meetingAction, setMeetingAction] = useState<'start' | 'end' | null>(null);

  type DocItem = { uid: string; name: string; size: string; date: string; url: string; file_type: string };
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamKind, setSelectedExamKind] = useState<ExamKind>('midterm');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [loadingExams, setLoadingExams] = useState(false);
  const [deletingExamUid, setDeletingExamUid] = useState<string | null>(null);
  const [canManageExams, setCanManageExams] = useState(true);

  // Quiz tab state
  const [assignedQuizzes, setAssignedQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [unassigningUid, setUnassigningUid] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const { localStream, remoteStream, localSource, isConnected: rtcConnected, startMediaShare, stopMediaShare, stopScreenShare } = useRTC(uid);

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
        toast.error("Không thể tải thông tin phòng học");
      } finally {
        setFetching(false);
      }
    };

    fetchDetails();
  }, [uid]);

  useEffect(() => {
    setCanManageExams(getCanManageExams());
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const tab = query.get('tab');
    const kind = query.get('kind');

    if (tab === 'info' || tab === 'docs' || tab === 'chat' || tab === 'meeting' || tab === 'exams' || tab === 'quiz' || tab === 'students') {
      setActiveTab(tab);
    }
    if (isExamKind(kind)) {
      setSelectedExamKind(kind);
    }
  }, []);

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
        toast.error('Không thể tải kênh thảo luận');
      });
  }, [activeTab, uid, conversationUid]);

  const fetchMeetingRooms = React.useCallback(async () => {
    setLoadingMeetings(true);
    try {
      const rooms = await spaceApi.meetingRooms.getByClassroom(uid);
      setMeetingRooms(rooms);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải phòng họp');
    } finally {
      setLoadingMeetings(false);
    }
  }, [uid]);

  useEffect(() => {
    if (activeTab === 'meeting') {
      void fetchMeetingRooms();
    }
  }, [activeTab, fetchMeetingRooms]);

  const fetchAssignedQuizzes = React.useCallback(async () => {
    setLoadingQuizzes(true);
    try {
      const data = await quizApi.list(uid);
      setAssignedQuizzes(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách quiz');
    } finally {
      setLoadingQuizzes(false);
    }
  }, [uid]);

  useEffect(() => {
    if (activeTab === 'quiz') {
      void fetchAssignedQuizzes();
    }
  }, [activeTab, fetchAssignedQuizzes]);

  useEffect(() => {
    if (activeTab !== 'students') return;
    setLoadingMembers(true);
    spaceApi.classrooms.members(uid)
      .then(setMembers)
      .catch(() => toast.error('Không thể tải danh sách sinh viên'))
      .finally(() => setLoadingMembers(false));
  }, [activeTab, uid]);

  const loadPendingMembers = () => {
    setLoadingPending(true);
    spaceApi.classrooms.pendingMembers(uid)
      .then(setPendingMembers)
      .catch(() => toast.error('Không thể tải danh sách chờ duyệt'))
      .finally(() => setLoadingPending(false));
  };

  useEffect(() => {
    loadPendingMembers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const handleApproveMember = async (member: ClassroomMember) => {
    setApprovingId(member.member_id);
    try {
      const approved = await spaceApi.classrooms.approveMember(uid, member.member_id);
      setPendingMembers(prev => prev.filter(m => m.member_id !== member.member_id));
      setMembers(prev => [...prev, approved]);
      toast.success(`Đã duyệt "${member.member_name}" vào lớp`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể duyệt thành viên');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectMember = async (member: ClassroomMember) => {
    setRejectingId(member.member_id);
    try {
      await spaceApi.classrooms.rejectMember(uid, member.member_id);
      setPendingMembers(prev => prev.filter(m => m.member_id !== member.member_id));
      toast.success(`Đã từ chối "${member.member_name}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể từ chối thành viên');
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
      toast.success(`Đã kick "${memberToKick.member_name}" ra khỏi lớp`);
      setMemberToKick(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể kick sinh viên');
    } finally {
      setKickingId(null);
    }
  };

  const handleUnassignQuiz = async (quiz: Quiz) => {
    if (!window.confirm(`Bỏ giao quiz "${quiz.title}" khỏi lớp này?`)) return;
    setUnassigningUid(quiz.uid);
    try {
      await quizApi.unassignFromClassroom(quiz.uid, uid);
      setAssignedQuizzes(prev => prev.filter(q => q.uid !== quiz.uid));
      toast.success('Đã bỏ giao quiz');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể bỏ giao quiz');
    } finally {
      setUnassigningUid(null);
    }
  };

  const fetchExams = React.useCallback(async () => {
    setLoadingExams(true);
    try {
      const data = await spaceApi.exams.listByClassroom(uid);
      setExams(getCanManageExams() ? data : data.filter(exam => exam.status === 'published'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách bài kiểm tra');
    } finally {
      setLoadingExams(false);
    }
  }, [uid]);

  useEffect(() => {
    if (activeTab === 'exams') {
      void fetchExams();
    }
  }, [activeTab, fetchExams]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const callUploadAPI = async (
    file: File,
    meta: Record<string, string>,
    ownerOverride?: { owner_id: string; owner_type: string }
  ) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(meta));
    if (ownerOverride) {
      formData.append('owner_id', ownerOverride.owner_id);
      formData.append('owner_type', ownerOverride.owner_type);
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${apiBase}/api/v1/resource/upload/`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error((err.message as string) || (err.detail as string) || 'Upload thất bại');
    }
    return res.json();
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingDoc(true);
    try {
      const data = await callUploadAPI(file, { context: 'classroom_docs', classroom_uid: uid });
      setDocuments(prev => [{
        uid: data.uid,
        name: data.name,
        size: formatFileSize(data.size ?? file.size),
        date: new Date().toLocaleDateString('vi-VN'),
        url: data.url,
        file_type: data.file_type,
      }, ...prev]);
      toast.success('Đã tải lên tài liệu thành công');
    } catch (err: unknown) {
      toast.error(`Lỗi: ${err instanceof Error ? err.message : 'Không thể tải lên'}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteExam = async (exam: Exam) => {
    if (!canManageExams || deletingExamUid) return;
    const confirmed = window.confirm(`Xóa bài kiểm tra "${exam.title}"?`);
    if (!confirmed) return;

    setDeletingExamUid(exam.uid);
    try {
      await spaceApi.exams.deleteExam(exam.uid);
      setExams(prev => prev.filter(item => item.uid !== exam.uid));
      setSelectedExam(prev => prev?.uid === exam.uid ? null : prev);
      toast.success('Đã xóa bài kiểm tra');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa bài kiểm tra');
    } finally {
      setDeletingExamUid(null);
    }
  };

  const activeMeeting = meetingRooms.find(room => room.status === 'active') || null;
  const latestMeeting = meetingRooms[0] || null;

  const handleStartMeeting = async (source: 'screen' | 'camera') => {
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
      toast.success(source === 'screen' ? 'Đã mở phòng họp và chia sẻ màn hình' : 'Đã mở phòng họp và bật camera');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể mở phòng họp');
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
      toast.success('Đã kết thúc phòng họp');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể kết thúc phòng họp');
    } finally {
      setMeetingAction(null);
    }
  };

  const copyToClipboard = () => {
    if (!linkData) return;
    const url = `${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Đã copy link tham gia");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!linkData || !classroom) return;

    try {
      toast.info('Đang tạo ảnh QR...');
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

          toast.success('Đã tải mã QR xuống');
        }
        URL.revokeObjectURL(blobUrl);
      };

      img.onerror = () => {
        toast.error('Có lỗi xảy ra khi tạo ảnh QR');
        URL.revokeObjectURL(blobUrl);
      };

      img.src = blobUrl;
    } catch {
      toast.error('Không thể tải mã QR');
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="text-sm font-medium">Đang tải dữ liệu phòng học...</p>
      </div>
    );
  }

  if (!classroom) return null;

  const visibleExams = canManageExams ? exams : exams.filter(exam => exam.status === 'published');
  const selectedKind = EXAM_KIND_OPTIONS.find(kind => kind.key === selectedExamKind) || EXAM_KIND_OPTIONS[0];
  const filteredExams = visibleExams.filter(exam => isExamInKind(exam, selectedExamKind));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/space/classrooms')}
            className="w-12 h-12 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all hover:scale-110 active:scale-95"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-black bg-indigo-600 text-white px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
                ID: {classroom.pid}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                PHÒNG HỌC
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{classroom.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/space/classrooms/edit/${classroom.uid}`)}
            className="h-12 rounded-xl px-6 gap-2.5 font-bold text-xs border-slate-200 hover:bg-white text-slate-600 uppercase tracking-widest bg-slate-50/50"
          >
            <Settings size={18} />
            THIẾT LẬP
          </Button>
          <Button
            onClick={() => { setShowPendingSheet(true); loadPendingMembers(); }}
            className="relative h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-6 gap-2.5 font-bold text-xs shadow-lg shadow-amber-500/20 uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Users size={18} />
            PHÊ DUYỆT
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
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden py-1">
              {/* Expand button */}
              <button
                onClick={() => setSidebarCollapsed(false)}
                title="Mở rộng sidebar"
                className="w-full flex justify-center py-3 hover:bg-slate-50 transition-colors"
              >
                <ChevronsRight size={16} className="text-slate-400" />
              </button>
              <div className="mx-3 border-t border-slate-100 mb-1" />
              {/* All tabs as icons */}
              {([
                { id: 'info',     label: 'Thông tin chung',    icon: Info },
                { id: 'docs',     label: 'Tài liệu học tập',   icon: FileText },
                { id: 'chat',     label: 'Thảo luận lớp học',  icon: MessageSquare },
                { id: 'meeting',  label: 'Phòng họp',          icon: Video },
                { id: 'exams',    label: 'Bài kiểm tra',       icon: ClipboardList },
                { id: 'quiz',     label: 'Quiz Game',           icon: Gamepad2 },
                { id: 'students', label: 'Danh sách sinh viên', icon: Users },
              ] as const).map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    title={label}
                    onClick={() => setActiveTab(id as typeof activeTab)}
                    className={`w-full flex justify-center py-3 transition-colors relative ${
                      isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 w-1 h-5 bg-indigo-600 rounded-r-full top-1/2 -translate-y-1/2" />}
                    <Icon size={18} />
                    {id === 'meeting' && activeMeeting && (
                      <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* ── Expanded: full labels ── */
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Collapse button */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">MENU</span>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  title="Thu nhỏ sidebar"
                  className="rounded-lg p-1 hover:bg-slate-100 transition-colors"
                >
                  <ChevronsLeft size={15} className="text-slate-400" />
                </button>
              </div>

              {/* Nhóm 1: Thông tin lớp */}
              <button
                onClick={() => toggleGroup('classroom')}
                className="w-full flex items-center justify-between px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
              >
                Thông tin lớp
                <ChevronDown size={14} className={`transition-transform duration-200 ${openGroups.classroom ? '' : '-rotate-90'}`} />
              </button>
              {openGroups.classroom && (
                <div className="pb-1 px-1">
                  {[
                    { id: 'info',    label: 'Thông tin chung',   icon: Info },
                    { id: 'docs',    label: 'Tài liệu học tập',  icon: FileText },
                    { id: 'chat',    label: 'Thảo luận lớp học', icon: MessageSquare },
                    { id: 'meeting', label: 'Phòng họp',         icon: Video },
                  ].map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id as typeof activeTab)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                          isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {isActive && <div className="absolute left-0 w-1.5 h-5 bg-indigo-600 rounded-r-full" />}
                        <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                        {label}
                        {id === 'meeting' && activeMeeting && (
                          <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mx-4 border-t border-slate-100" />

              {/* Nhóm 2: Học tập & Đánh giá */}
              <button
                onClick={() => toggleGroup('learning')}
                className="w-full flex items-center justify-between px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
              >
                Học tập & Đánh giá
                <ChevronDown size={14} className={`transition-transform duration-200 ${openGroups.learning ? '' : '-rotate-90'}`} />
              </button>
              {openGroups.learning && (
                <div className="pb-1 px-1">
                  {[
                    { id: 'exams', label: 'Bài kiểm tra', icon: ClipboardList },
                    { id: 'quiz',  label: 'Quiz Game',    icon: Gamepad2 },
                  ].map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id as typeof activeTab)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                          isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {isActive && <div className="absolute left-0 w-1.5 h-5 bg-indigo-600 rounded-r-full" />}
                        <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mx-4 border-t border-slate-100" />

              {/* Nhóm 3: Quản lý sinh viên */}
              <button
                onClick={() => toggleGroup('students')}
                className="w-full flex items-center justify-between px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
              >
                Quản lý sinh viên
                <ChevronDown size={14} className={`transition-transform duration-200 ${openGroups.students ? '' : '-rotate-90'}`} />
              </button>
              {openGroups.students && (
                <div className="pb-2 px-1">
                  {(() => {
                    const isActive = activeTab === 'students';
                    return (
                      <button
                        onClick={() => setActiveTab('students')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                          isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {isActive && <div className="absolute left-0 w-1.5 h-5 bg-indigo-600 rounded-r-full" />}
                        <Users size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                        Danh sách sinh viên
                        {members.filter(m => m.role === 'student').length > 0 && (
                          <span className="ml-auto text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            {members.filter(m => m.role === 'student').length}
                          </span>
                        )}
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {!sidebarCollapsed && <>
            <Card className="border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-white p-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">SĨ SỐ LỚP</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-slate-900 tracking-tighter">0</span>
                <span className="text-slate-400 font-bold text-lg">/ {classroom.max_students} học sinh</span>
              </div>
              <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                <div className="h-full bg-indigo-600 rounded-full w-0 shadow-[0_0_8px_rgba(79,70,229,0.3)] transition-all duration-1000" />
              </div>
            </Card>

            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-8 relative group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <QrCode size={140} />
              </div>
              <div className="relative">
                <h3 className="text-[10px] font-bold text-indigo-200 uppercase tracking-[0.3em] mb-4">MÃ THAM GIA</h3>
                <div className="text-4xl font-bold tracking-[0.2em] mb-8">{linkData?.code || '------'}</div>
                <Button
                  variant="ghost"
                  onClick={handleDownloadQr}
                  className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl h-12 font-bold text-xs tracking-widest gap-3 border border-white/10 transition-all uppercase"
                >
                  <QrCode size={18} /> TẢI MÃ QR
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
              <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm group">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Info size={22} />
                  </div>
                  Mô tả phòng học
                </h3>
                <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 text-slate-500 font-medium leading-relaxed italic text-lg relative">
                  <span className="absolute -top-4 -left-2 text-6xl text-slate-100 font-serif opacity-50">"</span>
                  {classroom.description}
                  <span className="absolute -bottom-10 -right-2 text-6xl text-slate-100 font-serif opacity-50">"</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* QR Code Card */}
                <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm flex flex-col items-center">
                  <h3 className="text-lg font-bold text-slate-900 mb-8 self-start flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <QrCode size={22} />
                    </div>
                    Mã QR tham gia
                  </h3>
                  <div className="p-10 bg-white rounded-[40px] border-2 border-dashed border-slate-100 mb-10 shadow-inner group transition-all hover:border-indigo-200">
                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                      {linkData && (
                        <QRCodeSVG
                          id="classroom-qr"
                          value={`${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`}
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={handleDownloadQr} 
                    className="w-full h-14 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-[20px] font-bold text-xs gap-3 transition-all uppercase tracking-widest"
                  >
                    <Download size={20} /> TẢI ẢNH QR XUỐNG
                  </Button>
                </div>

                {/* Timeline Card */}
                <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <RotateCcw size={22} />
                    </div>
                    Lịch sử hoạt động
                  </h3>
                  <div className="space-y-12 pl-4">
                    <div className="flex gap-6 items-start relative before:absolute before:left-[11px] before:top-8 before:bottom-[-48px] before:w-1 before:bg-slate-50">
                      <div className="w-6 h-6 rounded-full bg-white border-[6px] border-indigo-600 shadow-lg shadow-indigo-200 z-10" />
                      <div className="space-y-1">
                        <div className="text-base font-bold text-slate-800">Phòng học được khởi tạo</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(classroom.created_at).toLocaleString('vi-VN')}</div>
                      </div>
                    </div>
                    <div className="flex gap-6 items-start relative before:absolute before:left-[11px] before:top-8 before:bottom-[-48px] before:w-1 before:bg-slate-50">
                      <div className="w-6 h-6 rounded-full bg-white border-[6px] border-indigo-600 shadow-lg shadow-indigo-200 z-10 animate-pulse" />
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className="text-base font-bold text-slate-800">Đang hoạt động</div>
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-100">Hiện tại</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium leading-relaxed">
                          Lớp học hiện sẵn sàng cho học sinh tham gia
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-6 items-start opacity-40">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border-[6px] border-white shadow-sm z-10" />
                      <div>
                        <div className="text-base font-bold text-slate-800">Kiểm tra giữa kỳ dự kiến</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chưa lên lịch chính thức</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300 bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
              <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Tài liệu học tập</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Quản lý và chia sẻ học liệu của lớp học</p>
                </div>
                <input ref={docInputRef} type="file" className="hidden" onChange={handleDocUpload}
                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" />
                <Button
                  onClick={() => docInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl h-12 px-8 gap-3 shadow-lg shadow-indigo-100 disabled:opacity-70 uppercase tracking-widest transition-all hover:scale-105"
                >
                  {uploadingDoc ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={20} />}
                  {uploadingDoc ? 'ĐANG TẢI LÊN...' : 'TẢI LÊN TỆP MỚI'}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-4">
                {documents.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                      <File size={32} className="opacity-40" />
                    </div>
                    <p className="text-base font-bold text-slate-900">Chưa có tài liệu nào</p>
                    <p className="text-sm font-medium mt-1">Nhấn "Tải lên tệp mới" để thêm học liệu</p>
                  </div>
                )}
                {documents.map(doc => (
                  <div key={doc.uid} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-indigo-200 transition-all hover:shadow-lg">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      {doc.file_type.match(/^(jpg|jpeg|png|gif|webp|svg)$/) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={doc.url} alt={doc.name} className="w-14 h-14 rounded-xl object-cover" />
                      ) : (
                        <File size={28} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{doc.name}</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-3">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">{doc.file_type.toUpperCase()}</span>
                        <span>{doc.size}</span>
                        <span>Đã tải lên {doc.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-11 w-11 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100">
                          <Download size={20} />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-100"
                        onClick={() => setDocuments(prev => prev.filter(d => d.uid !== doc.uid))}
                      >
                        <X size={20} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm h-full flex flex-col">
              {conversationUid ? (
                <ClassroomChatPanel
                  conversationUid={conversationUid}
                  classroomUid={uid}
                  active={activeTab === 'chat'}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="animate-spin mb-4 text-indigo-500" size={40} />
                  <p className="text-sm font-bold uppercase tracking-widest">Đang tải kênh thảo luận...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'meeting' && (
            <div className="flex h-full flex-col animate-in fade-in duration-300 bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
              <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Phòng họp trực tuyến</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Mở buổi học trực tuyến và chia sẻ màn hình cho sinh viên</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                    activeMeeting
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}>
                    {activeMeeting ? <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> : <WifiOff size={14} />}
                    {activeMeeting ? 'Đang hoạt động' : 'Ngoại tuyến'}
                  </span>
                  
                  {activeMeeting ? (
                    <div className="flex items-center gap-3">
                      {!localStream ? (
                        <>
                          <Button
                            onClick={() => void handleStartMeeting('screen')}
                            disabled={meetingAction !== null}
                            className="h-12 rounded-2xl bg-indigo-600 px-6 gap-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 uppercase tracking-widest transition-all"
                          >
                            {meetingAction === 'start' ? <Loader2 size={18} className="animate-spin" /> : <MonitorUp size={18} />}
                            Chia sẻ màn hình
                          </Button>
                          <Button
                            onClick={() => void handleStartMeeting('camera')}
                            disabled={meetingAction !== null}
                            variant="outline"
                            className="h-12 rounded-2xl px-6 gap-2.5 text-xs font-bold border-slate-200 hover:bg-slate-50 uppercase tracking-widest"
                          >
                            {meetingAction === 'start' ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                            Bật camera
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={stopMediaShare}
                          disabled={meetingAction !== null}
                          variant="outline"
                          className="h-12 rounded-2xl px-6 gap-2.5 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 uppercase tracking-widest"
                        >
                          <WifiOff size={18} />
                          Dừng phát
                        </Button>
                      )}
                      <Button
                        onClick={() => void handleEndMeeting()}
                        disabled={meetingAction !== null}
                        variant="destructive"
                        className="h-12 rounded-2xl px-6 gap-2.5 text-xs font-bold shadow-lg shadow-rose-100 uppercase tracking-widest"
                      >
                        {meetingAction === 'end' ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                        Kết thúc
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => void handleStartMeeting('screen')}
                        disabled={meetingAction !== null}
                        className="h-12 rounded-2xl bg-indigo-600 px-6 gap-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 uppercase tracking-widest"
                      >
                        {meetingAction === 'start' ? <Loader2 size={18} className="animate-spin" /> : <MonitorUp size={18} />}
                        Mở phòng họp
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                {loadingMeetings ? (
                  <div className="flex h-60 items-center justify-center text-slate-300">
                    <Loader2 size={48} className="animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm group hover:border-indigo-100 transition-all">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Trạng thái</div>
                        <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          {activeMeeting ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              Đang dạy trực tuyến
                            </>
                          ) : 'Sẵn sàng mở lớp'}
                        </div>
                        <div className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                          {activeMeeting ? `Bắt đầu lúc ${formatDateTime(activeMeeting.started_at || activeMeeting.created_at)}` : 'Sinh viên sẽ thấy thông báo khi bạn mở phòng.'}
                        </div>
                      </div>
                      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm group hover:border-indigo-100 transition-all">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Kết nối thời gian thực</div>
                        <div className="flex items-center gap-3 text-lg font-bold text-slate-900">
                          {rtcConnected ? <Wifi size={20} className="text-emerald-500" /> : <WifiOff size={20} className="text-slate-300" />}
                          {rtcConnected ? 'Đã kết nối' : 'Đang chờ...'}
                        </div>
                        <div className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">Kênh tín hiệu bảo mật dùng mã lớp độc nhất.</div>
                      </div>
                      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm group hover:border-indigo-100 transition-all">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Phòng gần nhất</div>
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {latestMeeting?.title || 'Chưa có lịch sử'}
                        </div>
                        <div className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                          {latestMeeting ? `Hoạt động: ${formatDateTime(latestMeeting.created_at)}` : 'Mở phòng để tạo lịch sử dạy học.'}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[40px] border border-slate-100 bg-slate-950 p-6 shadow-2xl shadow-indigo-900/10">
                      {localStream ? (
                        <div className="rounded-[24px] overflow-hidden border border-slate-800">
                          <ScreenShareViewer stream={localStream} label={localSource === 'camera' ? 'Camera đang phát' : 'Màn hình đang chia sẻ'} />
                        </div>
                      ) : remoteStream ? (
                        <div className="rounded-[24px] overflow-hidden border border-slate-800">
                          <ScreenShareViewer stream={remoteStream} label="Nguồn phát từ người tham gia" />
                        </div>
                      ) : (
                        <div className="flex aspect-video flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-800 text-center text-slate-600 bg-slate-900/50">
                          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                            <Video size={32} className="opacity-40" />
                          </div>
                          <p className="text-base font-bold text-slate-400 uppercase tracking-[0.2em]">Tín hiệu trống</p>
                          <p className="mt-2 text-sm font-medium text-slate-500">Nhấn "Mở phòng họp" để bắt đầu phiên làm việc trực tuyến.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300 bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
              <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Bài kiểm tra</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Quản lý các đợt kiểm tra đánh giá của lớp</p>
                </div>
                {canManageExams && (
                  <Button
                    onClick={() => router.push(`/space/classrooms/${uid}/exams/create`)}
                    className="h-12 rounded-2xl bg-indigo-600 px-8 gap-3 text-xs font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 uppercase tracking-widest transition-all"
                  >
                    <Plus size={20} />
                    Tạo bài kiểm tra
                  </Button>
                )}
              </div>

              <div className="p-10 flex-1 overflow-y-auto space-y-8">
                <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-fit">
                  {EXAM_KIND_OPTIONS.map(kind => (
                    <button
                      key={kind.key}
                      onClick={() => setSelectedExamKind(kind.key)}
                      className={`px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                        selectedExamKind === kind.key 
                          ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {kind.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {loadingExams ? (
                    <div className="flex h-40 items-center justify-center text-slate-300">
                      <Loader2 size={32} className="animate-spin" />
                    </div>
                  ) : filteredExams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300 bg-slate-50/30 rounded-[32px] border-2 border-dashed border-slate-100">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                        <ClipboardList size={24} className="opacity-40" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Không tìm thấy bài kiểm tra</p>
                      <p className="text-xs font-medium mt-1">Chưa có dữ liệu cho mục {selectedKind.label.toLowerCase()}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredExams.map(exam => (
                        <div key={exam.uid} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-indigo-200 transition-all hover:shadow-lg">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all group-hover:scale-110 ${
                            exam.status === 'published' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                          }`}>
                            <FileText size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{exam.title}</h4>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${
                                exam.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                              }`}>
                                {exam.status === 'published' ? 'Đã đăng' : 'Bản nháp'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <span className="flex items-center gap-1.5"><Clock size={12} /> {exam.duration_minutes} phút</span>
                              <span className="flex items-center gap-1.5"><Users size={12} /> {exam.total_questions || 0} câu hỏi</span>
                              <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(exam.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => setGradeTableExam(exam)}
                              variant="outline"
                              className="h-10 rounded-xl px-4 font-bold text-xs gap-2 uppercase tracking-widest"
                            >
                              <ClipboardCheck size={14} />
                              Bảng điểm
                            </Button>
                            <Button
                              onClick={() => router.push(`/space/classrooms/${uid}/exams/${exam.uid}`)}
                              className="h-10 rounded-xl px-4 font-bold text-xs bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 transition-all border border-slate-100 hover:border-indigo-600 uppercase tracking-widest"
                            >
                              Chi tiết
                            </Button>
                            {canManageExams && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-slate-900 transition-colors">
                                    <MoreVertical size={20} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-100">
                                  <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-slate-600 hover:text-indigo-600 cursor-pointer" onClick={() => router.push(`/space/classrooms/${uid}/exams/edit/${exam.uid}`)}>
                                    <Pencil size={16} className="mr-3 text-slate-400" />
                                    Chỉnh sửa
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-2 bg-slate-50" />
                                  <DropdownMenuItem 
                                    className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-rose-600 cursor-pointer"
                                    onClick={() => void handleDeleteExam(exam)}
                                  >
                                    <Trash2 size={16} className="mr-3" />
                                    Xóa bài
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

          {activeTab === 'quiz' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300 bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
              <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Quiz Game</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Giao quiz cho sinh viên trong lớp chơi trực tuyến</p>
                </div>
                <Button
                  onClick={() => setShowAssignModal(true)}
                  className="h-12 rounded-2xl bg-violet-600 px-8 gap-3 text-xs font-bold text-white shadow-lg shadow-violet-100 hover:bg-violet-700 uppercase tracking-widest transition-all"
                >
                  <Plus size={20} />
                  Giao Quiz mới
                </Button>
              </div>

              <div className="p-10 flex-1 overflow-y-auto space-y-4">
                {loadingQuizzes ? (
                  <div className="flex h-40 items-center justify-center text-slate-300">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                ) : assignedQuizzes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300 bg-slate-50/30 rounded-[32px] border-2 border-dashed border-slate-100">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                      <Gamepad2 size={24} className="opacity-40" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Chưa có quiz nào được giao</p>
                    <p className="text-xs font-medium mt-1">Nhấn "Giao Quiz mới" để thêm hoạt động cho lớp</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {assignedQuizzes.map(quiz => {
                      const assignment = quiz.assigned_classrooms?.[0];
                      const timeLimitMin = assignment?.time_limit_seconds ? Math.round(assignment.time_limit_seconds / 60) : 0;
                      return (
                        <div key={quiz.uid} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-violet-200 transition-all hover:shadow-lg">
                          <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-sm transition-all group-hover:scale-110">
                            <Gamepad2 size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-violet-600 transition-colors mb-1.5">{quiz.title}</h4>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">{quiz.questions_count} câu hỏi</span>
                              <span className="flex items-center gap-1.5"><Clock size={12} /> {timeLimitMin > 0 ? `${timeLimitMin} phút` : 'Không giới hạn'}</span>
                              <span className="flex items-center gap-1.5"><RefreshCw size={12} /> {assignment?.max_attempts ? `${assignment.max_attempts} lần thử` : 'Vô hạn'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-11 w-11 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100"
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

          {activeTab === 'students' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
              <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Danh sách sinh viên</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {loadingMembers ? 'Đang tải...' : `${members.filter(m => m.role === 'student').length} sinh viên trong lớp`}
                  </p>
                </div>
              </div>

              <div className="p-10">
                {loadingMembers ? (
                  <div className="flex items-center justify-center h-40 text-slate-400">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                ) : members.filter(m => m.role === 'student').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300 bg-slate-50/30 rounded-[32px] border-2 border-dashed border-slate-100">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                      <Users size={24} className="opacity-40" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Chưa có sinh viên nào</p>
                    <p className="text-xs font-medium mt-1">Chia sẻ link tham gia để sinh viên vào lớp</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <th className="px-6 py-4">Sinh viên</th>
                          <th className="px-6 py-4">Ngày tham gia</th>
                          <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.filter(m => m.role === 'student').map(member => (
                          <tr key={member.member_id} className="border-b border-slate-50 last:border-0 hover:bg-rose-50/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                {member.member_avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={member.member_avatar} alt={member.member_name} className="w-10 h-10 rounded-2xl object-cover border border-slate-100" />
                                ) : (
                                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-sm">
                                    {member.member_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-bold text-slate-800">{member.member_name}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sinh viên</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-500">
                              {formatDateTime(member.joined_at)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-700">
                                    {kickingId === member.member_id
                                      ? <Loader2 size={16} className="animate-spin" />
                                      : <MoreVertical size={16} />}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onClick={() => router.push(`/space/classrooms/${uid}/students/${member.member_id}`)}>
                                    <ClipboardCheck size={14} className="mr-2" />
                                    Chi tiết
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => router.push(`/space/classrooms/${uid}/students/${member.member_id}/analyze`)}>
                                    <BarChart2 size={14} className="mr-2" />
                                    Phân tích
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem variant="destructive" onClick={() => setMemberToKick(member)}>
                                    <UserX size={14} className="mr-2" />
                                    Kick
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
            toast.success('Đã giao quiz thành công');
          }}
          localAssigned={new Set(assignedQuizzes.map(q => q.uid))}
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
            toast.success('Đã cập nhật cài đặt');
          }}
        />
      )}

      <Dialog open={!!memberToKick} onOpenChange={(open) => { if (!open) setMemberToKick(null); }}>
        <DialogContent showCloseButton={false} className="max-w-sm rounded-[24px] p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-4">
              {memberToKick?.member_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={memberToKick.member_avatar}
                  alt={memberToKick.member_name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 font-black text-xl">
                  {memberToKick?.member_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <DialogTitle className="text-base font-black text-slate-900">
                  {memberToKick?.member_name}
                </DialogTitle>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Sinh viên</p>
              </div>
            </div>
            <DialogDescription className="text-sm text-slate-600 font-medium leading-relaxed">
              Bạn có chắc muốn <span className="font-black text-rose-600">kick</span> sinh viên này ra khỏi lớp?
              Sinh viên vẫn có thể tham gia lại qua link mời.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-8 pb-8 pt-2 border-0 bg-transparent flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl font-bold text-xs"
              onClick={() => setMemberToKick(null)}
              disabled={!!kickingId}
            >
              Huỷ
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100 gap-2"
              onClick={() => void handleKickConfirm()}
              disabled={!!kickingId}
            >
              {kickingId ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
              Kick ngay
            </Button>
          </DialogFooter>
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

      {gradeTableExam && (
        <ExamGradeTableModal
          exam={gradeTableExam}
          members={members.filter(m => m.role === 'student')}
          onClose={() => setGradeTableExam(null)}
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
          <div className="relative z-10 flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Phê duyệt thành viên</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {loadingPending ? 'Đang tải...' : `${pendingMembers.length} yêu cầu đang chờ`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pendingMembers.length > 1 && (
                  <Button
                    size="sm"
                    className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 gap-1.5"
                    disabled={!!approvingId}
                    onClick={() => void handleApproveAll()}
                  >
                    <Check size={13} />
                    Duyệt tất cả
                  </Button>
                )}
                <button
                  onClick={() => setShowPendingSheet(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {loadingPending ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-indigo-400" />
                </div>
              ) : pendingMembers.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Users size={28} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">Không có yêu cầu nào</p>
                  <p className="text-xs font-medium text-slate-400">Tất cả yêu cầu đã được xử lý</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingMembers.map(member => (
                    <div
                      key={member.member_id}
                      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      {member.member_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.member_avatar}
                          alt={member.member_name}
                          className="h-11 w-11 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-600">
                          {member.member_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{member.member_name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold px-3 gap-1"
                          disabled={approvingId === member.member_id || rejectingId === member.member_id}
                          onClick={() => void handleRejectMember(member)}
                        >
                          {rejectingId === member.member_id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <X size={13} />}
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-8 py-4">
              <button
                onClick={() => { loadPendingMembers(); }}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                <RefreshCw size={13} />
                Làm mới danh sách
              </button>
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
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingQuiz, setPendingQuiz] = useState<Quiz | null>(null);

  const [timeLimitMin, setTimeLimitMin] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    quizApi.listAll().then(data => {
      setQuizzes(data);
      setLoading(false);
    }).catch(() => {
      toast.error('Không thể tải thư viện quiz');
      setLoading(false);
    });
  }, []);

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
    } catch (err: any) {
      toast.error(err.message || 'Không thể giao quiz');
    } finally {
      setAssigning(false);
    }
  };

  if (pendingQuiz) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Cài đặt giao Quiz</h2>
              <p className="text-sm text-slate-500 font-medium mt-1 truncate max-w-[240px]">{pendingQuiz.title}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPendingQuiz(null)} className="rounded-xl text-slate-400">
              <X size={20} />
            </Button>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> Thời gian (phút)</label>
                <input type="number" min={0} value={timeLimitMin} onChange={e => setTimeLimitMin(Number(e.target.value))}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
              </div>
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><RotateCcw size={14} /> Số lần tối đa</label>
                <input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Trộn câu hỏi', icon: Shuffle, val: shuffleQuestions, set: setShuffleQuestions },
                { label: 'Trộn đáp án', icon: Shuffle, val: shuffleOptions, set: setShuffleOptions },
                { label: 'Hiện giải thích', icon: HelpCircle, val: showExplanation, set: setShowExplanation },
              ].map(item => (
                <label key={item.label} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 cursor-pointer group transition-all">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <item.icon size={16} className="text-slate-400 group-hover:text-indigo-500" /> {item.label}
                  </div>
                  <input type="checkbox" checked={item.val} onChange={e => item.set(e.target.checked)}
                    className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-all" />
                </label>
              ))}
            </div>
          </div>

          <div className="p-8 pt-0 flex gap-4">
            <Button variant="outline" onClick={() => setPendingQuiz(null)} className="flex-1 rounded-[20px] font-bold text-xs h-14 uppercase tracking-widest border-slate-200">
              Quay lại
            </Button>
            <Button
              onClick={() => void handleConfirmAssign()}
              disabled={assigning}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[20px] font-bold text-xs h-14 gap-3 shadow-lg shadow-indigo-100 uppercase tracking-widest transition-all"
            >
              {assigning ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Giao cho lớp
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[80vh] flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Chọn Quiz để giao</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Nhấn vào quiz để cài đặt và giao cho lớp</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-slate-400">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <Loader2 size={40} className="animate-spin text-indigo-500" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <BookOpen size={48} className="mb-4 opacity-40" />
              <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Thư viện quiz trống</p>
              <p className="text-xs font-medium mt-1">Hãy tạo quiz mới trong hệ thống trước</p>
            </div>
          ) : (
            quizzes.map(quiz => {
              const assigned = localAssigned.has(quiz.uid);
              return (
                <button
                  key={quiz.uid}
                  type="button"
                  disabled={assigned}
                  onClick={() => { setPendingQuiz(quiz); setTimeLimitMin(0); setMaxAttempts(0); }}
                  className={`w-full text-left rounded-2xl border-2 p-5 transition-all flex items-center gap-5 ${
                    assigned
                      ? 'border-emerald-100 bg-emerald-50 cursor-default opacity-60'
                      : 'border-slate-50 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer group shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${assigned ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg'}`}>
                    {assigned ? <Check size={24} /> : <BookOpen size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{quiz.title}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{quiz.questions_count} câu hỏi</span>
                    </div>
                  </div>
                  {assigned ? (
                    <span className="text-[10px] font-black text-emerald-600 uppercase bg-white border border-emerald-100 px-3 py-1 rounded-full shrink-0 tracking-widest">Đã giao</span>
                  ) : (
                    <span className="text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full shrink-0 tracking-widest opacity-0 group-hover:opacity-100 transition-all">Chọn</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="p-8 border-t border-slate-100">
          <Button onClick={onClose} variant="outline" className="w-full rounded-[20px] font-bold text-xs h-14 uppercase tracking-widest border-slate-200">
            Đóng cửa sổ
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
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cài đặt Quiz</h2>
            <p className="text-sm text-slate-500 font-medium mt-1 truncate max-w-[240px]">{quiz.title}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-slate-400">
            <X size={20} />
          </Button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> Thời gian (phút)</label>
              <input type="number" min={0} value={timeLimitMin} onChange={e => setTimeLimitMin(Number(e.target.value))}
                className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><RotateCcw size={14} /> Số lần tối đa</label>
              <input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm đạt: {passingScore}%</label>
            </div>
            <input type="range" min={0} max={100} step={5} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
              className="w-full accent-indigo-600" />
          </div>

          <div className="space-y-4">
            {[
              { label: 'Trộn câu hỏi', icon: Shuffle, val: shuffleQuestions, set: setShuffleQuestions },
              { label: 'Trộn đáp án', icon: Shuffle, val: shuffleOptions, set: setShuffleOptions },
              { label: 'Hiện giải thích', icon: HelpCircle, val: showExplanation, set: setShowExplanation },
            ].map(item => (
              <label key={item.label} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 cursor-pointer group transition-all">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <item.icon size={16} className="text-slate-400 group-hover:text-indigo-500" /> {item.label}
                </div>
                <input type="checkbox" checked={item.val} onChange={e => item.set(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-all" />
              </label>
            ))}
          </div>
        </div>

        <div className="p-8 pt-0 flex gap-4">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-[20px] font-bold text-xs h-14 uppercase tracking-widest border-slate-200">
            Hủy
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[20px] font-bold text-xs h-14 gap-3 shadow-lg shadow-indigo-100 uppercase tracking-widest transition-all"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Lưu cài đặt
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
  const [records, setRecords] = useState<StudentExamRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    spaceApi.classrooms.studentSubmissions(classroomUid, member.member_id)
      .then(setRecords)
      .catch(() => toast.error('Không thể tải dữ liệu'))
      .finally(() => setLoading(false));
  }, [classroomUid, member.member_id]);

  const submitted = records.filter(r => r.submission).length;
  const graded = records.filter(r => r.submission?.grade != null).length;
  const avgGrade = graded > 0
    ? records.filter(r => r.submission?.grade != null).reduce((s, r) => s + (r.submission!.grade ?? 0), 0) / graded
    : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {member.member_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.member_avatar} alt={member.member_name} className="w-14 h-14 rounded-2xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl">
                {member.member_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-black text-slate-900">{member.member_name}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Sinh viên • Tham gia {formatDateTime(member.joined_at)}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-slate-400 shrink-0">
            <X size={20} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 px-8 py-5 border-b border-slate-100 shrink-0">
          {[
            { label: 'Tổng bài thi', value: records.length, color: 'text-slate-900' },
            { label: 'Đã nộp', value: submitted, color: 'text-indigo-600' },
            { label: 'Điểm TB', value: avgGrade != null ? avgGrade.toFixed(1) : '--', color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-2xl p-4 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <ClipboardCheck size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Chưa có bài thi nào</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-3">Bài kiểm tra</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3">Ngày nộp</th>
                  <th className="pb-3 text-right">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.exam.uid} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="py-3 pr-4 text-sm font-bold text-slate-800">{r.exam.title}</td>
                    <td className="py-3 pr-4">
                      {r.submission ? (
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${getSubmissionStatusClass(r.submission.status)}`}>
                          {r.submission.status}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-400">Chưa nộp</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs font-bold text-slate-500">
                      {r.submission?.submitted_at ? formatDateTime(r.submission.submitted_at) : '--'}
                    </td>
                    <td className="py-3 text-right">
                      {r.submission?.grade != null ? (
                        <span className={`text-sm font-black ${r.submission.grade >= 5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {r.submission.grade.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-sm font-black text-slate-300">--</span>
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
  const [records, setRecords] = useState<StudentExamRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    spaceApi.classrooms.studentSubmissions(classroomUid, member.member_id)
      .then(setRecords)
      .catch(() => toast.error('Không thể tải dữ liệu'))
      .finally(() => setLoading(false));
  }, [classroomUid, member.member_id]);

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
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {member.member_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.member_avatar} alt={member.member_name} className="w-12 h-12 rounded-2xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                {member.member_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-black text-slate-900">Phân tích — {member.member_name}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Thống kê học tập</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-slate-400 shrink-0">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5 text-center">
                  <div className="text-2xl font-black text-slate-900">{submissionRate}%</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Tỷ lệ nộp bài</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 text-center">
                  <div className="text-2xl font-black text-emerald-600">{avgGrade}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Điểm trung bình</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 text-center flex flex-col items-center gap-1">
                  {trend > 0
                    ? <TrendingUp size={22} className="text-emerald-500" />
                    : trend < 0
                    ? <TrendingDown size={22} className="text-rose-500" />
                    : <Minus size={22} className="text-slate-400" />}
                  <div className={`text-2xl font-black ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Xu hướng</div>
                </div>
              </div>

              {/* Chart */}
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 bg-slate-50 rounded-2xl">
                  <BarChart2 size={36} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">Chưa có điểm nào được chấm</p>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Điểm theo từng bài kiểm tra</p>
                  <GradeLineChart data={chartData} />
                </div>
              )}

              {/* Assessment */}
              <div className="rounded-2xl border border-slate-100 p-5 space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nhận xét tự động</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  {submissionRate === 0 && 'Sinh viên chưa nộp bài nào. Cần theo dõi và nhắc nhở.'}
                  {submissionRate > 0 && submissionRate < 50 && 'Tỷ lệ nộp bài thấp. Sinh viên cần chú ý hơn đến deadline.'}
                  {submissionRate >= 50 && submissionRate < 100 && trend >= 0 && 'Sinh viên tích cực, điểm số có xu hướng ổn định hoặc đi lên. Tiếp tục phát huy!'}
                  {submissionRate >= 50 && submissionRate < 100 && trend < 0 && 'Tỷ lệ nộp bài ổn nhưng điểm đang giảm. Cần hỗ trợ thêm.'}
                  {submissionRate === 100 && trend > 0 && 'Sinh viên xuất sắc — nộp đầy đủ và điểm liên tục tăng. Rất cố gắng!'}
                  {submissionRate === 100 && trend === 0 && 'Sinh viên chăm chỉ, nộp đầy đủ bài và giữ điểm ổn định.'}
                  {submissionRate === 100 && trend < 0 && 'Nộp bài đầy đủ nhưng điểm có xu hướng giảm. Cần xem lại chất lượng.'}
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
  const {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
  } = require('recharts');

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }}
          formatter={(v: number) => [v.toFixed(1), 'Điểm']}
        />
        <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Đạt', fontSize: 10, fill: '#f59e0b' }} />
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

// ── Exam Grade Table Modal ────────────────────────────────────────────────────

function ExamGradeTableModal({
  exam,
  members,
  onClose,
}: {
  exam: Exam;
  members: ClassroomMember[];
  onClose: () => void;
}) {
  const [submissions, setSubmissions] = useState<import('@/lib/api/types').ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    spaceApi.exams.listSubmissions(exam.uid)
      .then(setSubmissions)
      .catch(() => toast.error('Không thể tải bảng điểm'))
      .finally(() => setLoading(false));
  }, [exam.uid]);

  const subMap = new Map(submissions.map(s => [s.student_id, s]));
  const submitted = submissions.length;
  const graded = submissions.filter(s => s.grade != null).length;
  const avg = graded > 0
    ? (submissions.filter(s => s.grade != null).reduce((acc, s) => acc + (s.grade ?? 0), 0) / graded).toFixed(1)
    : '--';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Bảng điểm</p>
            <h2 className="text-xl font-black text-slate-900">{exam.title}</h2>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Hạn nộp: {exam.due_date ? formatDateTime(exam.due_date) : '--'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-slate-400 shrink-0">
            <X size={20} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 px-8 py-4 border-b border-slate-100 shrink-0">
          {[
            { label: 'Tổng SV', value: members.length },
            { label: 'Đã nộp', value: submitted },
            { label: 'Đã chấm', value: graded },
            { label: 'Điểm TB', value: avg },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-slate-900">{s.value}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <Users size={32} className="mb-2 opacity-30" />
              <p className="text-sm font-medium">Chưa có sinh viên trong lớp</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-3">Sinh viên</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3">Ngày nộp</th>
                  <th className="pb-3 text-right">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const sub = subMap.get(m.member_id);
                  return (
                    <tr key={m.member_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {m.member_avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.member_avatar} alt={m.member_name} className="w-8 h-8 rounded-xl object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-xs">
                              {m.member_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-bold text-slate-800">{m.member_name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {sub ? (
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${getSubmissionStatusClass(sub.status)}`}>
                            {sub.status}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-400">Chưa nộp</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs font-bold text-slate-500">
                        {sub?.submitted_at ? formatDateTime(sub.submitted_at) : '--'}
                      </td>
                      <td className="py-3 text-right">
                        {sub?.grade != null ? (
                          <span className={`text-sm font-black ${sub.grade >= 5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {sub.grade.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-sm font-black text-slate-300">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function getSubmissionStatusClass(status: string) {
  if (status === 'graded') return 'bg-emerald-50 text-emerald-600';
  if (status === 'submitted') return 'bg-indigo-50 text-indigo-600';
  if (status === 'late') return 'bg-amber-50 text-amber-600';
  return 'bg-slate-100 text-slate-500';
}

function getExamStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active' || normalized === 'published' || normalized === 'open') {
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

function isExamInKind(exam: Exam, kind: ExamKind) {
  const option = EXAM_KIND_OPTIONS.find(item => item.key === kind);
  if (!option) return false;

  const title = normalizeText(exam.title);
  return option.keywords.some(keyword => title.includes(normalizeText(keyword)));
}

function isExamKind(value: string | null): value is ExamKind {
  return EXAM_KIND_OPTIONS.some(option => option.key === value);
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatDateTime(value: string) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
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
