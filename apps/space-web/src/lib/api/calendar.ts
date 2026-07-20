import BaseRestApiClient from './client';
import {
  CalendarEvent,
  CreateCalendarEventRequest,
  ListCalendarEventsParams,
  UpdateCalendarEventRequest,
} from '@shared/lib/api/calendar';
import type { RecurringSchedulePayload } from '@shared/components/calendar/RecurringScheduleDialog';

export interface RecurringScheduleResult {
  created: number;
  failed: number;
  event_uids: string[];
}

function buildQuery(params: ListCalendarEventsParams = {}): string {
  const search = new URLSearchParams();
  if (params.startDate) search.set('start_date', params.startDate);
  if (params.endDate) search.set('end_date', params.endDate);
  if (params.classroomId) search.set('classroom_id', params.classroomId);
  if (params.type) search.set('type', params.type);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export class CalendarApiClient extends BaseRestApiClient {
  public async list(params: ListCalendarEventsParams = {}): Promise<CalendarEvent[]> {
    return this.get<CalendarEvent[]>(`/api/v1/space/calendar/events/${buildQuery(params)}`);
  }

  public async retrieve(uid: string): Promise<CalendarEvent> {
    return this.get<CalendarEvent>(`/api/v1/space/calendar/events/${uid}/`);
  }

  public async create(payload: CreateCalendarEventRequest): Promise<CalendarEvent> {
    return this.post<CalendarEvent>('/api/v1/space/calendar/events/', payload);
  }

  public async createRecurring(payload: RecurringSchedulePayload): Promise<RecurringScheduleResult> {
    return this.post<RecurringScheduleResult>('/api/v1/space/calendar/recurring-schedules/', payload);
  }

  public async update(uid: string, payload: UpdateCalendarEventRequest): Promise<CalendarEvent> {
    return this.put<CalendarEvent>(`/api/v1/space/calendar/events/${uid}/`, payload);
  }

  public async delete<TResponse = any>(uid: string, options?: RequestInit): Promise<TResponse> {
    return super.delete<TResponse>(`/api/v1/space/calendar/events/${uid}/`, options);
  }
}

export const calendarApi = new CalendarApiClient();
