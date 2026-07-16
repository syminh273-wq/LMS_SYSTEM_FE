'use client';

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classroomApi, consumerApi, type Classroom } from '@/lib/api';
import { Button } from '@shared/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { toast } from 'sonner';
import { sendJoinClassroomNotification } from '@/lib/firebase-notifications';
import { useMembershipRealtime } from '@/lib/hooks/use-membership-realtime';
import {
  Loader2, QrCode, KeyRound, X, Camera, Plus, BookOpen,
  Users, Hash, ArrowRight, School, Sparkles,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

type JoinTab = 'code' | 'qr';

const COVER_GRADIENTS = [
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-orange-500',
  'bg-pink-600',
  'bg-sky-600',
  'bg-violet-600',
];

function getCoverGradient(index: number) {
  return COVER_GRADIENTS[index % COVER_GRADIENTS.length];
}

function JoinDialog({ onClose, onJoined }: { onClose: () => void; onJoined: (c: Classroom) => void }) {
  const [tab, setTab] = useState<JoinTab>('code');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const result = await classroomApi.joinByCode(trimmed);
      const membershipStatus = (result as { membership_status?: string }).membership_status ?? 'pending';

      let classroomName = trimmed;
      let classroomUid = trimmed;
      try {
        const link = await consumerApi.sharing.resolve(trimmed);
        classroomUid = link.resource_id || trimmed;
        classroomName = link.metadata?.name || trimmed;
      } catch { /* best effort */ }

      void sendJoinClassroomNotification({ classroomId: classroomUid, classroomName, code: trimmed });

      if (membershipStatus === 'approved') {
        toast.success(`Đã tham gia lớp "${classroomName}" thành công!`);
        onJoined({
          uid: classroomUid,
          pid: trimmed,
          name: classroomName,
          status: 'active',
          membership_status: 'approved',
        } as Classroom);
        onClose();
      } else {
        toast.info(
          `Đã gửi yêu cầu tham gia lớp "${classroomName}". Vui lòng chờ giáo viên xác nhận.`,
          { duration: 6000 }
        );
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Mã lớp không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fade-in">
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Tham gia lớp học</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">Nhập mã hoặc quét QR từ giáo viên</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50">
          {[
            { key: 'code' as const, label: 'Nhập mã', icon: KeyRound },
            { key: 'qr' as const, label: 'Quét QR', icon: QrCode },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold transition-colors",
                tab === key
                  ? "text-indigo-700 bg-white border-b-2 border-indigo-600 -mb-px"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'code' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-2">
                  Mã lớp (PID)
                </label>
                <input
                  autoFocus
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="AB1C2D"
                  maxLength={10}
                  className="w-full h-14 rounded-lg border-2 border-slate-200 bg-white px-4 text-2xl font-mono font-bold tracking-[0.4em] text-center outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors uppercase"
                />
                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  Mã gồm 4-10 ký tự chữ và số
                </p>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-[12.5px] text-rose-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <KeyRound size={15} className="mr-2" />
                )}
                {loading ? 'Đang tham gia...' : 'Tham gia lớp'}
              </Button>
            </form>
          )}

          {tab === 'qr' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-700 text-center font-medium">
                  {cameraError}
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden bg-black aspect-square border border-slate-200">
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  {!scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-white">
                      <Camera size={36} className="opacity-60" />
                      <p className="text-[13px] opacity-70">Đang khởi động camera...</p>
                    </div>
                  )}
                  {scanning && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 relative">
                        <span className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-indigo-400 rounded-tl-lg" />
                        <span className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-indigo-400 rounded-tr-lg" />
                        <span className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-indigo-400 rounded-bl-lg" />
                        <span className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-indigo-400 rounded-br-lg" />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[12px] text-center text-slate-500">
                Hướng camera vào mã QR của giáo viên
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClassroomPage() {
  const router = useRouter();
  const { isAuthenticated, mounted } = useRequireAuth();
  const userId = useSelector((state: RootState) => state.user.profile?.uid);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active'>('all');

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

  useMembershipRealtime({
    userId,
    onApproved: useCallback(() => { void fetchClassrooms(); }, [fetchClassrooms]),
  });

  const handleJoined = (classroom: Classroom) => {
    setClassrooms(prev => {
      if (prev.find(c => c.uid === classroom.uid)) return prev;
      return [classroom, ...prev];
    });
  };

  if (!mounted) return null;

  const filtered = filter === 'active'
    ? classrooms.filter(c => c.status === 'active')
    : classrooms;

  const activeCount = classrooms.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {showJoin && <JoinDialog onClose={() => setShowJoin(false)} onJoined={handleJoined} />}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold mb-2">
              <School size={11} />
              Lớp học
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Lớp học của tôi</h1>
            <p className="text-slate-600 text-[14px] mt-1">
              {loading ? 'Đang tải...' : `${classrooms.length} lớp · ${activeCount} đang hoạt động`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {classrooms.length > 0 && (
              <div className="hidden sm:flex bg-white border border-slate-200 rounded-lg p-0.5">
                {[
                  { key: 'all' as const, label: 'Tất cả' },
                  { key: 'active' as const, label: 'Đang học' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={cn(
                      "px-3 py-1.5 text-[12.5px] font-semibold rounded-md transition-colors",
                      filter === key
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <Button
              onClick={() => setShowJoin(true)}
              className="h-10 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 gap-1.5"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Tham gia lớp</span>
              <span className="sm:hidden">Tham gia</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[13px]">Đang tải lớp học...</span>
          </div>
        ) : classrooms.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <School size={36} className="text-indigo-600" />
            </div>
            <h3 className="text-[17px] font-bold text-slate-900 mb-1">Chưa tham gia lớp học nào</h3>
            <p className="text-[13.5px] text-slate-500 max-w-sm mx-auto mb-6">
              Nhấn &ldquo;Tham gia lớp&rdquo; và nhập mã từ giáo viên hoặc quét QR code để bắt đầu.
            </p>
            <Button
              onClick={() => setShowJoin(true)}
              className="h-11 px-6 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 gap-2"
            >
              <Sparkles size={15} />
              Tham gia lớp đầu tiên
              <ArrowRight size={15} />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((classroom, index) => (
              <div
                key={classroom.uid}
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                className="group bg-white border border-slate-200 rounded-xl card-elevated animate-fade-up p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0", getCoverGradient(index))}>
                    {classroom.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-[14px] leading-tight line-clamp-2">{classroom.name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-slate-500 text-[11px] font-medium">
                      <Hash size={10} />
                      {classroom.pid}
                    </div>
                  </div>
                </div>

                <p className="text-[12.5px] text-slate-600 line-clamp-2 min-h-[2.5em]">
                  {classroom.description || 'Chưa có mô tả cho lớp học này.'}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                    <Users size={11} />
                    {Math.floor(Math.random() * 30) + 5} thành viên
                  </div>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                    classroom.status === 'active'
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      classroom.status === 'active' ? "bg-emerald-500" : "bg-slate-400"
                    )} />
                    {classroom.status === 'active' ? 'Đang học' : 'Đã đóng'}
                  </span>
                </div>

                <button
                  onClick={() => router.push(`/consumer/classroom/${classroom.uid}`)}
                  className="w-full h-9 rounded-lg bg-slate-100 hover:bg-indigo-600 text-[12.5px] font-semibold text-slate-700 hover:text-white transition-colors flex items-center justify-center gap-1.5 group/btn"
                >
                  Vào lớp học
                  <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
