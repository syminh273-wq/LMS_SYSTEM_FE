'use client';

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { classroomApi, type Classroom } from '@/lib/api';
import { Button } from '@shared/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { toast } from 'sonner';
import { sendJoinClassroomNotification } from '@/lib/firebase-notifications';
import { Loader2, QrCode, KeyRound, X, Camera } from 'lucide-react';


type JoinTab = 'code' | 'qr';

function JoinDialog({ onClose, onJoined }: { onClose: () => void; onJoined: (c: Classroom) => void }) {
  const [tab, setTab] = useState<JoinTab>('code');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // QR scanner state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    if (!('BarcodeDetector' in window)) {
      setCameraError('Trình duyệt không hỗ trợ quét QR. Vui lòng nhập mã thủ công.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });

      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const raw: string = codes[0].rawValue;
            // Support both full URL (/join/ABCDEF) and raw PID
            const match = raw.match(/\/join\/([A-Z0-9]{4,10})/i);
            const extracted = match ? match[1].toUpperCase() : raw.trim().toUpperCase();
            stopCamera();
            setTab('code');
            setCode(extracted);
            return;
          }
        } catch { /* detector may throw on blank frames */ }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
  }, [stopCamera]);

  useEffect(() => {
    if (tab === 'qr') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [tab, startCamera, stopCamera]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError('Vui lòng nhập mã lớp.'); return; }
    setError('');
    setLoading(true);
    try {
      const classroom = await classroomApi.joinByCode(trimmed);
      void sendJoinClassroomNotification({ classroomId: classroom.uid, classroomName: classroom.name, code: trimmed });
      toast.success(`Đã tham gia lớp "${classroom.name}" thành công!`);
      onJoined(classroom);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Mã lớp không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Tham gia lớp học</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${tab === 'code' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab('code')}
          >
            <KeyRound size={16} /> Nhập mã
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${tab === 'qr' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab('qr')}
          >
            <QrCode size={16} /> Quét QR
          </button>
        </div>

        <div className="p-6">
          {tab === 'code' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã lớp (PID)</label>
                <input
                  autoFocus
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: AB1C2D"
                  maxLength={10}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-mono font-bold tracking-widest text-center outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition uppercase"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-xl font-bold">
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Tham gia
              </Button>
            </form>
          )}

          {tab === 'qr' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700 text-center">
                  {cameraError}
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  {!scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white">
                      <Camera size={40} className="opacity-60" />
                      <p className="text-sm opacity-70">Đang khởi động camera...</p>
                    </div>
                  )}
                  {scanning && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white/80 rounded-xl relative">
                        <span className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl" />
                        <span className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr" />
                        <span className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl" />
                        <span className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br" />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-center text-gray-400">
                Hướng camera vào mã QR của giáo viên để tự động nhận mã
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ClassroomPage() {
  const router = useRouter();
  const { isAuthenticated, mounted, logout } = useRequireAuth();
  const [userName] = useState("Student");
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const fetchClassrooms = useCallback(async () => {
    try {
      const data = await classroomApi.mine();
      setClassrooms(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách classroom.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      queueMicrotask(() => { void fetchClassrooms(); });
    }
  }, [fetchClassrooms, isAuthenticated]);

  const handleJoined = (classroom: Classroom) => {
    setClassrooms(prev => {
      if (prev.find(c => c.uid === classroom.uid)) return prev;
      return [classroom, ...prev];
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
      {showJoin && <JoinDialog onClose={() => setShowJoin(false)} onJoined={handleJoined} />}

      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <Image src="/logo.jpg" alt="LMS LOGO" width={100} height={35} className="h-8 w-auto object-contain" />
            <span className="text-xl font-medium text-gray-700">Classroom</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowJoin(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl font-semibold"
          >
            <KeyRound size={16} />
            Tham gia lớp
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="cursor-pointer w-8 h-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-indigo-500 text-white text-sm">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  Cập nhật thông tin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/')}>
                  Trang chủ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  Dashboard
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <main className="p-8">
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Đang tải classroom...
          </div>
        ) : classrooms.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <div className="text-5xl mb-4">🏫</div>
            <p className="font-semibold text-gray-900 text-lg">Bạn chưa tham gia lớp học nào.</p>
            <p className="mt-1 text-sm text-gray-500">Nhấn &ldquo;Tham gia lớp&rdquo; và nhập mã từ giáo viên hoặc quét QR code.</p>
            <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => setShowJoin(true)}>
              <KeyRound size={16} />
              Tham gia lớp học
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classrooms.map((classroom, index) => (
              <div key={classroom.uid} className="flex flex-col overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md">
                <div className={`${getSpaceColor(index)} relative h-24 p-4`}>
                  <h3 className="truncate pr-8 text-xl font-bold text-white">{classroom.name}</h3>
                  <p className="text-sm text-white opacity-90">ID: {classroom.pid}</p>
                </div>
                <div className="min-h-[100px] flex-1 bg-white p-4">
                  <div className="relative -top-10 flex justify-end pr-2">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-300 text-2xl font-bold uppercase text-gray-600">
                      {classroom.name ? classroom.name[0] : '?'}
                    </div>
                  </div>
                  <p className="-mt-8 line-clamp-2 text-sm text-gray-600">{classroom.description || 'Không có mô tả.'}</p>
                </div>
                <div className="flex justify-between gap-2 border-t border-gray-200 p-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${classroom.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {classroom.status}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/classroom/${classroom.uid}`)}>
                    Vào lớp
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function getSpaceColor(index: number) {
  const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-orange-500', 'bg-pink-600', 'bg-sky-600', 'bg-violet-600'];
  return colors[index % colors.length];
}
