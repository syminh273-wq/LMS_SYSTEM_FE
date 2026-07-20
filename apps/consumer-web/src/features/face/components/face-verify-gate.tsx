'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Camera, CheckCircle2, Loader2, ScanFace, UserX } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { faceApi } from '@/lib/api/face';
import { FaceEnrollModal } from './face-enroll-modal';
import { CameraPermissionHelp } from './camera-permission-help';

type GateState = 'checking' | 'not_enrolled' | 'pending' | 'verifying' | 'verified';
type CameraErrorReason = 'denied' | 'not_found' | 'unknown';

type Props = {
  examUid: string;
  children: ReactNode;
};

export function FaceVerifyGate({ examUid, children }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [gateState, setGateState] = useState<GateState>('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraError, setCameraError] = useState<CameraErrorReason | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const openCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      setGateState('pending'); // render <video> first, then attach stream via effect
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraError('denied');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraError('not_found');
      } else {
        setCameraError('unknown');
      }
    }
  }, []);

  // Attach stream after <video> is in the DOM (gateState transitions to 'pending')
  useEffect(() => {
    if ((gateState === 'pending' || gateState === 'verifying') && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [gateState]);

  useEffect(() => {
    const checkEnrollment = async () => {
      try {
        const { enrolled } = await faceApi.enrollmentStatus();
        if (!enrolled) {
          setGateState('not_enrolled');
        } else {
          await openCamera();
        }
      } catch {
        setGateState('not_enrolled');
      }
    };

    void checkEnrollment();
    return () => stopCamera();
  }, [openCamera, stopCamera]);

  const handleVerify = async () => {
    if (!videoRef.current || gateState !== 'pending') return;
    setGateState('verifying');
    setErrorMsg('');

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0, 640, 480);
    const image = canvas.toDataURL('image/jpeg', 0.9);

    try {
      const result = await faceApi.verify(examUid, image);

      if (result.error === 'no_enrollment') {
        stopCamera();
        setGateState('not_enrolled');
        return;
      }
      if (!result.camera_open) {
        setErrorMsg('Không phát hiện khuôn mặt. Đảm bảo đủ ánh sáng và nhìn thẳng vào camera.');
        setGateState('pending');
        return;
      }
      if (!result.recognized) {
        setErrorMsg(
          `Khuôn mặt không khớp (${(result.similarity * 100).toFixed(0)}% tương đồng). Vui lòng thử lại.`
        );
        setGateState('pending');
        return;
      }

      stopCamera();
      setGateState('verified');
    } catch {
      setErrorMsg('Lỗi xác minh. Vui lòng thử lại.');
      setGateState('pending');
    }
  };

  if (gateState === 'verified') return <>{children}</>;

  if (gateState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (gateState === 'not_enrolled') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm space-y-5 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <UserX size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Chưa đăng ký khuôn mặt</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Bạn cần đăng ký khuôn mặt trước khi làm bài kiểm tra.
            </p>
          </div>
          <Button
            onClick={() => setShowEnroll(true)}
            className="h-12 w-full rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"
          >
            <Camera size={16} className="mr-2" />
            Register now
          </Button>
        </div>

        {showEnroll && (
          <FaceEnrollModal
            onClose={() => setShowEnroll(false)}
            onEnrolled={() => {
              setShowEnroll(false);
              setGateState('checking');
              void openCamera();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <ScanFace size={24} />
          </div>
          <h2 className="text-lg font-black text-slate-900">Xác minh danh tính</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Nhìn thẳng vào camera rồi nhấn xác minh để vào làm bài
          </p>
        </div>

        {cameraError ? (
          <CameraPermissionHelp reason={cameraError} onRetry={() => void openCamera()} />
        ) : (
          <>
            <div className="relative bg-slate-900">
              <video ref={videoRef} className="h-72 w-full object-cover" autoPlay muted playsInline />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-56 w-44 rounded-[50%] border-4 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.38)]" />
              </div>

              {gateState === 'verifying' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/65">
                  <Loader2 size={36} className="animate-spin text-white" />
                  <p className="text-sm font-black text-white">Đang xác minh...</p>
                </div>
              )}
            </div>

            <div className="space-y-3 p-5">
              {errorMsg && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  {errorMsg}
                </div>
              )}
              <Button
                onClick={() => void handleVerify()}
                disabled={gateState === 'verifying'}
                className="h-12 w-full rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300"
              >
                {gateState === 'verifying' ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" />Đang xác minh...</>
                ) : (
                  <><CheckCircle2 size={16} className="mr-2" />Xác minh và vào làm bài</>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
