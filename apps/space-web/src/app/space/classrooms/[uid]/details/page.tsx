'use client';

import * as React from 'react';
import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { spaceApi, SharingLink, Classroom, Exam } from '@/lib/api';
import {
  QrCode,
  Download,
  Loader2,
  Info,
  Share2,
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
} from 'lucide-react';
import { quizApi } from '@/lib/api/quiz';
import type { Quiz } from '@/lib/api/types';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
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
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'chat' | 'exams' | 'quiz'>('info');
  const [conversationUid, setConversationUid] = useState<string | null>(null);

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

    if (tab === 'info' || tab === 'docs' || tab === 'chat' || tab === 'exams' || tab === 'quiz') {
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
    <div className="max-w-6xl mx-auto py-6 space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumbs / Back Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/space/classrooms')}
            className="rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                ID: {classroom.pid}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Phòng học
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{classroom.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/space/classrooms/edit/${classroom.uid}`)}
            className="h-10 rounded-xl px-4 gap-2 font-bold text-xs border-slate-200 hover:bg-white"
          >
            <Settings size={16} />
            THIẾT LẬP
          </Button>
          <Button
            onClick={copyToClipboard}
            className="h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-4 gap-2 font-bold text-xs shadow-lg shadow-rose-100"
          >
            <Share2 size={16} />
            {copied ? 'ĐÃ COPY!' : 'CHIA SẺ'}
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[600px]">
        {/* Left Sidebar - Navigation & Quick Info */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'info' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Info size={18} />
              Thông tin chung
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'docs' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <FileText size={18} />
              Tài liệu học tập
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <MessageSquare size={18} />
              Thảo luận lớp học
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'exams' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ClipboardList size={18} />
              Bài kiểm tra
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'quiz' ? 'bg-violet-50 text-violet-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Gamepad2 size={18} />
              Quiz Game
            </button>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Sĩ số lớp</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-900">0</span>
                <span className="text-slate-400 font-bold text-sm mb-1">/ {classroom.max_students} học sinh</span>
              </div>
              <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-slate-900 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Mã tham gia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-black tracking-[0.2em]">{linkData?.code || '------'}</div>
              <Button
                variant="ghost"
                onClick={handleDownloadQr}
                className="w-full justify-start p-0 h-auto text-indigo-400 hover:text-indigo-300 hover:bg-transparent font-bold text-[11px] gap-2"
              >
                <Download size={14} /> TẢI MÃ QR
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {activeTab === 'info' && (
            <div className="p-8 space-y-8 animate-in fade-in duration-300 overflow-y-auto">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Info size={20} className="text-indigo-500" />
                  Mô tả phòng học
                </h3>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-600 font-medium leading-relaxed italic">
                  "{classroom.description}"
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <QrCode size={20} className="text-indigo-500" />
                    Mã QR tham gia
                  </h3>
                  <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4 shadow-inner">
                      {linkData && (
                        <QRCodeSVG
                          id="classroom-qr"
                          value={`${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`}
                          size={180}
                          level="H"
                        />
                      )}
                    </div>
                    <Button onClick={handleDownloadQr} variant="outline" className="rounded-xl font-bold text-xs gap-2">
                      <Download size={16} /> TẢI ẢNH QR XUỐNG
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Calendar size={20} className="text-indigo-500" />
                    Lịch sử hoạt động
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start relative before:absolute before:left-2 before:top-6 before:bottom-0 before:w-0.5 before:bg-slate-100">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm z-10" />
                      <div>
                        <div className="text-sm font-bold text-slate-800">Phòng học được khởi tạo</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(classroom.created_at).toLocaleString('vi-VN')}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm z-10" />
                      <div>
                        <div className="text-sm font-bold text-slate-800">Đang hoạt động</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Hiện tại</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Tài liệu học tập</h3>
                  <p className="text-xs text-slate-500 font-medium">Quản lý và chia sẻ học liệu của lớp học</p>
                </div>
                <input ref={docInputRef} type="file" className="hidden" onChange={handleDocUpload}
                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" />
                <Button
                  onClick={() => docInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-10 px-6 gap-2 shadow-lg shadow-indigo-100 disabled:opacity-70"
                >
                  {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={18} />}
                  {uploadingDoc ? 'ĐANG TẢI LÊN...' : 'TẢI LÊN TỆP MỚI'}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {documents.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <File size={40} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">Chưa có tài liệu nào</p>
                    <p className="text-xs mt-1">Nhấn "Tải lên tệp mới" để thêm học liệu</p>
                  </div>
                )}
                {documents.map(doc => (
                  <div key={doc.uid} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all hover:shadow-md">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {doc.file_type.match(/^(jpg|jpeg|png|gif|webp|svg)$/) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={doc.url} alt={doc.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <File size={24} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">{doc.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {doc.file_type.toUpperCase()} • {doc.size} • Đã tải lên {doc.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-indigo-600 rounded-lg">
                          <Download size={18} />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:text-rose-500 rounded-lg"
                        onClick={() => setDocuments(prev => prev.filter(d => d.uid !== doc.uid))}
                      >
                        <X size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && conversationUid && (
            <ClassroomChatPanel
              conversationUid={conversationUid}
              classroomUid={uid}
              active={activeTab === 'chat'}
            />
          )}

          {activeTab === 'chat' && !conversationUid && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
          )}


          {activeTab === 'quiz' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Quiz Game</h3>
                  <p className="text-xs text-slate-500 font-medium">Giao quiz cho sinh viên trong lớp chơi</p>
                </div>
                <Button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 shadow-lg shadow-violet-100"
                >
                  <Plus size={16} />
                  Chọn Quiz để giao
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loadingQuizzes ? (
                  <div className="flex items-center justify-center h-40 text-slate-400">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                ) : assignedQuizzes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-52 text-slate-400">
                    <Gamepad2 size={42} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">Chưa có quiz nào được giao</p>
                    <p className="text-xs mt-1 mb-5">Nhấn "Chọn Quiz để giao" để thêm quiz cho lớp</p>
                    <Button onClick={() => setShowAssignModal(true)} variant="outline" className="rounded-xl gap-2 font-bold text-xs">
                      <Plus size={15} /> Chọn Quiz
                    </Button>
                  </div>
                ) : (
                  assignedQuizzes.map(quiz => {
                    const assignment = quiz.assigned_classrooms?.[0];
                    const timeLimitMin = assignment?.time_limit_seconds ? Math.round(assignment.time_limit_seconds / 60) : 0;
                    const maxAttempts = assignment?.max_attempts ?? 0;
                    return (
                      <div key={quiz.uid} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-violet-200 hover:shadow-md transition-all p-5 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                          <BookOpen size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-slate-900 text-sm truncate">{quiz.title}</div>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold text-slate-400 uppercase flex-wrap">
                            <span>{quiz.questions_count} câu hỏi</span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {timeLimitMin > 0 ? `${timeLimitMin} phút` : 'Không giới hạn TG'}
                            </span>
                            <span className="flex items-center gap-1">
                              <RefreshCw size={10} />
                              {maxAttempts > 0 ? `${maxAttempts} lần` : 'Không giới hạn lần'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingQuiz(quiz)}
                            className="h-9 w-9 rounded-lg text-slate-400 hover:text-violet-600"
                            title="Cài đặt"
                          >
                            <Settings size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={unassigningUid === quiz.uid}
                            onClick={() => void handleUnassignQuiz(quiz)}
                            className="h-9 w-9 rounded-lg text-slate-400 hover:text-rose-500"
                            title="Bỏ giao"
                          >
                            {unassigningUid === quiz.uid ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Bài kiểm tra</h3>
                  <p className="text-xs text-slate-500 font-medium">Chọn loại bài kiểm tra để xem danh sách theo lớp</p>
                </div>
                {canManageExams && (
                  <Button
                    onClick={() => router.push(`/space/classrooms/${uid}/exams/create?kind=${selectedExamKind}`)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 shadow-lg shadow-indigo-100"
                  >
                    <Plus size={17} />
                    Tạo bài kiểm tra mới
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {EXAM_KIND_OPTIONS.map(kind => {
                    const count = visibleExams.filter(exam => isExamInKind(exam, kind.key)).length;
                    const active = selectedExamKind === kind.key;

                    return (
                      <button
                        key={kind.key}
                        type="button"
                        onClick={() => {
                          setSelectedExamKind(kind.key);
                          setSelectedExam(null);
                          void fetchExams();
                        }}
                        className={`text-left rounded-2xl border p-4 transition-all ${active ? 'border-indigo-200 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                            <ClipboardList size={20} />
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                            {count}
                          </span>
                        </div>
                        <div className="mt-4 text-sm font-black text-slate-900">{kind.label}</div>
                        <div className="mt-1 text-xs font-medium text-slate-500">{kind.description}</div>
                      </button>
                    );
                  })}
                </div>

                {loadingExams ? (
                  <div className="flex items-center justify-center h-40 text-slate-400">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                ) : filteredExams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-52 text-slate-400">
                    <ClipboardList size={42} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">Chưa có {selectedKind.label}</p>
                    <p className="text-xs mt-1">Nhấn "Tạo bài kiểm tra mới" để mở trang tạo bài</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                      <div className="text-sm font-black text-slate-900">{selectedKind.label}</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">{filteredExams.length} bài kiểm tra</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="px-4 py-3">Title</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Due date</th>
                            <th className="px-4 py-3">Content type</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExams.map(exam => (
                            <tr key={exam.uid} className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="text-sm font-bold text-slate-800">{exam.title}</div>
                                <div className="line-clamp-1 text-xs text-slate-400">{exam.description || 'Không có mô tả'}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${getExamStatusClass(exam.status)}`}>
                                  {exam.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-500">{formatDateTime(exam.due_date)}</td>
                              <td className="px-4 py-3 text-xs font-black uppercase text-slate-500">{exam.content_type}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/space/classrooms/${uid}/exams/${exam.uid}?tab=submissions`)}
                                    className="h-8 rounded-lg gap-1.5 text-xs font-bold"
                                  >
                                    <Eye size={14} />
                                    Details
                                  </Button>
                                  {canManageExams && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
                                          {deletingExamUid === exam.uid ? <Loader2 size={15} className="animate-spin" /> : <MoreVertical size={16} />}
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem onClick={() => router.push(`/space/classrooms/${uid}/exams/${exam.uid}/edit`)}>
                                          <Pencil size={14} className="mr-2" />
                                          <span>Chỉnh sửa</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          variant="destructive"
                                          onClick={() => void handleDeleteExam(exam)}
                                        >
                                          <Trash2 size={14} className="mr-2" />
                                          <span>Xóa bài</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedExam && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Chi tiết bài kiểm tra</div>
                        <h4 className="mt-1 text-lg font-black text-slate-900">{selectedExam.title}</h4>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedExam(null)} className="h-8 w-8 rounded-lg text-slate-400">
                        <X size={16} />
                      </Button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-xl bg-white p-3 border border-slate-100">
                        <div className="text-[10px] font-black uppercase text-slate-400">Status</div>
                        <div className="mt-1 font-bold text-slate-800">{selectedExam.status}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-slate-100">
                        <div className="text-[10px] font-black uppercase text-slate-400">Due date</div>
                        <div className="mt-1 font-bold text-slate-800">{formatDateTime(selectedExam.due_date)}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-slate-100">
                        <div className="text-[10px] font-black uppercase text-slate-400">Content type</div>
                        <div className="mt-1 font-bold uppercase text-slate-800">{selectedExam.content_type}</div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl bg-white p-4 border border-slate-100">
                      <div className="text-[10px] font-black uppercase text-slate-400">Description</div>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{selectedExam.description || 'Không có mô tả'}</p>
                    </div>
                    {(selectedExam.resource_url || selectedExam.content) && (
                      <div className="mt-3">
                        {selectedExam.resource_url ? (
                          <a href={selectedExam.resource_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="rounded-xl text-xs font-bold gap-2">
                              <Download size={15} />
                              Mở tài nguyên
                            </Button>
                          </a>
                        ) : (
                          <div className="rounded-xl bg-white p-4 border border-slate-100 text-sm font-medium text-slate-600 whitespace-pre-wrap">
                            {selectedExam.content}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {showAssignModal && (
        <AssignQuizModal
          classroomId={uid}
          assignedIds={assignedQuizzes.map(q => q.uid)}
          onClose={() => setShowAssignModal(false)}
          onAssigned={(quiz) => {
            setAssignedQuizzes(prev => [quiz, ...prev]);
            toast.success(`Đã giao quiz "${quiz.title}" cho lớp`);
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
            toast.success('Đã cập nhật cài đặt quiz');
          }}
        />
      )}
    </div>
  );
}

function AssignQuizModal({
  classroomId,
  assignedIds,
  onClose,
  onAssigned,
}: {
  classroomId: string;
  assignedIds: string[];
  onClose: () => void;
  onAssigned: (quiz: Quiz) => void;
}) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingQuiz, setPendingQuiz] = useState<Quiz | null>(null);

  // Settings
  const [timeLimitMin, setTimeLimitMin] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [passingScore, setPassingScore] = useState(50);

  const [assigning, setAssigning] = useState(false);
  const [localAssigned, setLocalAssigned] = useState<Set<string>>(new Set(assignedIds));

  useEffect(() => {
    quizApi.list().then(data => {
      setQuizzes(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleConfirmAssign = async () => {
    if (!pendingQuiz || assigning) return;
    setAssigning(true);
    try {
      const assignment = await quizApi.assignToClassroom(pendingQuiz.uid, classroomId, {
        time_limit_seconds: timeLimitMin > 0 ? timeLimitMin * 60 : 0,
        max_attempts: maxAttempts,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_explanation: showExplanation,
        passing_score_pct: passingScore,
      });

      // Update the quiz object with assignment info to reflect in UI
      const updatedQuiz = { ...pendingQuiz, assigned_classrooms: [assignment] };

      setLocalAssigned(prev => new Set([...prev, pendingQuiz.uid]));
      onAssigned(updatedQuiz);
      setPendingQuiz(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể giao quiz');
    } finally {
      setAssigning(false);
    }
  };

  // ── Settings step ──────────────────────────────────────────────────────────
  if (pendingQuiz) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <button type="button" onClick={() => setPendingQuiz(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="font-black text-slate-900">Cài đặt trước khi giao</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate max-w-xs">{pendingQuiz.title}</p>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5"><Clock size={12} /> Thời gian (phút)</label>
                <input type="number" min={0} value={timeLimitMin} onChange={e => setTimeLimitMin(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5"><RotateCcw size={12} /> Số lần tối đa</label>
                <input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">Điểm đạt: {passingScore}%</label>
              <input type="range" min={0} max={100} step={5} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
                className="w-full accent-violet-600" />
            </div>

            <div className="space-y-3">
              {[
                { label: 'Trộn câu hỏi', icon: Shuffle, val: shuffleQuestions, set: setShuffleQuestions },
                { label: 'Trộn đáp án', icon: Shuffle, val: shuffleOptions, set: setShuffleOptions },
                { label: 'Hiện giải thích', icon: HelpCircle, val: showExplanation, set: setShowExplanation },
              ].map(item => (
                <label key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <item.icon size={14} className="text-slate-400" /> {item.label}
                  </div>
                  <input type="checkbox" checked={item.val} onChange={e => item.set(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500" />
                </label>
              ))}
            </div>
          </div>

          <div className="p-6 pt-0 flex gap-3">
            <Button variant="outline" onClick={() => setPendingQuiz(null)} className="flex-1 rounded-xl font-bold text-xs h-11">
              Quay lại
            </Button>
            <Button
              onClick={() => void handleConfirmAssign()}
              disabled={assigning}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs h-11 gap-2 shadow-lg shadow-violet-100"
            >
              {assigning ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Giao cho lớp
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz list step ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-black text-slate-900">Chọn Quiz để giao</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Nhấn vào quiz để cài đặt và giao cho lớp</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-slate-400">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <BookOpen size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Thư viện quiz trống</p>
              <p className="text-xs mt-1">Tạo quiz mới tại trang Thư viện Quiz</p>
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
                  className={`w-full text-left rounded-2xl border-2 p-4 transition-all flex items-center gap-4 ${
                    assigned
                      ? 'border-emerald-200 bg-emerald-50 cursor-default'
                      : 'border-slate-100 bg-white hover:border-violet-300 hover:bg-violet-50 cursor-pointer'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${assigned ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {assigned ? <Check size={18} /> : <BookOpen size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm text-slate-900 truncate">{quiz.title}</div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] font-bold text-slate-400 uppercase">
                      <span>{quiz.questions_count} câu hỏi</span>
                    </div>
                  </div>
                  {assigned ? (
                    <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-100 px-2 py-1 rounded-full shrink-0">Đã giao</span>
                  ) : (
                    <span className="text-[10px] font-black text-violet-500 uppercase bg-violet-50 px-2 py-1 rounded-full shrink-0">Chọn</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <Button onClick={onClose} variant="outline" className="w-full rounded-xl font-bold text-xs h-10">
            Đóng
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
      // reflect updated settings on the quiz object
      const updated: Quiz = {
        ...quiz,
        assigned_classrooms: [assignment],
      };
      onSaved(updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật cài đặt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-black text-slate-900">Cài đặt Quiz</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate max-w-xs">{quiz.title}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-slate-400">
            <X size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5"><Clock size={12} /> Thời gian (phút)</label>
              <input type="number" min={0} value={timeLimitMin} onChange={e => setTimeLimitMin(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5"><RotateCcw size={12} /> Số lần tối đa</label>
              <input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">Điểm đạt: {passingScore}%</label>
            <input type="range" min={0} max={100} step={5} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
              className="w-full accent-violet-600" />
          </div>

          <div className="space-y-3">
            {[
              { label: 'Trộn câu hỏi', icon: Shuffle, val: shuffleQuestions, set: setShuffleQuestions },
              { label: 'Trộn đáp án', icon: Shuffle, val: shuffleOptions, set: setShuffleOptions },
              { label: 'Hiện giải thích', icon: HelpCircle, val: showExplanation, set: setShowExplanation },
            ].map(item => (
              <label key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <item.icon size={14} className="text-slate-400" /> {item.label}
                </div>
                <input type="checkbox" checked={item.val} onChange={e => item.set(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500" />
              </label>
            ))}
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl font-bold text-xs h-11">
            Hủy
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs h-11 gap-2 shadow-lg shadow-violet-100"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Lưu cài đặt
          </Button>
        </div>
      </div>
    </div>
  );
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
