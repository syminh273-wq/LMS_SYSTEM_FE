interface FrameViewerProps {
  frame: string | null;
  label: string;
}

// Renders a JPEG frame relayed over WebSocket (see use-rtc.ts) — a plain
// <img>, not a <video>, since there's no continuous media stream here.
export function FrameViewer({ frame, label }: FrameViewerProps) {
  if (!frame) return null;

  return (
    <div className="relative group overflow-hidden rounded-lg bg-black aspect-video">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frame} alt={label} className="w-full h-full object-contain" />
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
        {label}
      </div>
    </div>
  );
}
