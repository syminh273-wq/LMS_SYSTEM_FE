import BaseRestApiClient from './base-rest-api-client';

export interface GenericCrudApiClientConfig {
  basePath: string;
  resourceName: string;
  raiseErrorWhenFail?: boolean;
  headers?: Record<string, string>;
  redirectPath?: string;
}

export class GenericCrudApiClient<
  TEntity = any,
  TCreateRequest = any,
  TUpdateRequest = any,
  TListResponse = any
> extends BaseRestApiClient {
  protected config: GenericCrudApiClientConfig;

  constructor(config: GenericCrudApiClientConfig) {
    super({ redirectPath: config.redirectPath });
    this.config = config;

    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        this.setHeader(key, value);
      });
    }
  }

  public setHeader(headerKey: string, headerValue: string) {
    // Headers are managed per-request in this implementation
  }

  protected getResourcePath(uid?: string): string {
    return uid
      ? `${this.config.basePath}/${this.config.resourceName}/${uid}/`
      : `${this.config.basePath}/${this.config.resourceName}/`;
  }

  public async getDetail(uid: string): Promise<TEntity> {
    return this.get<TEntity>(this.getResourcePath(uid));
  }

  public async getList(query?: Record<string, any>): Promise<TListResponse> {
    const qs = query
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(query).filter(([, v]) => v !== undefined && v !== null)
          )
        ).toString()
      : '';
    return this.get<TListResponse>(`${this.getResourcePath()}${qs}`);
  }

  private hasFileUpload(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    return Object.values(data).some(
      (value) => value instanceof File || (value instanceof FileList && value.length > 0)
    );
  }

  public async createEntity(data: TCreateRequest): Promise<TEntity> {
    const hasFile = this.hasFileUpload(data);

    if (hasFile) {
      return this.post<TEntity>(this.getResourcePath(), data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return this.post<TEntity>(this.getResourcePath(), data);
  }

  public async updateEntity(uid: string, data: TUpdateRequest): Promise<TEntity> {
    const hasFile = this.hasFileUpload(data);

    if (hasFile) {
      return this.patch<TEntity>(this.getResourcePath(uid), data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return this.patch<TEntity>(this.getResourcePath(uid), data);
  }

  public async deleteEntity(uid: string): Promise<void> {
    return this.delete<void>(this.getResourcePath(uid));
  }
}
