import BaseRestApiClient from './client';

export type SearchResultItem = {
  id: string;
  collection: string;
  entity_id: string;
  title: string;
  snippet: string;
  score: number;
  // extra fields
  status?: string;
  role?: string;
  pid?: string;
  exam_type?: string;
  file_type?: string;
  teacher_id?: string;
  classroom_id?: string;
  [key: string]: unknown;
};

type SearchCollectionResult = {
  total_hits: number;
  results: SearchResultItem[];
  facets?: Record<string, unknown> | null;
  error?: string;
};

export type SearchResponse = {
  classroom?: SearchCollectionResult;
  exam?: SearchCollectionResult;
  quiz?: SearchCollectionResult;
  consumer?: SearchCollectionResult;
  resource?: SearchCollectionResult;
};

type SearchType = 'classroom' | 'exam' | 'quiz' | 'consumer' | 'resource';

class SearchApiClient extends BaseRestApiClient {
  async search(
    q: string,
    types: SearchType[] = ['classroom', 'exam', 'quiz', 'consumer'],
    options: { limit?: number; offset?: number; classroom_id?: string } = {},
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({ q, types: types.join(',') });
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));
    if (options.classroom_id) params.set('classroom_id', options.classroom_id);
    return this.get<SearchResponse>(`/api/v1/space/search/?${params}`);
  }
}

export const searchApi = new SearchApiClient();
