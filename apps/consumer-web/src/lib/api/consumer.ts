import BaseRestApiClient from './client';
import type { 
  Consumer, 
  CreateConsumerRequest, 
  UpdateConsumerRequest 
} from './types';

export class ConsumerApiClient extends BaseRestApiClient {
  constructor() {
    super();
  }

  public async list(): Promise<Consumer[]> {
    return this.get<Consumer[]>('/api/v1/consumer/account/consumers/');
  }

  public async me(): Promise<Consumer> {
    return this.get<Consumer>('/api/v1/consumer/account/consumers/me/');
  }

  public async create(data: CreateConsumerRequest): Promise<Consumer> {
    return this.post<Consumer>('/api/v1/consumer/account/consumers/', data);
  }

  public async retrieve(uid: string): Promise<Consumer> {
    return this.get<Consumer>(`/api/v1/consumer/account/consumers/${uid}/`);
  }

  public async update(uid: string, data: UpdateConsumerRequest): Promise<Consumer> {
    return this.put<Consumer>(`/api/v1/consumer/account/consumers/${uid}/`, data);
  }

  public async deleteConsumer(uid: string): Promise<void> {
    return this.delete<void>(`/api/v1/consumer/account/consumers/${uid}/`);
  }

  public async deactivate(uid: string): Promise<Consumer> {
    return this.patch<Consumer>(`/api/v1/consumer/account/consumers/${uid}/deactivate/`);
  }
}

export const consumerApi = new ConsumerApiClient();
