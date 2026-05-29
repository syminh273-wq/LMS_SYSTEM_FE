'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getWebSocketBaseUrl } from '@/lib/api/runtime-url';

export type MonitorResult = {
  camera_open: boolean;
  recognized: boolean;
  multiple_faces: boolean;
  face_count: number;
  similarity: number;
};

type Props = {
  examUid?: string;
  roomUid?: string;
  onStatusChange?: (status: MonitorResult | null) => void;
};

const MIN_INTERVAL_MS = 500;

export function FaceMonitorWidget({ examUid, roomUid, onStatusChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sendingRef = useRef(false);
  const destroyedRef = useRef(false);
  const [result, setResult] = useState<MonitorResult | null>(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    destroyedRef.current = false;

    const captureAndSend = (ws: WebSocket) => {
      if (destroyedRef.current || ws.readyState !== WebSocket.OPEN || !videoRef.current) return;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 320, 240);
      sendingRef.current = true;
      ws.send(JSON.stringify({ type: 'frame', image: canvas.toDataURL('image/jpeg', 0.7) }));
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 240 },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const token = localStorage.getItem('accessToken');
        const wsPath = roomUid
          ? `/ws/face/meeting/${roomUid}/`
          : `/ws/face/monitor/${examUid}/`;
        const ws = new WebSocket(`${getWebSocketBaseUrl()}${wsPath}?token=${token}`);
        wsRef.current = ws;

        const resetStatus = () => {
          if (destroyedRef.current) return;
          const off: MonitorResult = { camera_open: false, recognized: false, multiple_faces: false, face_count: 0, similarity: 0 };
          setResult(null);
          onStatusChange?.(off);
        };

        ws.onopen = () => captureAndSend(ws);

        ws.onmessage = (e) => {
          const data = JSON.parse(e.data) as { type: string } & MonitorResult;
          if (data.type === 'verification_result') {
            setResult(data);
            onStatusChange?.(data);
          }
          sendingRef.current = false;
          setTimeout(() => captureAndSend(ws), MIN_INTERVAL_MS);
        };

        ws.onclose = () => resetStatus();
        ws.onerror = () => resetStatus();
      } catch (err) {
        console.error('Camera access denied:', err);
        if (!destroyedRef.current) {
          onStatusChange?.({ camera_open: false, recognized: false, multiple_faces: false, face_count: 0, similarity: 0 });
        }
      }
    };

    void start();
    return () => {
      destroyedRef.current = true;
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [examUid, roomUid, onStatusChange]);

  const recognized = result?.recognized ?? null;
  const hasWarning = result !== null && result.camera_open && !result.recognized;
  const multiplefaces = result?.multiple_faces ?? false;

  return (
    <>
      {hasWarning && (
        <div className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 shadow-lg shadow-rose-100">
            <ShieldAlert size={15} className="shrink-0 text-rose-600 animate-pulse" />
            <p className="text-sm font-bold text-rose-800">
              {multiplefaces ? 'Phát hiện nhiều khuôn mặt!' : 'Không nhận diện được khuôn mặt!'}
            </p>
          </div>
        </div>
      )}

      <div className="fixed bottom-24 right-4 z-40 sm:bottom-8">
        <div
          className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-200 ${
            minimized ? 'w-12' : 'w-44'
          }`}
        >
          {!minimized && (
            <div className="relative">
              <video
                ref={videoRef}
                className="h-32 w-full object-cover bg-slate-800"
                autoPlay
                muted
                playsInline
              />
              <div
                className={`absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full ${
                  recognized === null
                    ? 'bg-slate-400'
                    : recognized
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                }`}
              >
                {recognized ? (
                  <ShieldCheck size={11} className="text-white" />
                ) : (
                  <ShieldAlert size={11} className="text-white" />
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMinimized(m => !m)}
            className="flex h-9 w-full items-center justify-center gap-1.5 bg-slate-50 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            {minimized ? <Eye size={14} /> : <EyeOff size={14} />}
            {!minimized && <span>Camera</span>}
          </button>
        </div>
      </div>
    </>
  );
}
