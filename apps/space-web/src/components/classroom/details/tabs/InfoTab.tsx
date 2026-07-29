import * as React from 'react';
import { Info, QrCode, Download, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import type { Classroom, ClassroomJoinLink } from '@/lib/api';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getActivityMeta } from '../utils/activity';
import { useClassroomActivity } from '../hooks/useClassroomActivity';

interface InfoTabProps {
  classroom: Classroom;
  linkData: ClassroomJoinLink | null;
  formatDateTime: (value: string) => string;
  onDownloadQr: () => void;
  router: AppRouterInstance;
  uid: string;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function InfoTab({
  classroom,
  linkData,
  formatDateTime,
  onDownloadQr,
  router,
  uid,
  t,
}: InfoTabProps) {
  const { activityLogs, activityLevel, setActivityLevel, loadingActivity } = useClassroomActivity({ uid });

  return (
    <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-300">
      <div className="bg-card rounded-[32px] p-10 shadow-sm group">
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand">
            <Info size={22} />
          </div>
          {t('classroom.ui.info_description_title')}
        </h3>
        <div className="bg-muted/50 p-8 rounded-3xl text-muted-foreground font-medium leading-relaxed italic text-lg relative">
          <span className="absolute -top-4 -left-2 text-6xl text-muted-foreground/10 font-serif opacity-50">&ldquo;</span>
          {classroom.description}
          <span className="absolute -bottom-10 -right-2 text-6xl text-muted-foreground/10 font-serif opacity-50">&rdquo;</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card rounded-[32px] p-10 shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-bold text-foreground mb-8 self-start flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand">
              <QrCode size={22} />
            </div>
            {t('classroom.ui.info_qr_card_title')}
          </h3>
          <div className="p-10 bg-card rounded-[40px] mb-10 shadow-inner group transition-all">
            <div className="p-6 bg-muted rounded-[32px] group-hover:scale-105 transition-transform duration-500">
              {linkData && (
                <QRCodeSVG
                  id="classroom-qr"
                  value={`${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                  className="dark:bg-card dark:p-2 dark:rounded-xl"
                />
              )}
            </div>
          </div>
          <Button
            onClick={onDownloadQr}
            className="w-full h-14 bg-primary-brand/10 hover:bg-primary-brand/20 text-primary-brand rounded-[20px] font-bold text-xs gap-3 transition-all uppercase tracking-widest"
          >
            <Download size={20} /> {t('classroom.ui.info_qr_download')}
          </Button>
        </div>

        <div className="bg-card rounded-[32px] p-10 shadow-sm flex flex-col">
          <div className="flex flex-col gap-4 mb-8">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand shrink-0">
                <RotateCcw size={22} />
              </div>
              <span>{t('classroom.ui.info_activity_title')}</span>
            </h3>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                {(['major', 'detail'] as const).map((lvl) => (
                  <Button
                    key={lvl}
                    variant="ghost"
                    onClick={() => setActivityLevel(lvl)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all bg-transparent! hover:bg-transparent! active:bg-transparent! focus-visible:bg-transparent! focus-visible:ring-0! shadow-none ${
                      activityLevel === lvl
                        ? 'text-primary-brand font-black'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lvl === 'major' ? t('classroom.ui.info_level_major') : t('classroom.ui.info_level_detail')}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => router.push(`/space/classrooms/${uid}/activity`)}
                className="flex items-center gap-1.5 text-[10px] font-black text-primary-brand hover:text-primary-brand uppercase tracking-widest px-3 py-1.5 rounded-xl bg-transparent! hover:bg-transparent! active:bg-transparent! focus-visible:bg-transparent! focus-visible:ring-0! shadow-none"
              >
                {t('classroom.ui.info_view_all')}
                <ChevronRight size={13} />
              </Button>
            </div>
          </div>

          {loadingActivity ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-primary-brand" />
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <RotateCcw size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">{t('classroom.ui.info_no_activity')}</p>
            </div>
          ) : (
            <div className="space-y-0 pl-3 overflow-y-auto max-h-80">
              {activityLogs.map((log, idx) => {
                const { icon: Icon, color, bg, label } = getActivityMeta(log.event_type, t);
                const isLast = idx === activityLogs.length - 1;
                return (
                  <div
                    key={log.uid}
                    className={`flex gap-4 items-start relative${!isLast ? ' pb-6' : ''}`}
                  >
                    {!isLast && (
                      <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-muted" />
                    )}
                    <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center shrink-0 z-10`}>
                      <Icon size={13} className={color} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-sm font-semibold text-foreground leading-snug">
                        {label}{log.target_name ? `: ${log.target_name}` : ''}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                        {log.actor_name && <span className="font-bold">{log.actor_name}</span>}
                        <span>•</span>
                        <span>{formatDateTime(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
