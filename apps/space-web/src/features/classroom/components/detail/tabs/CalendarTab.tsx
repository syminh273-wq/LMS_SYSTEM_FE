import * as React from 'react';
import { ClassroomCalendarTab } from '@/components/calendar/ClassroomCalendarTab';

interface CalendarTabProps {
  classroomUid: string;
  classroomName: string | undefined;
}

export default function CalendarTab({
  classroomUid,
  classroomName,
}: CalendarTabProps) {
  return (
    <div className="animate-in fade-in duration-300 bg-card rounded-3xl shadow-sm p-6 sm:p-8">
      <ClassroomCalendarTab classroomUid={classroomUid} classroomName={classroomName} />
    </div>
  );
}
