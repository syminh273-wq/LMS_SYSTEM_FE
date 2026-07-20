'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { getWebSocketBaseUrl } from '@/lib/api/runtime-url';

export type MonitorResult = {
  camera_open: boolean;
  recognized: boolean;
  multiple_faces: boolean;
  face_count: number;
  similarity: number;
};

export type FaceEventType =
  | 'camera_lost'
  | 'camera_restored'
  | 'face_not_recognized'
  | 'face_recognized'
  | 'no_face'
  | 'multiple_faces'
  | 'single_face_restored';

type Props = {
  examUid?: string;
  roomUid?: string;
  onStatusChange?: (status: MonitorResult | null) => void;
  onFaceEvent?: (eventType: FaceEventType, data: Record<string, unknown>) => void;
};

const MIN_INTERVAL_MS = 500;
const FACE_DEBOUNCE_MS = 3000; // Emit face warning at most once per 3s per rule

export function FaceMonitorWidget({ examUid, roomUid, onStatusChange, onFaceEvent }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sendingRef = useRef(false);
  const destroyedRef = useRef(false);
  // Stable refs for callbacks to avoid useEffect re-mount on every parent render
  const onStatusChangeRef = useRef(onStatusChange);
  const onFaceEventRef = useRef(onFaceEvent);
  onStatusChangeRef.current = onStatusChange;
  onFaceEventRef.current = onFaceEvent;
  const prevStateRef = useRef<{ camera_open: boolean; recognized: boolean; multiple_faces: boolean }>({
    camera_open: false,
    recognized: false,
    multiple_faces: false,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedAtRef = useRef<Record<string, number>>({});
  const [result, setResult] = useState<MonitorResult | null>(null);
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

    const emitIfBad = (next: MonitorResult) => {
      if (!onFaceEventRef.current) return;
      const now = Date.now();
      const debounce = (key: string, intervalMs: number) => {
        const last = lastEmittedAtRef.current[key] || 0;
        if (now - last < intervalMs) return false;
        lastEmittedAtRef.current[key] = now;
        return true;
      };
      const clearKey = (key: string) => {
        delete lastEmittedAtRef.current[key];
      };

      // Camera off (always emit when sustained)
      if (!next.camera_open) {
        if (debounce('camera_lost', FACE_DEBOUNCE_MS)) {
          onFaceEventRef.current('camera_lost', { face_count: next.face_count, similarity: next.similarity });
        }
        return;
      }
      // Camera on — clear camera_lost key
      clearKey('camera_lost');

      // Multiple faces (always emit when sustained)
      if (next.multiple_faces) {
        if (debounce('multiple_faces', FACE_DEBOUNCE_MS)) {
          onFaceEventRef.current('multiple_faces', { face_count: next.face_count });
        }
        return;
      }
      clearKey('multiple_faces');

      // No face in frame (camera open, no multiple faces, but face_count=0)
      if ((next.face_count ?? 0) === 0) {
        if (debounce('no_face', FACE_DEBOUNCE_MS)) {
          onFaceEventRef.current('no_face', { face_count: 0, similarity: next.similarity });
        }
        return;
      }
      clearKey('no_face');

      // Face present but not recognized (covers "che camera", wrong person, etc.)
      if (!next.recognized) {
        if (debounce('face_not_recognized', FACE_DEBOUNCE_MS)) {
          onFaceEventRef.current('face_not_recognized', { similarity: next.similarity });
        }
        return;
      }
      clearKey('face_not_recognized');
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 240 },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            if (!destroyedRef.current) throw playErr;
          }
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
          if (prevStateRef.current.camera_open) {
            onFaceEventRef.current?.('camera_lost', { reason: 'ws_close' });
          }
          prevStateRef.current = { camera_open: false, recognized: false, multiple_faces: false };
          setResult(null);
          onStatusChangeRef.current?.(off);
        };

        ws.onopen = () => captureAndSend(ws);

        ws.onmessage = (e) => {
          const data = JSON.parse(e.data) as { type: string } & MonitorResult;
          if (data.type === 'verification_result') {
            setResult(data);
            onStatusChangeRef.current?.(data);
            // Always check; emitIfBad internally debounces per rule key
            emitIfBad(data);
          }
          sendingRef.current = false;
          setTimeout(() => captureAndSend(ws), MIN_INTERVAL_MS);
        };

        ws.onclose = () => resetStatus();
        ws.onerror = () => resetStatus();
      } catch (err) {
        if (destroyedRef.current) return;
        console.error('Camera access denied:', err);
        const off: MonitorResult = { camera_open: false, recognized: false, multiple_faces: false, face_count: 0, similarity: 0 };
        if (prevStateRef.current.camera_open) {
          onFaceEventRef.current?.('camera_lost', { reason: 'permission_denied' });
        }
        prevStateRef.current = { camera_open: false, recognized: false, multiple_faces: false };
        onStatusChangeRef.current?.(off);
      }
    };

    void start();
    return () => {
      destroyedRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [examUid, roomUid]);

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
        <div className="w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
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

          <div className="flex h-9 w-full items-center justify-center gap-1.5 bg-slate-50 text-xs font-bold text-slate-600">
            <ShieldCheck size={14} className="text-slate-400" />
            <span>Camera</span>
          </div>
        </div>
      </div>
    </>
  );
}
