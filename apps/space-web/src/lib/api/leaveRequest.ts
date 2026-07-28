import BaseRestApiClient from './client';
import { leaveRequestApiService } from '@shared/lib/api/leaveRequestApi';
import {
  LeaveRequest,
  ListLeaveRequestsParams,
  ProcessLeaveRequestInput,
} from '@shared/lib/api/leaveRequest';

class SpaceLeaveRequestApiClient extends BaseRestApiClient {
  public async list(params: ListLeaveRequestsParams = {}): Promise<LeaveRequest[]> {
    return leaveRequestApiService.list('space', params);
  }

  public async retrieve(uid: string): Promise<LeaveRequest> {
    return leaveRequestApiService.retrieve('space', uid);
  }

  public async process(uid: string, input: ProcessLeaveRequestInput): Promise<LeaveRequest> {
    return leaveRequestApiService.process(uid, input);
  }
}

export const spaceLeaveRequestApi = new SpaceLeaveRequestApiClient();
