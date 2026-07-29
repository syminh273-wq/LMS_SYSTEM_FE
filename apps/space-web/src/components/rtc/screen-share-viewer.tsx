import { useEffect, useRef } from 'react';

interface ScreenShareViewerProps {
  stream: MediaStream | null;
  label: string;
}

export function ScreenShareViewer({ stream, label }: ScreenShareViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950 aspect-video">
      <video
        ref={videoRef}
        autoPlay
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
