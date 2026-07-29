'use client';

import * as React from 'react';
import { Video, MonitorUp, Camera, Wifi, WifiOff, Users, X, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { ScreenShareViewer } from '@/components/rtc/screen-share-viewer';
import type { MeetingRoom } from '@/lib/api/meeting-room';

interface MeetingTabProps {
  activeMeeting: MeetingRoom | null;
  latestMeeting: MeetingRoom | null;
  meetingRooms: MeetingRoom[];
  loadingMeetings: boolean;
  meetingAction: 'start' | 'end' | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  localSource: 'screen' | 'camera' | null;
  rtcConnected: boolean;
  handleStartMeeting: (source: 'screen' | 'camera') => Promise<void> | void;
  handleEndMeeting: () => Promise<void> | void;
  stopMediaShare: () => void;
  formatDateTime: (v: string) => string;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function MeetingTab({
  activeMeeting,
  latestMeeting,
  meetingRooms: _meetingRooms,
  loadingMeetings,
  meetingAction,
  localStream,
  remoteStream,
  localSource,
  rtcConnected,
  handleStartMeeting,
  handleEndMeeting,
  stopMediaShare,
  formatDateTime,
  t,
}: MeetingTabProps) {
  return (
    <div className="flex h-full flex-col animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm">
      <div className="p-10 bg-muted/50 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.meeting_title')}</h3>
          <p className="text-sm text-muted-foreground font-medium mt-1">{t('classroom.ui.meeting_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
            activeMeeting
              ? 'bg-emerald-50 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-card text-muted-foreground'
          }`}>
            {activeMeeting ? <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> : <WifiOff size={14} />}
            {activeMeeting ? t('classroom.ui.meeting_status_active') : t('classroom.ui.meeting_status_offline')}
          </span>

          {activeMeeting ? (
            <div className="flex items-center gap-3">
              {!localStream ? (
                <>
                  <Button
                    onClick={() => void handleStartMeeting('camera')}
                    disabled={meetingAction !== null}
                    variant="outline"
                    className="h-12 rounded-2xl px-6 gap-2.5 text-xs font-bold hover:bg-muted uppercase tracking-widest"
                  >
                    {meetingAction === 'start' ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                    {t('classroom.ui.meeting_enable_camera')}
                  </Button>
                  <Button
                    onClick={() => void handleStartMeeting('screen')}
                    disabled={meetingAction !== null}
                    variant="outline"
                    className="h-12 rounded-2xl px-6 gap-2.5 text-xs font-bold hover:bg-muted uppercase tracking-widest"
                  >
                    {meetingAction === 'start' ? <Loader2 size={18} className="animate-spin" /> : <MonitorUp size={18} />}
                    {t('classroom.ui.meeting_share_screen')}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={stopMediaShare}
                  disabled={meetingAction !== null}
                  variant="outline"
                  className="h-12 rounded-2xl px-6 gap-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 uppercase tracking-widest"
                >
                  <WifiOff size={18} />
                  {t('classroom.ui.meeting_stop_streaming')}
                </Button>
              )}
              <Button
                onClick={() => void handleEndMeeting()}
                disabled={meetingAction !== null}
                variant="destructive"
                className="h-12 rounded-2xl px-6 gap-2.5 text-xs font-bold shadow-lg shadow-rose-100 uppercase tracking-widest"
              >
                {meetingAction === 'end' ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                {t('classroom.ui.meeting_end')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => void handleStartMeeting('camera')}
                disabled={meetingAction !== null}
                className="h-12 rounded-2xl bg-primary-brand px-8 gap-2.5 text-xs font-bold text-white shadow-lg shadow-primary-brand/20 hover:bg-primary-brand-dark uppercase tracking-widest transition-all"
              >
                {meetingAction === 'start' ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
                {t('classroom.ui.meeting_open_class')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-8">
        {loadingMeetings ? (
          <div className="flex h-60 items-center justify-center text-muted-foreground/50">
            <Loader2 size={48} className="animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              <div className="rounded-3xl bg-card p-6 shadow-sm group transition-all">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">{t('classroom.ui.meeting_status_label')}</div>
                <div className="text-lg font-bold text-foreground flex items-center gap-2">
                  {activeMeeting ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      {t('classroom.ui.meeting_teaching')}
                    </>
                  ) : t('classroom.ui.meeting_ready')}
                </div>
                <div className="mt-2 text-xs font-medium text-muted-foreground leading-relaxed">
                  {activeMeeting ? `${t('classroom.ui.meeting_started_at', undefined, { time: formatDateTime(activeMeeting.started_at || activeMeeting.created_at) })}` : t('classroom.ui.meeting_ready_desc')}
                </div>
              </div>
              <div className="rounded-3xl bg-card p-6 shadow-sm group transition-all">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Học viên đang tham gia</div>
                <div className="flex items-center gap-3 text-lg font-bold text-foreground">
                  <Users size={20} className="text-indigo-500" />
                  {activeMeeting ? `${activeMeeting.participant_count || 0}` : '0'}
                </div>
                <div className="mt-2 text-xs font-medium text-muted-foreground leading-relaxed">
                  {activeMeeting ? 'Sinh viên đang ở trong phòng' : 'Mở lớp để học viên tham gia'}
                </div>
              </div>
              <div className="rounded-3xl bg-card p-6 shadow-sm group transition-all">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">{t('classroom.ui.meeting_real_time')}</div>
                <div className="flex items-center gap-3 text-lg font-bold text-foreground">
                  {rtcConnected ? <Wifi size={20} className="text-emerald-500" /> : <WifiOff size={20} className="text-muted-foreground/50" />}
                  {rtcConnected ? t('classroom.ui.meeting_connected') : t('classroom.ui.meeting_waiting')}
                </div>
                <div className="mt-2 text-xs font-medium text-muted-foreground leading-relaxed">{t('classroom.ui.meeting_real_time_desc')}</div>
              </div>
              <div className="rounded-3xl bg-card p-6 shadow-sm group transition-all">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">{t('classroom.ui.meeting_latest')}</div>
                <div className="text-sm font-bold text-foreground truncate">
                  {latestMeeting?.title || t('classroom.ui.meeting_no_history')}
                </div>
                <div className="mt-2 text-xs font-medium text-muted-foreground leading-relaxed">
                  {latestMeeting ? `${t('classroom.ui.meeting_started_at', undefined, { time: formatDateTime(latestMeeting.created_at) })}` : t('classroom.ui.meeting_no_history_desc')}
                </div>
              </div>
            </div>

            <div className="rounded-[40px] bg-slate-950 p-6 shadow-2xl shadow-primary-brand/10">
              {remoteStream ? (
                <div className="rounded-[24px] overflow-hidden">
                  <ScreenShareViewer stream={remoteStream} label={t('classroom.ui.meeting_remote_stream')} />
                </div>
              ) : localStream ? (
                <div className="rounded-[24px] overflow-hidden">
                  <ScreenShareViewer stream={localStream} label={localSource === 'camera' ? t('classroom.ui.meeting_camera_streaming') : t('classroom.ui.meeting_screen_sharing')} />
                </div>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center rounded-[32px] text-center text-muted-foreground bg-slate-900/50">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                    <Video size={32} className="opacity-40" />
                  </div>
                  <p className="text-base font-bold text-muted-foreground uppercase tracking-[0.2em]">{t('classroom.ui.meeting_signal_empty')}</p>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">{t('classroom.ui.meeting_signal_empty_desc')}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
