'use client';

import * as React from 'react';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { renderToStaticMarkup } from 'react-dom/server';
import { toast } from 'sonner';

import { useRTC } from '@/lib/hooks/use-rtc';
import { useTranslation } from '@shared/components/LocaleProvider';
import { spaceApi, userSettingsApi } from '@/lib/api';
import type { Exam } from '@/lib/api';
import { chatApi } from '@/lib/api/chat';
import QuizLeaderboardModal from '@/components/quiz/QuizLeaderboardModal';
import type { BlacklistEntry } from '@/lib/api/types';

// Hooks
import { useClassroomCore } from '@/components/classroom/details/hooks/useClassroomCore';
import { useClassroomActivity } from '@/components/classroom/details/hooks/useClassroomActivity';
import { useClassroomMembers } from '@/components/classroom/details/hooks/useClassroomMembers';
import { useClassroomBlacklist } from '@/components/classroom/details/hooks/useClassroomBlacklist';
import { useClassroomMeetings } from '@/components/classroom/details/hooks/useClassroomMeetings';
import { useClassroomExams } from '@/components/classroom/details/hooks/useClassroomExams';
import { useClassroomQuizzes } from '@/components/classroom/details/hooks/useClassroomQuizzes';
import { useClassroomAI } from '@/components/classroom/details/hooks/useClassroomAI';

// Shell
import Header from '@/components/classroom/details/shell/Header';
import Sidebar from '@/components/classroom/details/shell/Sidebar';

// Tabs
import InfoTab from '@/components/classroom/details/tabs/InfoTab';
import DocsTab from '@/components/classroom/details/tabs/DocsTab';
import AITab from '@/components/classroom/details/tabs/AITab';
import ChatTab from '@/components/classroom/details/tabs/ChatTab';
import MeetingTab from '@/components/classroom/details/tabs/MeetingTab';
import CalendarTab from '@/components/classroom/details/tabs/CalendarTab';
import LeaveRequestTabView from '@/components/classroom/details/tabs/LeaveRequestTabView';
import ExamsTab from '@/components/classroom/details/tabs/ExamsTab';
import FinalExamsTab from '@/components/classroom/details/tabs/FinalExamsTab';
import QuizTab from '@/components/classroom/details/tabs/QuizTab';
import BlacklistTab from '@/components/classroom/details/tabs/BlacklistTab';
import RankingTab from '@/components/classroom/details/tabs/RankingTab';
import StudentsTab from '@/components/classroom/details/tabs/StudentsTab';

// Modals
import AssignQuizModal from '@/components/classroom/details/modals/AssignQuizModal';
import OpenOnlineExamModal from '@/components/classroom/details/modals/OpenOnlineExamModal';
import EditSettingsModal from '@/components/classroom/details/modals/EditSettingsModal';
import StudentDetailsModal from '@/components/classroom/details/modals/StudentDetailsModal';
import StudentAnalyzeModal from '@/components/classroom/details/modals/StudentAnalyzeModal';
import KickDialog from '@/components/classroom/details/modals/KickDialog';
import BlockDialog from '@/components/classroom/details/modals/BlockDialog';
import PendingSheet from '@/components/classroom/details/modals/PendingSheet';

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

  // Chat conversation state
  const [conversationUid, setConversationUid] = useState<string | null>(null);

  // Core (classroom, linkData, activeTab, canManageExams, goToTab, selectedExamKind, ...)
  const core = useClassroomCore({ uid, searchParams, pathname, router, t });

  // Activity (chỉ fetch khi vào info tab)
  const activity = useClassroomActivity({ uid, activeTab: core.activeTab });

  // Members + pending + kick/block/details/analyze state
  const members = useClassroomMembers({ uid, activeTab: core.activeTab, t });

  // Blacklist
  const blacklist = useClassroomBlacklist({ uid, activeTab: core.activeTab, t });

  // RTC instance 1: chỉ lấy function (start/stop) cho meetings hook
  // null roomUid → ws không kết nối nhưng các function vẫn sẵn sàng
  const rtcFunctions = useRTC(null);
  const { startMediaShare, stopScreenShare, stopMediaShare } = rtcFunctions;

  // Meetings: cần startMediaShare/stopScreenShare từ RTC, tính activeMeeting từ meetingRooms
  const meetings = useClassroomMeetings({
    uid,
    activeTab: core.activeTab,
    classroom: core.classroom,
    t,
    startMediaShare,
    stopScreenShare,
  });

  // RTC instance 2: dùng activeMeeting?.uid để lấy streams cho MeetingTab UI
  // Tính activeMeeting local để truyền xuống useRTC (hook tự tính bên trong nhưng
  // ta cần giá trị này NGAY để set roomUid cho ws connect).
  const localActiveMeeting = useMemo(
    () => meetings.meetingRooms.find((room) => room.status === 'active') || null,
    [meetings.meetingRooms],
  );
  const rtcStreams = useRTC(localActiveMeeting?.uid ?? null);
  const localStream = rtcStreams.localStream;
  const remoteStream = rtcStreams.remoteStream;
  const localSource = rtcStreams.localSource;
  const rtcConnected = rtcStreams.isConnected;

  // Exams
  const exams = useClassroomExams({ uid, activeTab: core.activeTab, canManageExams: core.canManageExams, t });

  // Quizzes
  const quizzes = useClassroomQuizzes({ uid, activeTab: core.activeTab, t });

  // AI
  const ai = useClassroomAI({ uid, activeTab: core.activeTab, t });

  // Load or create conversation when chat tab is opened
  useEffect(() => {
    if (core.activeTab !== 'chat' || conversationUid) return;
    chatApi
      .getConversations(uid)
      .then((convs) => {
        if (convs && convs.length > 0) {
          setConversationUid(convs[0].uid);
        } else {
          // No channel yet — create one (list endpoint auto-creates)
          return chatApi.getConversations(uid).then((created) => {
            if (created && created.length > 0) {
              setConversationUid(created[0].uid);
            }
          });
        }
      })
      .catch(() => {
        toast.error(t('classroom.messages.chat_load_error'));
      });
  }, [core.activeTab, uid, conversationUid, t]);

  // RTC peer-joined: auto-start camera when a new consumer peer joins active meeting
  useEffect(() => {
    const onPeerJoined = (event: Event) => {
      const peer = (event as CustomEvent<{ user_type?: string }>).detail;
      if (!peer || !localActiveMeeting) return;
      if (peer.user_type !== 'consumer') return;
      if (!localStream) {
        void startMediaShare('camera').catch((err) => {
          console.warn('[space] auto-start camera for new peer failed:', err);
        });
      }
    };
    window.addEventListener('rtc:peer-joined', onPeerJoined);
    return () => window.removeEventListener('rtc:peer-joined', onPeerJoined);
  }, [localActiveMeeting, localStream, startMediaShare]);

  // Handler: unblock blacklist entry
  const handleUnblock = useCallback(async (entry: BlacklistEntry) => {
    blacklist.setUnblockingId(entry.consumer_uid);
    try {
      if (entry.scope === 'global') {
        await spaceApi.classrooms.removeGlobalBlacklist(entry.consumer_uid);
      } else {
        await spaceApi.classrooms.removeClassroomBlacklist(uid, entry.consumer_uid);
      }
      // Refetch blacklist để đồng bộ với merge logic của hook
      blacklist.refetch();
      toast.success(t('classroom.ui.blacklist_unblock_success'));
    } catch {
      toast.error(t('classroom.ui.blacklist_unblock_error'));
    } finally {
      blacklist.setUnblockingId(null);
    }
  }, [blacklist, uid, t]);

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
        pendingMembersCount={members.pendingMembers.length}
        onOpenPendingSheet={() => {
          members.setShowPendingSheet(true);
        }}
        onLoadPendingMembers={members.loadPendingMembers}
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
          members={members.members}
          blacklist={blacklist.blacklist}
          activeMeeting={meetings.activeMeeting}
          classroom={core.classroom}
          linkData={core.linkData}
          onDownloadQr={handleDownloadQr}
          t={t}
        />

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-8">
          {core.activeTab === 'info' && (
            <InfoTab
              classroom={core.classroom}
              linkData={core.linkData}
              activityLogs={activity.activityLogs}
              activityLevel={activity.activityLevel}
              setActivityLevel={activity.setActivityLevel}
              loadingActivity={activity.loadingActivity}
              formatDateTime={formatDateTime}
              onDownloadQr={handleDownloadQr}
              router={router}
              uid={uid}
              t={t}
            />
          )}

          {core.activeTab === 'docs' && (
            <DocsTab
              classroomUid={uid}
              apiBase={apiBase}
              isTeacher={isTeacher}
              t={t}
            />
          )}

          {core.activeTab === 'ai' && (
            <AITab
              aiSessions={ai.aiSessions}
              aiSessionId={ai.aiSessionId}
              setAiSessionId={ai.setAiSessionId}
              aiMessages={ai.aiMessages}
              aiMode={ai.aiMode}
              setAiMode={ai.setAiMode}
              aiQuestion={ai.aiQuestion}
              setAiQuestion={ai.setAiQuestion}
              aiLoading={ai.aiLoading}
              isRecording={ai.isRecording}
              aiScrollRef={ai.aiScrollRef as React.RefObject<HTMLDivElement>}
              createNewAiSession={ai.createNewAiSession}
              clearAiSession={ai.clearAiSession}
              startRecording={ai.startRecording}
              stopRecording={ai.stopRecording}
              handleAiAsk={ai.handleAiAsk}
              userSettingsApi={userSettingsApi}
              AI_MODES={ai.AI_MODES}
              formatDate={formatDate}
              t={t}
            />
          )}

          {core.activeTab === 'chat' && (
            <ChatTab
              conversationUid={conversationUid}
              classroomUid={uid}
              activeTab={core.activeTab}
              t={t}
            />
          )}

          {core.activeTab === 'meeting' && (
            <MeetingTab
              activeMeeting={meetings.activeMeeting}
              latestMeeting={meetings.meetingRooms[0] ?? null}
              meetingRooms={meetings.meetingRooms}
              loadingMeetings={meetings.loadingMeetings}
              meetingAction={meetings.meetingAction}
              localStream={localStream}
              remoteStream={remoteStream}
              localSource={localSource}
              rtcConnected={rtcConnected}
              handleStartMeeting={meetings.handleStartMeeting}
              handleEndMeeting={meetings.handleEndMeeting}
              stopMediaShare={stopMediaShare}
              formatDateTime={formatDateTime}
              t={t}
            />
          )}

          {core.activeTab === 'calendar' && (
            <CalendarTab
              classroomUid={uid}
              classroomName={core.classroom.name}
            />
          )}

          {core.activeTab === 'exams' && (
            <ExamsTab
              exams={exams.exams}
              loadingExams={exams.loadingExams}
              canManageExams={core.canManageExams}
              selectedExamKind={core.selectedExamKind}
              goToExamKind={core.goToExamKind}
              handleDeleteExam={exams.handleDeleteExam}
              formatDateTime={formatDateTime}
              formatDate={formatDate}
              router={router}
              classroomUid={uid}
              t={t}
            />
          )}

          {core.activeTab === 'final_exams' && (
            <FinalExamsTab
              exams={exams.exams}
              examSubTab={exams.examSubTab}
              setExamSubTab={exams.setExamSubTab}
              loadingExams={exams.loadingExams}
              setShowOpenExamModal={quizzes.setShowOpenExamModal}
              handleCloseOnline={exams.handleCloseOnline}
              formatDateTime={formatDateTime}
              router={router}
              classroomUid={uid}
              t={t}
            />
          )}

          {core.activeTab === 'quiz' && (
            <QuizTab
              assignedQuizzes={quizzes.assignedQuizzes}
              loadingQuizzes={quizzes.loadingQuizzes}
              setShowAssignModal={quizzes.setShowAssignModal}
              unassigningUid={quizzes.unassigningUid}
              handleUnassignQuiz={quizzes.handleUnassignQuiz}
              setLeaderboardQuiz={quizzes.setLeaderboardQuiz}
              router={router}
              t={t}
            />
          )}

          {core.activeTab === 'students' && (
            <StudentsTab
              members={members.members}
              loadingMembers={members.loadingMembers}
              kickingId={members.kickingId}
              setMemberToKick={members.setMemberToKick}
              setMemberToBlock={members.setMemberToBlock}
              setDetailsMember={members.setDetailsMember}
              setAnalyzeMember={members.setAnalyzeMember}
              formatDateTime={formatDateTime}
              router={router}
              classroomUid={uid}
              t={t}
            />
          )}

          {core.activeTab === 'blacklist' && (
            <BlacklistTab
              blacklist={blacklist.blacklist}
              loadingBlacklist={blacklist.loadingBlacklist}
              unblockingId={blacklist.unblockingId}
              setUnblockingId={blacklist.setUnblockingId}
              setBlacklist={blacklist.setBlacklist}
              formatDate={formatDate}
              classroomUid={uid}
              t={t}
              onUnblock={handleUnblock}
            />
          )}

          {core.activeTab === 'ranking' && (
            <RankingTab
              classroomUid={uid}
              t={t}
            />
          )}

          {core.activeTab === 'leave_request' && (
            <LeaveRequestTabView
              classroomUid={uid}
              classroomName={core.classroom.name}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {quizzes.showAssignModal && (
        <AssignQuizModal
          classroomUid={uid}
          onClose={() => quizzes.setShowAssignModal(false)}
          onAssigned={() => {
            quizzes.fetchAssignedQuizzes();
            quizzes.setShowAssignModal(false);
            toast.success(t('classroom.labels.quiz_assigned_toast'));
          }}
          localAssigned={new Set(quizzes.assignedQuizzes.map((q) => q.uid))}
        />
      )}

      {quizzes.showOpenExamModal && (
        <OpenOnlineExamModal
          classroomUid={uid}
          onClose={() => quizzes.setShowOpenExamModal(false)}
          onOpened={(exam: Exam, studentCount: number) => {
            exams.fetchExams();
            quizzes.setShowOpenExamModal(false);
            core.goToTab('final_exams');
            toast.success(t('classroom.ui.exams_open_success', undefined, { count: studentCount }));
          }}
        />
      )}

      {quizzes.editingQuiz && (
        <EditSettingsModal
          quiz={quizzes.editingQuiz}
          classroomId={uid}
          onClose={() => quizzes.setEditingQuiz(null)}
          onSaved={() => {
            quizzes.fetchAssignedQuizzes();
            quizzes.setEditingQuiz(null);
            toast.success(t('classroom.labels.settings_updated_toast'));
          }}
        />
      )}

      {members.detailsMember && (
        <StudentDetailsModal
          member={members.detailsMember}
          classroomUid={uid}
          onClose={() => members.setDetailsMember(null)}
        />
      )}

      {members.analyzeMember && (
        <StudentAnalyzeModal
          member={members.analyzeMember}
          classroomUid={uid}
          onClose={() => members.setAnalyzeMember(null)}
        />
      )}

      <KickDialog
        memberToKick={members.memberToKick}
        onClose={() => members.setMemberToKick(null)}
        onConfirm={members.handleKickConfirm}
        kickingId={members.kickingId}
        t={t}
      />

      <BlockDialog
        memberToBlock={members.memberToBlock}
        onClose={() => members.setMemberToBlock(null)}
        onConfirm={members.handleBlockConfirm}
        blockingMemberId={members.blockingMemberId}
        t={t}
      />

      <PendingSheet
        open={members.showPendingSheet}
        onClose={() => members.setShowPendingSheet(false)}
        pendingMembers={members.pendingMembers}
        loadingPending={members.loadingPending}
        approvingId={members.approvingId}
        rejectingId={members.rejectingId}
        onApproveMember={members.handleApproveMember}
        onRejectMember={members.handleRejectMember}
        onApproveAll={members.handleApproveAll}
        onRefresh={members.loadPendingMembers}
        formatDateTime={formatDateTime}
        t={t}
      />

      {quizzes.leaderboardQuiz && (
        <QuizLeaderboardModal
          quizUid={quizzes.leaderboardQuiz.uid}
          classroomId={uid}
          onClose={() => quizzes.setLeaderboardQuiz(null)}
        />
      )}
    </div>
  );
}
