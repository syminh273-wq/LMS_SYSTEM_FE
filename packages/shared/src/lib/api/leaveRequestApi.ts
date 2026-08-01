import AbstractRestApiClient from './client';
import {
  CreateLeaveRequestInput,
  LeaveRequest,
  ListLeaveRequestsParams,
  ProcessLeaveRequestInput,
} from './leaveRequest';

function buildQuery(params: ListLeaveRequestsParams = {}): string {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.student_id) search.set('student_id', params.student_id);
  if (params.classroom_id) search.set('classroom_id', params.classroom_id);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function toFormData(input: CreateLeaveRequestInput): FormData {
  const fd = new FormData();
  if (input.event_id) fd.set('event_id', input.event_id);
  if (input.classroom_id) fd.set('classroom_id', input.classroom_id);
  if (input.start_date) fd.set('start_date', input.start_date);
  if (input.end_date) fd.set('end_date', input.end_date);
  fd.set('reason', input.reason);
  if (input.evidence) fd.set('evidence', input.evidence);
  return fd;
}

class LeaveRequestApiService extends AbstractRestApiClient {
  public async list(
    base: 'space' | 'consumer',
    params: ListLeaveRequestsParams = {}
  ): Promise<LeaveRequest[]> {
    return this.get<LeaveRequest[]>(
      `/api/v1/${base}/calendar/leave-requests/${buildQuery(params)}`
    );
  }

  public async create(
    base: 'consumer',
    input: CreateLeaveRequestInput
  ): Promise<LeaveRequest> {
    const body = toFormData(input);
    return this.post<LeaveRequest>('/api/v1/consumer/calendar/leave-requests/', body);
  }

  public async cancel(uid: string): Promise<LeaveRequest> {
    return this.post<LeaveRequest>(`/api/v1/consumer/calendar/leave-requests/${uid}/cancel/`);
  }

  public async process(
    uid: string,
    input: ProcessLeaveRequestInput
  ): Promise<LeaveRequest> {
    return this.post<LeaveRequest>(
      `/api/v1/space/calendar/leave-requests/${uid}/process/`,
      input
    );
  }
}

export const leaveRequestApiService = new LeaveRequestApiService();
