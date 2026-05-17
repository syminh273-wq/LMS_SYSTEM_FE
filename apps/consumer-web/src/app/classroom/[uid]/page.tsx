'use client';

import * as React from 'react';
import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { classroomApi, Classroom } from '@/lib/api';
import type { ChatMessage } from '@/lib/api/types';
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
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { useClassroomChat } from '@/lib/hooks/use-classroom-chat';

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
                { icon: MessageSquare, label: 'Thảo luận', active: true },
                { icon: BookOpen, label: 'Bài học' },
                { icon: FileText, label: 'Bài tập' },
                { icon: Video, label: 'Phòng họp' }
              ].map((item, idx) => (
                <button 
                  key={idx}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${item.active ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Chat Feed */}
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
