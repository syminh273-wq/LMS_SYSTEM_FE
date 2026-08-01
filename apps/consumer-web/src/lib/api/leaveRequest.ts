import AbstractRestApiClient from './client';
import { leaveRequestApiService } from '@shared/lib/api/leaveRequestApi';
import {
  CreateLeaveRequestInput,
  LeaveRequest,
  ListLeaveRequestsParams,
  ProcessLeaveRequestInput,
} from '@shared/lib/api/leaveRequest';

class ConsumerLeaveRequestApiClient extends AbstractRestApiClient {
  public async list(params: ListLeaveRequestsParams = {}): Promise<LeaveRequest[]> {
    return leaveRequestApiService.list('consumer', params);
  }

  public async retrieve(uid: string): Promise<LeaveRequest> {
    return leaveRequestApiService.retrieve('consumer', uid);
  }

  public async create(input: CreateLeaveRequestInput): Promise<LeaveRequest> {
    return leaveRequestApiService.create('consumer', input);
  }

  public async cancel(uid: string): Promise<LeaveRequest> {
    return leaveRequestApiService.cancel(uid);
  }
}

export const consumerLeaveRequestApi = new ConsumerLeaveRequestApiClient();
