'use client';

import * as React from 'react';
import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { spaceApi, SharingLink, Classroom } from '@/lib/api';
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
  Settings
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';
import { renderToStaticMarkup } from 'react-dom/server';
import { toast } from 'sonner';
import { chatApi } from '@/lib/api/chat';
import ClassroomChatPanel from '@/components/chat/ClassroomChatPanel';

interface ClassroomDetailsPageProps {
  params: Promise<{ uid: string }>;
}

export default function ClassroomDetailsPage({ params }: ClassroomDetailsPageProps) {
  const { uid } = use(params);
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [linkData, setLinkData] = useState<SharingLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'chat'>('info');
  const [conversationUid, setConversationUid] = useState<string | null>(null);

  type DocItem = { uid: string; name: string; size: string; date: string; url: string; file_type: string };
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

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
        </div>
      </div>
    </div>
  );
}
