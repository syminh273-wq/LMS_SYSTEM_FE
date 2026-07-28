export type CalendarEventType = 'class' | 'exam' | 'deadline' | 'study_session';

export type CalendarEventColor =
  | 'indigo'
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'slate';

export interface CalendarEvent {
  uid: string;
  type: CalendarEventType;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  classroom_id?: string | null;
  classroom_name?: string | null;
  color: CalendarEventColor;
  space_id: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCalendarEventRequest {
  type: CalendarEventType;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  classroom_id?: string | null;
}

export type UpdateCalendarEventRequest = Partial<CreateCalendarEventRequest>;

export interface ListCalendarEventsParams {
  startDate?: string;
  endDate?: string;
  classroomId?: string;
  type?: CalendarEventType;
}

export const CALENDAR_TYPE_COLORS: Record<CalendarEventType, CalendarEventColor> = {
  class: 'indigo',
  exam: 'rose',
  deadline: 'amber',
  study_session: 'emerald',
};
