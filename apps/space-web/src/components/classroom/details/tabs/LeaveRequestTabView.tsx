import * as React from 'react';
import { LeaveRequestTab } from '@shared/components/leave-request';
import { spaceLeaveRequestApi, calendarApi as spaceCalendarApi } from '@/lib/api';

interface LeaveRequestTabViewProps {
  classroomUid: string;
  classroomName: string | undefined;
}

export default function LeaveRequestTabView({
  classroomUid,
  classroomName,
}: LeaveRequestTabViewProps) {
  return (
    <div className="animate-in fade-in duration-300 bg-card rounded-3xl shadow-sm p-6 sm:p-8">
      <LeaveRequestTab
        role="teacher"
        classroomId={classroomUid}
        classroomName={classroomName}
        api={{
          list: (params) => spaceLeaveRequestApi.list({ classroom_id: params.classroom_id, status: params.status }),
          process: (lrUid, input) => spaceLeaveRequestApi.process(lrUid, input),
        }}
        listEvents={async () => {
          const now = new Date();
          const start = new Date(now);
          start.setDate(start.getDate() - 7);
          const end = new Date(now);
          end.setDate(end.getDate() + 60);
          const data = await spaceCalendarApi.list({
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            classroomId: classroomUid,
          });
          return (data || []).map((e) => ({
            uid: e.uid,
            title: e.title,
            start_time: e.start_time,
            end_time: e.end_time,
            classroom_name: e.classroom_name ?? null,
          }));
        }}
        canCreate={false}
      />
    </div>
  );
}
