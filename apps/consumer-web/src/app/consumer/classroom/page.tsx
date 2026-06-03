'use client';

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { classroomApi, consumerApi, type Classroom } from '@/lib/api';
import { Button } from '@shared/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { toast } from 'sonner';
import { sendJoinClassroomNotification } from '@/lib/firebase-notifications';
import { useMembershipRealtime } from '@/lib/hooks/use-membership-realtime';
import { Loader2, QrCode, KeyRound, X, Camera, Plus, ChevronRight, Video, BookOpen, Clock } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';

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
      // 1. Resolve code first to get classroom details
      const link = await consumerApi.sharing.resolve(trimmed);
      if (link.resource_type !== 'classroom') {
        throw new Error('Mã này không phải mã lớp học.');
      }

      // 2. Perform join
      const res = await classroomApi.joinByCode(trimmed);
      
      const classroomObj: Classroom = {
        uid: link.resource_id,
        pid: trimmed,
        name: link.metadata.name || 'Phòng học mới',
        description: link.metadata.description || '',
        max_students: 0, // Fallback
        status: 'active',
        membership_status: res.membership_status as 'approved' | 'pending',
        teacher_id: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      void sendJoinClassroomNotification({ 
        classroomId: classroomObj.uid, 
        classroomName: classroomObj.name, 
        code: trimmed 
      });

      if (res.membership_status === 'pending') {
        toast.info('Đã gửi lời tham gia! Chờ giáo viên phê duyệt.');
        onJoined(classroomObj); // Add to list even if pending
        onClose();
      } else {
        toast.success(`Đã tham gia lớp "${classroomObj.name}" thành công!`);
        onJoined(classroomObj);
        onClose();
      }
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
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors cursor-pointer ${tab === 'code' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab('code')}
          >
            <KeyRound size={16} /> Nhập mã
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors cursor-pointer ${tab === 'qr' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
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
              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-xl font-bold cursor-pointer">
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

export default function ClassroomPage() {
  const router = useRouter();
  const { isAuthenticated, mounted } = useRequireAuth();
  const userId = useSelector((state: RootState) => state.user.profile?.uid);
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

  return (
    <div className="p-6 animate-in fade-in duration-500">
      {showJoin && <JoinDialog onClose={() => setShowJoin(false)} onJoined={handleJoined} />}
      
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">My Classrooms</h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">You are currently enrolled in <span className="text-[#4F46E5] font-bold">{classrooms.filter(c => c.membership_status !== 'pending').length} active courses</span>.</p>
          </div>
          <div className="flex items-center gap-2.5">
             <div className="bg-white dark:bg-card border border-gray-100 dark:border-border px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-300 shadow-sm">
                <BookOpen size={12} className="text-[#4F46E5]" />
                Fall Semester 2024
             </div>
             <button 
                onClick={() => setShowJoin(true)}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-3.5 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-[#4F46E5]/15 active:scale-[0.98] cursor-pointer"
              >
                <Plus size={12} />
                Join Class
              </button>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-[10px] text-red-700 font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2.5 text-gray-500 font-bold py-12 justify-center bg-white dark:bg-card rounded-[20px] border border-gray-100 dark:border-border shadow-sm">
            <Loader2 size={18} className="animate-spin text-[#4F46E5]" />
            <span className="text-xs">Loading academic space...</span>
          </div>
        ) : classrooms.length === 0 ? (
          <div className="rounded-[24px] border-2 border-dashed border-gray-200 dark:border-border bg-white dark:bg-card p-10 text-center space-y-4">
            <div className="w-12 h-12 bg-gray-50 dark:bg-muted rounded-full flex items-center justify-center mx-auto text-xl">🏫</div>
            <div className="space-y-0.5">
              <p className="font-bold text-gray-900 dark:text-white text-base">Your classroom is empty</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Join a class using a code from your teacher.</p>
            </div>
            <button 
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5 transition-all shadow-lg shadow-[#4F46E5]/15 cursor-pointer" 
              onClick={() => setShowJoin(true)}
            >
              <Plus size={14} />
              Join First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((classroom, index) => (
              <Card 
                key={classroom.uid} 
                onClick={() => {
                  if (classroom.membership_status === 'pending') {
                    toast.info('Yêu cầu đang chờ phê duyệt.');
                    return;
                  }
                  router.push(`/consumer/classroom/${classroom.uid}`);
                }}
                className="group overflow-hidden rounded-[16px] border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className={cn(
                  getSpaceColor(index), 
                  "h-16 p-3 flex flex-col justify-between relative transition-opacity",
                  classroom.membership_status === 'pending' && "opacity-60 grayscale-[0.5]"
                )}>
                   <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h3 className="text-[12px] font-bold text-white leading-tight pr-4 line-clamp-1">{classroom.name}</h3>
                        <p className="text-[7px] font-bold text-white/70 uppercase tracking-widest">ID: {classroom.pid}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-[9px] border border-white/30 shrink-0">
                         {classroom.name ? classroom.name[0] : '?'}
                      </div>
                   </div>
                </div>
                <CardContent className="p-3 bg-white dark:bg-card">
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed line-clamp-2 min-h-[2rem]">
                    {classroom.description || 'No description provided for this classroom yet.'}
                  </p>
                  
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <Badge variant="secondary" className={cn(
                      "border-none px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest flex items-center gap-1",
                      classroom.membership_status === 'pending' 
                        ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" 
                        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                    )}>
                       <span className={cn(
                         "w-1 h-1 rounded-full",
                         classroom.membership_status === 'pending' ? "bg-amber-500" : "bg-emerald-500"
                       )} />
                       {classroom.membership_status === 'pending' ? 'Pending' : 'Active'}
                    </Badge>
                    <Badge variant="secondary" className="bg-gray-50 dark:bg-muted text-gray-500 dark:text-gray-400 border-none px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest">
                       123 Students
                    </Badge>
                  </div>

                  <div className="h-px bg-gray-50 dark:bg-border/50 my-2.5" />

                  <div className="flex items-center justify-between">
                    <div className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">
                       <p>{classroom.membership_status === 'pending' ? 'Awaiting Approval' : 'Next: Tomorrow, 9 AM'}</p>
                    </div>
                    <div className={cn(
                      "font-bold text-[8px] uppercase tracking-widest flex items-center gap-1 transition-all",
                      classroom.membership_status === 'pending' ? "text-amber-500" : "text-[#4F46E5] group-hover:gap-1.5"
                    )}>
                      {classroom.membership_status === 'pending' ? 'View Status' : 'Enter'}
                      <ChevronRight size={8} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Missed a Class Banner */}
        <div className="bg-[#EBF2FF] dark:bg-muted/30 rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative">
           <div className="flex-1 space-y-6 relative z-10">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Missed a class?</h2>
              <p className="text-gray-600 dark:text-gray-400 font-medium max-w-md">
                Catch up with the latest recorded sessions and downloadable resources available in the Archive section.
              </p>
              <button className="bg-white text-gray-900 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                 <Video size={16} className="text-[#4F46E5]" />
                 View Recordings
              </button>
           </div>
           <div className="w-full md:w-[400px] h-[240px] rounded-3xl overflow-hidden shadow-2xl relative">
              <Image 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80" 
                alt="Workspace" 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-0 bg-indigo-500/10 mix-blend-multiply" />
           </div>
        </div>
      </div>
    </div>
  );
}

function getSpaceColor(index: number) {
  const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-orange-500', 'bg-pink-600', 'bg-sky-600', 'bg-violet-600'];
  return colors[index % colors.length];
}
