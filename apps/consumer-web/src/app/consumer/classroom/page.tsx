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
import { ClassroomFavoriteButton } from '@/components/classroom/ClassroomFavoriteButton';
import {
  Loader2, QrCode, KeyRound, X, Camera, Plus, BookOpen,
  Users, Hash, School, Sparkles, ArrowRight,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

type JoinTab = 'code' | 'qr';

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
      const requiresPayment = Boolean((result as any).requires_payment);

      let classroomName = trimmed;
      let classroomUid = (result as any).classroom_uid || trimmed;
      try {
        const link = await consumerApi.sharing.resolve(trimmed);
        classroomUid = link.resource_id || classroomUid;
        classroomName = link.metadata?.name || trimmed;
      } catch { /* best effort */ }

      void sendJoinClassroomNotification({ classroomId: classroomUid, classroomName, code: trimmed });

      if (requiresPayment && (result as any).pay_url) {
        toast.info('Lớp học này yêu cầu thanh toán. Đang chuyển đến MoMo...');
        const orderId = (result as any).order_id;
        window.location.href = `/consumer/classroom/checkout/${classroomUid}${orderId ? `?order_id=${orderId}` : ''}`;
        return;
      }

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
        className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Tham gia lớp học</h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Nhập mã hoặc quét QR từ giáo viên</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
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
                  ? "text-indigo-700 bg-white dark:bg-slate-900 border-b-2 border-indigo-600 -mb-px"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100"
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
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Mã lớp (PID)
                </label>
                <input
                  autoFocus
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="AB1C2D"
                  maxLength={10}
                  className="w-full h-14 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-2xl font-mono font-bold tracking-[0.4em] text-center outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors uppercase"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
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
                <div className="relative rounded-lg overflow-hidden bg-black aspect-square border border-slate-200 dark:border-slate-700">
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
              <p className="text-[12px] text-center text-slate-500 dark:text-slate-400">
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {showJoin && <JoinDialog onClose={() => setShowJoin(false)} onJoined={handleJoined} />}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold mb-2">
              <School size={11} />
              Lớp học
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Lớp học của tôi</h1>
            <p className="text-slate-600 dark:text-slate-400 text-[14px] mt-1">
              {loading ? 'Đang tải...' : `${classrooms.length} lớp · ${activeCount} đang hoạt động`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {classrooms.length > 0 && (
              <div className="hidden sm:flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
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
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100"
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
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500 dark:text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[13px]">Đang tải lớp học...</span>
          </div>
        ) : classrooms.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <School size={36} className="text-indigo-600" />
            </div>
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-slate-100 mb-1">Chưa tham gia lớp học nào</h3>
            <p className="text-[13.5px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
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
            {filtered.map((classroom, index) => {
              const isActive = classroom.status === 'active';
              return (
                <div
                  key={classroom.uid}
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  onClick={() => router.push(`/consumer/classroom/${classroom.uid}`)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col cursor-pointer transition-colors hover:border-slate-300 animate-fade-up"
                >
                  <div className="flex items-center justify-end gap-2 px-4 pt-3.5 pb-2">
                    <ClassroomFavoriteButton
                      classroomUid={classroom.uid}
                      initialIsFavorited={!!(classroom as any).is_favorited}
                      initialCount={(classroom as any).favorite_count || 0}
                      variant="overlay"
                    />
                  </div>

                  <div className="px-4 pb-4 flex-1 flex flex-col gap-1.5">
                    <h3 className="font-bold text-foreground text-[15px] leading-tight line-clamp-2 group-hover:text-primary-brand transition-colors">
                      {classroom.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Hash size={10} /> {classroom.pid}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Users size={11} />
                      {classroom.member_count ?? '—'} thành viên
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded",
                        isActive
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                          : "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                      )}
                    >
                      {isActive ? 'Đang học' : 'Đã đóng'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
