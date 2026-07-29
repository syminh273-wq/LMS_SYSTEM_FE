import * as React from 'react';
import {
  QrCode,
  Info,
  Calendar,
  FileText,
  MessageSquare,
  X,
  Bot,
  Video,
  ClipboardList,
  Gamepad2,
  Users,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  BarChart2,
  Trophy,
  ShieldBan,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card } from '@shared/components/ui/card';
import type { Classroom, SharingLink } from '@/lib/api';
import type { ClassroomMember, BlacklistEntry } from '@/lib/api/types';
import type { MeetingRoom } from '@/lib/api/meeting-room';
import type { ActiveTab, ActiveTabKey } from '../utils/tabs';

interface SidebarProps {
  activeTab: string;
  goToTab: (tab: ActiveTab, extras?: Record<string, string | null>) => void;
  openGroups: { classroom: boolean; learning: boolean; students: boolean };
  toggleGroup: (key: 'classroom' | 'learning' | 'students') => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  members: ClassroomMember[];
  blacklist: BlacklistEntry[];
  activeMeeting: MeetingRoom | null;
  classroom: Classroom;
  linkData: SharingLink | null;
  onDownloadQr: () => void;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function Sidebar({
  activeTab,
  goToTab,
  openGroups,
  toggleGroup,
  sidebarCollapsed,
  setSidebarCollapsed,
  members,
  blacklist,
  activeMeeting,
  classroom,
  linkData,
  onDownloadQr,
  t,
}: SidebarProps) {
  return (
    <div className={`shrink-0 transition-all duration-300 space-y-3 ${sidebarCollapsed ? 'w-[52px]' : 'w-[268px]'}`}>
      {sidebarCollapsed ? (
        <div className="bg-card rounded-3xl shadow-sm overflow-hidden py-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(false)}
            title={t('classroom.ui.expand_sidebar')}
            className="w-full h-10 rounded-none hover:bg-muted transition-colors"
          >
            <ChevronsRight size={16} className="text-muted-foreground" />
          </Button>
          <div className="mx-3 mb-1" />
          {([
            { id: 'info',     label: t('classroom.ui.tab_info'),     icon: Info },
            { id: 'docs',     label: t('classroom.ui.tab_docs'),     icon: FileText },
            { id: 'ai',       label: t('classroom.ui.tab_ai'),       icon: Bot },
            { id: 'chat',     label: t('classroom.ui.tab_chat'),     icon: MessageSquare },
            { id: 'meeting',  label: t('classroom.ui.tab_meeting'),  icon: Video },
            { id: 'calendar', label: t('classroom.ui.tab_calendar'), icon: Calendar },
            { id: 'exams',    label: t('classroom.ui.tab_exams'),    icon: ClipboardList },
            { id: 'final_exams', label: t('classroom.ui.tab_final_exams'), icon: BarChart2 },
            { id: 'quiz',     label: t('classroom.ui.tab_quiz'),     icon: Gamepad2 },
            { id: 'students',  label: t('classroom.ui.tab_students'),  icon: Users },
            { id: 'ranking',  label: t('classroom.ui.tab_ranking'),  icon: Trophy },
            { id: 'leave_request', label: t('classroom.ui.tab_leave_request', 'Xin nghỉ'), icon: ClipboardList },
            { id: 'blacklist', label: t('classroom.ui.tab_blacklist'), icon: ShieldBan },
          ] as const).map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <Button
                key={id}
                variant="ghost"
                size="icon"
                title={label}
                onClick={() => goToTab(id as ActiveTab)}
                className={`relative w-full h-10 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {isActive && <div className="absolute left-0 w-1 h-5 bg-primary-brand rounded-r-full top-1/2 -translate-y-1/2" />}
                <Icon size={18} />
                {id === 'meeting' && activeMeeting && (
                  <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-2.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{t('classroom.ui.menu_label')}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(true)}
              title={t('classroom.ui.collapse_sidebar')}
              className="h-8 w-8 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronsLeft size={15} className="text-muted-foreground" />
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => toggleGroup('classroom')}
            className="w-full h-auto flex items-center justify-between px-5 py-3 rounded-none text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {t('classroom.ui.group_class_info')}
            <ChevronDown size={14} className={`transition-transform duration-200 ${openGroups.classroom ? '' : '-rotate-90'}`} />
          </Button>
          {openGroups.classroom && (
            <div className="pb-1 px-1">
              {[
                { id: 'info',    label: t('classroom.ui.tab_info'),    icon: Info },
                { id: 'docs',    label: t('classroom.ui.tab_docs'),    icon: FileText },
                { id: 'ai',      label: t('classroom.ui.tab_ai'),      icon: Bot },
                { id: 'chat',    label: t('classroom.ui.tab_chat'),    icon: MessageSquare },
                { id: 'meeting', label: t('classroom.ui.tab_meeting'), icon: Video },
                { id: 'calendar', label: t('classroom.ui.tab_calendar'), icon: Calendar },
              ].map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <Button
                    key={id}
                    variant="ghost"
                    onClick={() => goToTab(id as ActiveTab)}
                    className={`w-full h-auto justify-start flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                      isActive
                        ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 w-1.5 h-5 bg-primary-brand rounded-r-full" />}
                    <Icon size={18} className={isActive ? 'text-primary-brand' : 'text-muted-foreground group-hover:text-foreground'} />
                    {label}
                    {id === 'meeting' && activeMeeting && (
                      <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          <div className="mx-4" />

          <Button
            variant="ghost"
            onClick={() => toggleGroup('learning')}
            className="w-full h-auto flex items-center justify-between px-5 py-3 rounded-none text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {t('classroom.ui.group_learning')}
            <ChevronDown size={14} className={`transition-transform duration-200 ${openGroups.learning ? '' : '-rotate-90'}`} />
          </Button>
          {openGroups.learning && (
            <div className="pb-1 px-1">
              {[
                { id: 'final_exams', label: t('classroom.ui.tab_final_exams'), icon: BarChart2 },
                { id: 'exams', label: t('classroom.ui.tab_exams'), icon: ClipboardList },
                { id: 'quiz',  label: t('classroom.ui.tab_quiz'),    icon: Gamepad2 },
              ].map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <Button
                    key={id}
                    variant="ghost"
                    onClick={() => goToTab(id as ActiveTab)}
                    className={`w-full h-auto justify-start flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                      isActive
                        ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 w-1.5 h-5 bg-primary-brand rounded-r-full" />}
                    <Icon size={18} className={isActive ? 'text-primary-brand' : 'text-muted-foreground group-hover:text-foreground'} />
                    {label}
                  </Button>
                );
              })}
            </div>
          )}

          <div className="mx-4" />

          <Button
            variant="ghost"
            onClick={() => toggleGroup('students')}
            className="w-full h-auto flex items-center justify-between px-5 py-3 rounded-none text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {t('classroom.ui.group_students')}
            <ChevronDown size={14} className={`transition-transform duration-200 ${openGroups.students ? '' : '-rotate-90'}`} />
          </Button>
          {openGroups.students && (
            <div className="pb-2 px-1">
              {(() => {
                const isActive = activeTab === 'students';
                return (
                  <Button
                    variant="ghost"
                    onClick={() => goToTab('students')}
                    className={`w-full h-auto justify-start flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                      isActive
                        ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 w-1.5 h-5 bg-primary-brand rounded-r-full" />}
                    <Users size={18} className={isActive ? 'text-primary-brand' : 'text-muted-foreground group-hover:text-foreground'} />
                    {t('classroom.ui.tab_students')}
                    {members.filter(m => m.role === 'student').length > 0 && (
                      <span className="ml-auto text-[10px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {members.filter(m => m.role === 'student').length}
                      </span>
                    )}
                  </Button>
                );
              })()}
              {(() => {
                const isActive = activeTab === 'ranking';
                return (
                  <Button
                    variant="ghost"
                    onClick={() => goToTab('ranking')}
                    className={`w-full h-auto justify-start flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                      isActive
                        ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 w-1.5 h-5 bg-primary-brand rounded-r-full" />}
                    <Trophy size={18} className={isActive ? 'text-primary-brand' : 'text-muted-foreground group-hover:text-foreground'} />
                    {t('classroom.ui.tab_ranking')}
                  </Button>
                );
              })()}
              {(() => {
                const isActive = activeTab === 'blacklist';
                return (
                  <Button
                    variant="ghost"
                    onClick={() => goToTab('blacklist')}
                    className={`w-full h-auto justify-start flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${
                      isActive
                        ? 'bg-primary-brand-light text-primary-brand hover:bg-primary-brand-light hover:text-primary-brand'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 w-1.5 h-5 bg-primary-brand rounded-r-full" />}
                    <ShieldBan size={18} className={isActive ? 'text-primary-brand' : 'text-muted-foreground group-hover:text-foreground'} />
                    {t('classroom.ui.tab_blacklist')}
                    {blacklist.length > 0 && (
                      <span className="ml-auto text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                        {blacklist.length}
                      </span>
                    )}
                  </Button>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {!sidebarCollapsed && <>
        <Card className="shadow-sm rounded-[32px] overflow-hidden bg-card p-8">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">{t('classroom.ui.class_size_title')}</h3>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-bold text-foreground tracking-tighter">
              {members.filter(m => m.role === 'student').length}
            </span>
            <span className="text-muted-foreground font-bold text-lg">{t('classroom.ui.students_count_suffix', undefined, { count: classroom.max_students })}</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-primary-brand rounded-full shadow-[0_0_8px_rgba(79,70,229,0.3)] transition-all duration-1000"
              style={{ width: `${classroom.max_students > 0 ? Math.min(100, (members.filter(m => m.role === 'student').length / classroom.max_students) * 100) : 0}%` }}
            />
          </div>
        </Card>

        <Card className="shadow-xl rounded-[32px] overflow-hidden bg-gradient-to-br from-primary-brand to-primary-brand-dark text-white p-8 relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <QrCode size={140} />
          </div>
          <div className="relative">
            <h3 className="text-[10px] font-bold text-primary-brand-muted uppercase tracking-[0.3em] mb-4">{t('classroom.ui.join_code_title')}</h3>
            <div className="text-4xl font-bold tracking-[0.2em] mb-8">{linkData?.code || t('classroom.ui.join_code_fallback')}</div>
            <Button
              variant="ghost"
              onClick={onDownloadQr}
              className="w-full bg-card/10 hover:bg-card/20 backdrop-blur-md text-white rounded-2xl h-12 font-bold text-xs tracking-widest gap-3 transition-all uppercase"
            >
              <QrCode size={18} /> {t('classroom.ui.download_qr_action')}
            </Button>
          </div>
        </Card>
      </>}
    </div>
  );
}
