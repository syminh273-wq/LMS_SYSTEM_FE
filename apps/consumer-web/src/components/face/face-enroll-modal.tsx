import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { faceApi } from '@/lib/api/face';
import { CameraPermissionHelp } from './camera-permission-help';

type Props = {
  onClose: () => void;
  onEnrolled: () => void;
};

type Status = 'starting' | 'ready' | 'capturing' | 'success' | 'error';
type CameraErrorReason = 'denied' | 'not_found' | 'unknown';

export function FaceEnrollModal({ onClose, onEnrolled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraError, setCameraError] = useState<CameraErrorReason | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setStatus('starting');
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('ready');
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraError('denied');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraError('not_found');
      } else {
        setCameraError('unknown');
      }
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = async () => {
    if (!videoRef.current || status !== 'ready') return;
    setStatus('capturing');
    setErrorMsg('');

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0, 640, 480);
    const image = canvas.toDataURL('image/jpeg', 0.9);

    try {
      await faceApi.enroll(image);
      setStatus('success');
      stopCamera();
      setTimeout(() => {
        onEnrolled();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể đăng ký. Vui lòng thử lại.');
      setStatus('ready');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-black text-foreground">Đăng ký khuôn mặt</h2>
            <p className="text-xs font-medium text-muted-foreground">Nhìn thẳng vào camera rồi nhấn chụp</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {cameraError ? (
          <CameraPermissionHelp reason={cameraError} onRetry={() => void startCamera()} />
        ) : (
          <>
            <div className="relative bg-slate-900">
              <video ref={videoRef} className="h-80 w-full object-cover" autoPlay muted playsInline />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-56 w-44 rounded-[50%] border-4 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.38)]" />
              </div>

              {status === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                  <Loader2 size={32} className="animate-spin text-white" />
                </div>
              )}

              {status === 'success' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-950/70">
                  <CheckCircle2 size={48} className="text-success" />
                  <p className="text-sm font-black text-white">Đăng ký thành công!</p>
                </div>
              )}
            </div>

            <div className="space-y-3 p-5">
              {errorMsg && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {errorMsg}
                </div>
              )}
              <Button
                onClick={() => void handleCapture()}
                disabled={status !== 'ready'}
                className="h-12 w-full"
              >
                {status === 'capturing' ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" />Đang xử lý...</>
                ) : (
                  <><Camera size={16} className="mr-2" />Chụp và đăng ký</>
                )}
              </Button>
              <p className="text-center text-xs font-medium text-muted-foreground">
                Đảm bảo khuôn mặt nằm trong khung và đủ ánh sáng
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
