'use client';

import * as React from 'react';
import { use, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { renderToStaticMarkup } from 'react-dom/server';
import { toast } from 'sonner';

import { useRTC } from '@/lib/hooks/use-rtc';
import { useTranslation } from '@shared/components/LocaleProvider';
import { spaceApi } from '@/lib/api';
import type { ClassroomMemberProps } from '@/lib/api/types';
import { useClassroomCore } from '@/features/classroom/hooks/detail/useClassroomCore';
import { usePendingMembers } from '@/features/classroom/hooks/detail/usePendingMembers';
import { useApprovePendingMember } from '@/features/classroom/hooks/detail/useApprovePendingMember';
import { useRejectPendingMember } from '@/features/classroom/hooks/detail/useRejectPendingMember';
import { useMeetingRooms } from '@/features/classroom/hooks/detail/useMeetingRooms';
import { useStartMeeting } from '@/features/classroom/hooks/detail/useStartMeeting';
import { useEndMeeting } from '@/features/classroom/hooks/detail/useEndMeeting';

import Header from '@/features/classroom/components/detail/shell/Header';
import Sidebar from '@/features/classroom/components/detail/shell/Sidebar';

import InfoTab from '@/features/classroom/components/detail/tabs/InfoTab';
import DocsTab from '@/features/classroom/components/detail/tabs/DocsTab';
import AITab from '@/features/classroom/components/detail/tabs/AITab';
import ChatTab from '@/features/classroom/components/detail/tabs/ChatTab';
import MeetingTab from '@/features/classroom/components/detail/tabs/MeetingTab';
import CalendarTab from '@/features/classroom/components/detail/tabs/CalendarTab';
import LeaveRequestTabView from '@/features/classroom/components/detail/tabs/LeaveRequestTabView';
import ExamsTab from '@/features/classroom/components/detail/tabs/ExamsTab';
import AssignmentsTab from '@/features/classroom/components/detail/tabs/AssignmentsTab';
import FinalExamsTab from '@/features/classroom/components/detail/tabs/FinalExamsTab';
import QuizTab from '@/features/classroom/components/detail/tabs/QuizTab';
import BlacklistTab from '@/features/classroom/components/detail/tabs/BlacklistTab';
import RankingTab from '@/features/classroom/components/detail/tabs/RankingTab';
import StudentsTab from '@/features/classroom/components/detail/tabs/StudentsTab';

import PendingSheet from '@/features/classroom/components/detail/modals/PendingSheet';

interface ClassroomDetailsPageProps {
  params: Promise<{ uid: string }>;
}

export default function ClassroomDetailsPage({ params }: ClassroomDetailsPageProps) {
  const { uid } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t: rawT, formatDateTime: localeFormatDateTime, formatDate: localeFormatDate } = useTranslation();
  // Wrapper tương thích với tab/modal prop signature
  // (vars?: Record<string, unknown>) — LocaleProvider dùng Record<string, string | number>
  const t = React.useCallback(
    (key: string, fallback?: string, vars?: Record<string, unknown>) =>
      rawT(key, fallback, vars as Record<string, string | number> | undefined),
    [rawT],
  );
  const formatDateTime = React.useCallback((v: string) => (v ? localeFormatDateTime(v) : '--'), [localeFormatDateTime]);
  const formatDate = React.useCallback((v: string | null | undefined) => (v ? localeFormatDate(v) : '--'), [localeFormatDate]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const isTeacher = typeof window !== 'undefined' && (localStorage.getItem('userType') === 'space' || localStorage.getItem('role') === 'teacher');

  // Sidebar UI state (giữ local vì chỉ dùng ở đây)
  const [openGroups, setOpenGroups] = useState({ classroom: true, learning: true, students: true });
  const toggleGroup = (key: 'classroom' | 'learning' | 'students') =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Core (classroom, linkData, activeTab, canManageExams, goToTab, selectedExamKind, ...)
  const core = useClassroomCore({ uid, searchParams, pathname, router, t });

  // Sidebar badge: lightweight independent student-count fetch (full member list + kick/block
  // now lives only inside StudentsTab's own useClassroomMembers() call).
  const [studentCount, setStudentCount] = useState(0);
  const fetchStudentCount = useCallback(() => {
    spaceApi.classrooms.getClassroomMembers(uid)
      .then((list) => setStudentCount(list.filter((m) => m.role === 'student').length))
      .catch(() => {/* silently fail for sidebar count */});
  }, [uid]);
  useEffect(() => { fetchStudentCount(); }, [fetchStudentCount]);

  // Sidebar badge: lightweight independent blacklist-count fetch (full list + unblock now lives
  // only inside BlacklistTab's own useClassroomBlacklist() call).
  const [blacklistCount, setBlacklistCount] = useState(0);
  const fetchBlacklistCount = useCallback(() => {
    Promise.all([
      spaceApi.classrooms.getClassroomBlacklist(uid),
      spaceApi.classrooms.getGlobalBlacklist(),
    ])
      .then(([classroomEntries, globalEntries]) => {
        const map = new Map<string, typeof classroomEntries[0]>();
        for (const e of classroomEntries) map.set(e.consumer_uid, e);
        for (const e of globalEntries) map.set(e.consumer_uid, e);
        setBlacklistCount(map.size);
      })
      .catch(() => {/* silently fail for sidebar count */});
  }, [uid]);
  useEffect(() => { fetchBlacklistCount(); }, [fetchBlacklistCount]);

  // Pending members (join requests) — Header's badge/button and PendingSheet can be opened from
  // any tab, so this stays at page level rather than living inside StudentsTab.
  const pendingQuery = usePendingMembers({ uid, t });
  const { approveMember, approvingId } = useApprovePendingMember({ uid, t });
  const { rejectMember, rejectingId } = useRejectPendingMember({ uid, t });
  const [showPendingSheet, setShowPendingSheet] = useState(false);

  const handleApproveMember = useCallback(async (member: ClassroomMemberProps) => {
    const ok = await approveMember(member);
    if (ok) {
      pendingQuery.setPendingMembers((prev) => prev.filter((m) => m.member_id !== member.member_id));
      fetchStudentCount();
    }
  }, [approveMember, pendingQuery, fetchStudentCount]);

  const handleRejectMember = useCallback(async (member: ClassroomMemberProps) => {
    const ok = await rejectMember(member);
    if (ok) {
      pendingQuery.setPendingMembers((prev) => prev.filter((m) => m.member_id !== member.member_id));
    }
  }, [rejectMember, pendingQuery]);

  const handleApproveAll = useCallback(async () => {
    for (const member of pendingQuery.pendingMembers) {
      await handleApproveMember(member);
    }
  }, [pendingQuery.pendingMembers, handleApproveMember]);

  // Meetings: query tách riêng khỏi start/end mutation; orchestration (RTC media share) ở page level
  const meetingsQuery = useMeetingRooms({ uid, activeTab: core.activeTab, t });
  const { startMeeting, starting } = useStartMeeting({ uid, t });
  const { endMeeting, ending } = useEndMeeting({ t });
  const meetingAction: 'start' | 'end' | null = starting ? 'start' : ending ? 'end' : null;

  // Single RTC instance keyed by the active meeting's uid — media capture
  // (startMediaShare) and the WebSocket frame relay MUST share one instance,
  // otherwise frames get captured on one connection and sent nowhere because
  // the socket that's actually open belongs to a different instance.
  const rtc = useRTC(meetingsQuery.activeMeeting?.uid ?? null);
  const { localStream, remoteFrame, localSource, isConnected: rtcConnected, startMediaShare, stopMediaShare, stopScreenShare, toggleCamera } = rtc;

  const handleStartMeeting = useCallback(async (source: 'screen' | 'camera') => {
    if (!core.classroom || meetingAction) return;
    try {
      const room = await startMeeting(core.classroom, meetingsQuery.activeMeeting);
      if (!room) return;
      meetingsQuery.setMeetingRooms((prev) => [room, ...prev.filter((item) => item.uid !== room.uid)]);
      await startMediaShare(source);
      toast.success(source === 'screen' ? t('classroom.ui.meeting_start_success_screen') : t('classroom.ui.meeting_start_success_camera'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.meeting_start_error'));
    }
  }, [core.classroom, meetingAction, startMeeting, meetingsQuery, startMediaShare, t]);

  const handleEndMeeting = useCallback(async () => {
    if (!meetingsQuery.activeMeeting || meetingAction) return;
    stopScreenShare();
    const ended = await endMeeting(meetingsQuery.activeMeeting.uid);
    if (!ended) return;
    meetingsQuery.setMeetingRooms((prev) => prev.map((room) => (room.uid === ended.uid ? ended : room)));
    toast.success(t('classroom.ui.meeting_ended_toast'));
  }, [meetingsQuery, meetingAction, stopScreenShare, endMeeting, t]);

  // RTC peer-joined: auto-start camera when a new consumer peer joins active meeting
  useEffect(() => {
    const onPeerJoined = (event: Event) => {
      const peer = (event as CustomEvent<{ user_type?: string }>).detail;
      if (!peer || !meetingsQuery.activeMeeting) return;
      if (peer.user_type !== 'consumer') return;
      if (!localStream) {
        void startMediaShare('camera').catch((err) => {
          console.warn('[space] auto-start camera for new peer failed:', err);
        });
      }
    };
    window.addEventListener('rtc:peer-joined', onPeerJoined);
    return () => window.removeEventListener('rtc:peer-joined', onPeerJoined);
  }, [meetingsQuery.activeMeeting, localStream, startMediaShare]);

  // Handler: download QR code as PNG (copy nguyên từ file gốc)
  const handleDownloadQr = useCallback(() => {
    if (!core.linkData || !core.classroom) return;

    try {
      toast.info(t('classroom.messages.creating_qr'));
      const joinUrl = `${window.location.origin.replace('3003', '3000')}/join/${core.linkData.code}`;

      let svgString = renderToStaticMarkup(
        <QRCodeSVG
          value={joinUrl}
          size={400}
          level="H"
          includeMargin={true}
        />,
      );

      if (!svgString.includes('xmlns=')) {
        svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = 500;
        canvas.height = 500;
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 50, 50, 400, 400);

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `QR_Lop_${core.classroom!.name}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          toast.success(t('classroom.messages.qr_downloaded'));
        }
        URL.revokeObjectURL(blobUrl);
      };

      img.onerror = () => {
        toast.error(t('classroom.ui.qr_error_generic'));
        URL.revokeObjectURL(blobUrl);
      };

      img.src = blobUrl;
    } catch {
      toast.error(t('classroom.ui.qr_download_error'));
    }
  }, [core.linkData, core.classroom, t]);

  // Fetching guard
  if (core.fetching && !core.classroom) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="text-sm font-medium">{t('classroom.ui.classroom_loading')}</p>
      </div>
    );
  }

  if (!core.classroom) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header / Navigation */}
      <Header
        classroom={core.classroom}
        pendingMembersCount={pendingQuery.pendingMembers.length}
        onOpenPendingSheet={() => setShowPendingSheet(true)}
        onLoadPendingMembers={pendingQuery.loadPendingMembers}
        router={router}
        t={t}
      />

      {/* Main Layout */}
      <div className="flex gap-8 items-start">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={core.activeTab}
          goToTab={core.goToTab}
          openGroups={openGroups}
          toggleGroup={toggleGroup}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          studentCount={studentCount}
          blacklistCount={blacklistCount}
          activeMeeting={meetingsQuery.activeMeeting}
          classroom={core.classroom}
          linkData={core.linkData}
          onDownloadQr={handleDownloadQr}
          t={t}
        />

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* /details?tab=info */}
          {core.activeTab === 'info' && (
            <InfoTab
              classroom={core.classroom}
              linkData={core.linkData}
              formatDateTime={formatDateTime}
              onDownloadQr={handleDownloadQr}
              router={router}
              uid={uid}
              t={t}
            />
          )}

          {/* /details?tab=docs */}
          {core.activeTab === 'docs' && (
            <DocsTab
              classroomUid={uid}
              apiBase={apiBase}
              isTeacher={isTeacher}
              t={t}
            />
          )}

          {/* /details?tab=ai */}
          {core.activeTab === 'ai' && (
            <AITab
              uid={uid}
              formatDate={formatDate}
              t={t}
            />
          )}

          {/* /details?tab=chat */}
          {core.activeTab === 'chat' && (
            <ChatTab
              classroomUid={uid}
              t={t}
            />
          )}

          {/* /details?tab=meeting */}
          {core.activeTab === 'meeting' && (
            <MeetingTab
              activeMeeting={meetingsQuery.activeMeeting}
              latestMeeting={meetingsQuery.meetingRooms[0] ?? null}
              meetingRooms={meetingsQuery.meetingRooms}
              loadingMeetings={meetingsQuery.loadingMeetings}
              meetingAction={meetingAction}
              localStream={localStream}
              remoteFrame={remoteFrame}
              localSource={localSource}
              rtcConnected={rtcConnected}
              handleStartMeeting={handleStartMeeting}
              handleEndMeeting={handleEndMeeting}
              stopMediaShare={stopMediaShare}
              toggleCamera={toggleCamera}
              formatDateTime={formatDateTime}
              t={t}
            />
          )}

          {/* /details?tab=calendar */}
          {core.activeTab === 'calendar' && (
            <CalendarTab
              classroomUid={uid}
              classroomName={core.classroom.name}
            />
          )}

          {/* /details?tab=assignments */}
          {core.activeTab === 'assignments' && (
            <AssignmentsTab
              canManageExams={core.canManageExams}
              formatDateTime={formatDateTime}
              formatDate={formatDate}
              router={router}
              classroomUid={uid}
              t={t}
            />
          )}

          {/* /details?tab=exams */}
          {core.activeTab === 'exams' && (
            <ExamsTab
              canManageExams={core.canManageExams}
              selectedExamKind={core.selectedExamKind}
              goToExamKind={core.goToExamKind}
              formatDateTime={formatDateTime}
              formatDate={formatDate}
              router={router}
              classroomUid={uid}
              t={t}
            />
          )}

          {/* /details?tab=final_exams */}
          {core.activeTab === 'final_exams' && (
            <FinalExamsTab
              formatDateTime={formatDateTime}
              router={router}
              classroomUid={uid}
              t={t}
            />
          )}

          {/* /details?tab=quiz */}
          {core.activeTab === 'quiz' && (
            <QuizTab
              uid={uid}
              router={router}
              t={t}
            />
          )}

          {/* /details?tab=students */}
          {core.activeTab === 'students' && (
            <StudentsTab
              formatDateTime={formatDateTime}
              router={router}
              classroomUid={uid}
              maxStudents={core.classroom.max_students}
              t={t}
              onMembersChanged={fetchStudentCount}
            />
          )}

          {/* /details?tab=blacklist */}
          {core.activeTab === 'blacklist' && (
            <BlacklistTab
              formatDate={formatDate}
              classroomUid={uid}
              t={t}
              onBlacklistChanged={fetchBlacklistCount}
            />
          )}

          {/* /details?tab=ranking */}
          {core.activeTab === 'ranking' && (
            <RankingTab
              classroomUid={uid}
              t={t}
            />
          )}

          {/* /details?tab=leave_request */}
          {core.activeTab === 'leave_request' && (
            <LeaveRequestTabView
              classroomUid={uid}
              classroomName={core.classroom.name}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <PendingSheet
        open={showPendingSheet}
        onClose={() => setShowPendingSheet(false)}
        pendingMembers={pendingQuery.pendingMembers}
        loadingPending={pendingQuery.loadingPending}
        approvingId={approvingId}
        rejectingId={rejectingId}
        onApproveMember={handleApproveMember}
        onRejectMember={handleRejectMember}
        onApproveAll={handleApproveAll}
        onRefresh={pendingQuery.loadPendingMembers}
        formatDateTime={formatDateTime}
        t={t}
      />
    </div>
  );
}
