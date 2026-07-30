import { Video, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { ScreenShareViewer } from '@/components/rtc/screen-share-viewer';
import { FrameViewer } from '@/components/rtc/frame-viewer';
import type { RtcMediaSource } from '@/lib/hooks/use-rtc';

interface ActiveRoom {
  uid: string;
}

interface MeetingTabProps {
  activeRoom: ActiveRoom | null;
  rtcJoined: boolean;
  rtcConnected: boolean;
  remoteFrame: string | null;
  localStream: MediaStream | null;
  localSource: RtcMediaSource | null;
  joining: boolean;
}

function PlaceholderCard({ title, subtitle, pulse }: { title: string; subtitle: string; pulse: boolean }) {
  return (
    <div
      className={`aspect-video bg-primary/20 rounded-2xl flex flex-col items-center justify-center text-primary gap-4 border-2 border-primary/20 border-dashed ${pulse ? 'animate-pulse' : ''}`}
    >
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <Video size={32} />
      </div>
      <div className="text-center">
        <p className="text-sm font-black uppercase tracking-widest">{title}</p>
        <p className="text-xs font-medium opacity-80 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

export function MeetingTab({
  activeRoom,
  rtcJoined,
  rtcConnected,
  remoteFrame,
  localStream,
  localSource,
  joining,
}: MeetingTabProps) {
  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col" style={{ height: '520px' }}>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video size={17} className="text-primary" />
          <span className="font-black text-foreground text-sm uppercase tracking-tighter">Phòng họp trực tuyến</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {rtcJoined ? (
            rtcConnected ? (
              <>
                <Wifi size={13} className="text-success" />
                <span className="text-success">Đã kết nối</span>
              </>
            ) : (
              <>
                <Loader2 size={13} className="animate-spin text-warning" />
                <span className="text-warning">Đang kết nối...</span>
              </>
            )
          ) : (
            <>
              <WifiOff size={13} className="text-muted-foreground" />
              <span className="text-muted-foreground">Chưa tham gia</span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto relative">
        <div className="flex-1 min-h-0">
          {remoteFrame ? (
            <FrameViewer frame={remoteFrame} label="Giảng viên" />
          ) : rtcJoined && activeRoom ? (
            <PlaceholderCard
              title="Đang chờ giảng viên chia sẻ"
              subtitle="Bạn đã vào lớp, vui lòng chờ..."
              pulse={false}
            />
          ) : activeRoom ? (
            <PlaceholderCard
              title="Lớp học đang diễn ra!"
              subtitle="Đang kết nối tự động vào lớp..."
              pulse
            />
          ) : (
            <div className="aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-muted-foreground gap-3 border-2 border-dashed border-slate-800">
              <Video size={48} className="opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Chưa có buổi học nào...</p>
              <p className="text-xs font-medium opacity-70">Giáo viên sẽ mở lớp, bạn sẽ được vào tự động</p>
            </div>
          )}
        </div>

        {localStream && (
          <div className="absolute bottom-6 right-6 w-44 md:w-56 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-black/40 z-10">
            <ScreenShareViewer stream={localStream} label={localSource === 'camera' ? 'Bạn' : 'Màn hình của bạn'} />
          </div>
        )}

        {!rtcJoined && (joining || !activeRoom) && (
          <div className="mt-auto flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
            <Loader2 size={18} className="animate-spin text-primary" />
            {activeRoom ? 'ĐANG VÀO LỚP...' : 'ĐANG CHỜ GIÁO VIÊN MỞ LỚP...'}
          </div>
        )}
      </div>

      <div className="p-4 bg-muted border-t border-border text-center">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Video qua WebSocket • Kết nối trực tiếp tới máy chủ
        </p>
      </div>
    </div>
  );
}
