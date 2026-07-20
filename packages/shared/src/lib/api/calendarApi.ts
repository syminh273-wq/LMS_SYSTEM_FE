import BaseRestApiClient from './client';
import {
  CalendarEvent,
  CreateCalendarEventRequest,
  ListCalendarEventsParams,
  UpdateCalendarEventRequest,
} from './calendar';

function buildQuery(params: ListCalendarEventsParams = {}): string {
  const search = new URLSearchParams();
  if (params.startDate) search.set('start_date', params.startDate);
  if (params.endDate) search.set('end_date', params.endDate);
  if (params.classroomId) search.set('classroom_id', params.classroomId);
  if (params.type) search.set('type', params.type);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

class CalendarApiService extends BaseRestApiClient {
  constructor() {
    super();
  }

  public async list(base: 'space' | 'consumer', params: ListCalendarEventsParams = {}): Promise<CalendarEvent[]> {
    return this.get<CalendarEvent[]>(`/api/v1/${base}/calendar/events/${buildQuery(params)}`);
  }

  public async retrieve(base: 'space' | 'consumer', uid: string): Promise<CalendarEvent> {
    return this.get<CalendarEvent>(`/api/v1/${base}/calendar/events/${uid}/`);
  }

  public async create(payload: CreateCalendarEventRequest): Promise<CalendarEvent> {
    return this.post<CalendarEvent>('/api/v1/space/calendar/events/', payload);
  }

  public async update(uid: string, payload: UpdateCalendarEventRequest): Promise<CalendarEvent> {
    return this.put<CalendarEvent>(`/api/v1/space/calendar/events/${uid}/`, payload);
  }

  public async delete(uid: string): Promise<void> {
    return super.delete(`/api/v1/space/calendar/events/${uid}/`);
  }
}

export const calendarApiService = new CalendarApiService();
