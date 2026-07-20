import BaseRestApiClient from './client';
import {
  CalendarEvent,
  ListCalendarEventsParams,
} from '@shared/lib/api/calendar';

function buildQuery(params: ListCalendarEventsParams = {}): string {
  const search = new URLSearchParams();
  if (params.startDate) search.set('start_date', params.startDate);
  if (params.endDate) search.set('end_date', params.endDate);
  if (params.classroomId) search.set('classroom_id', params.classroomId);
  if (params.type) search.set('type', params.type);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export class ConsumerCalendarApiClient extends BaseRestApiClient {
  public async list(params: ListCalendarEventsParams = {}): Promise<CalendarEvent[]> {
    return this.get<CalendarEvent[]>(`/api/v1/consumer/calendar/events/${buildQuery(params)}`);
  }

  public async retrieve(uid: string): Promise<CalendarEvent> {
    return this.get<CalendarEvent>(`/api/v1/consumer/calendar/events/${uid}/`);
  }
}

export const consumerCalendarApi = new ConsumerCalendarApiClient();
