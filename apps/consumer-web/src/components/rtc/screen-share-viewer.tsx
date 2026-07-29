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
    <div className="relative group overflow-hidden rounded-lg bg-black aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
        {label}
      </div>
    </div>
  );
}
