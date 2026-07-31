import { useEffect, useRef } from 'react';

interface ScreenShareViewerProps {
  stream: MediaStream | null;
  label: string;
}

export function ScreenShareViewer({ stream, label }: ScreenShareViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream || video.srcObject === stream) return;
    video.srcObject = stream;
    // Drive play() ourselves (instead of relying on the `autoPlay` attribute)
    // so a promise interrupted by a later srcObject swap rejects quietly
    // instead of surfacing as an uncaught AbortError.
    void video.play().catch(() => {});
  }, [stream]);

  if (!stream) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950 aspect-video">
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-full w-full object-contain"
      />
      <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
        {label}
      </div>
    </div>
  );
}
