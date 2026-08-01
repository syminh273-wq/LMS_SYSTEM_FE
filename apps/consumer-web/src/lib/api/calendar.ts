import AbstractRestApiClient from './client';
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

class ConsumerCalendarApiClient extends AbstractRestApiClient {
  public async list(params: ListCalendarEventsParams = {}): Promise<CalendarEvent[]> {
    return this.get<CalendarEvent[]>(`/api/v1/consumer/calendar/events/${buildQuery(params)}`);
  }
}

export const consumerCalendarApi = new ConsumerCalendarApiClient();
