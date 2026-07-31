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
    <div className="relative group overflow-hidden rounded-lg bg-black aspect-video">
      <video
        ref={videoRef}
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
        {label}
      </div>
    </div>
  );
}
