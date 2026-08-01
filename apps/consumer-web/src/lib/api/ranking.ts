import AbstractRestApiClient from './client';
import type {
  RankingProfile,
  XpTransaction,
  Achievement,
  GlobalLeaderboardResponse,
  MyRankResponse,
  LevelsResponse,
  AchievementsCatalogResponse,
  LeaderboardPeriod,
} from './types';

class RankingApiClient extends AbstractRestApiClient {
  constructor() {
    super();
  }

  public async getMyProfile(): Promise<RankingProfile> {
    return this.get<RankingProfile>('/api/v1/consumer/ranking/me/');
  }

  public async getMyTransactions(params: {
    limit?: number;
    event_type?: string;
    classroom_id?: string;
  } = {}): Promise<XpTransaction[]> {
    const q = new URLSearchParams();
    if (params.limit) q.set('limit', String(params.limit));
    if (params.event_type) q.set('event_type', params.event_type);
    if (params.classroom_id) q.set('classroom_id', params.classroom_id);
    const qs = q.toString();
    return this.get<XpTransaction[]>(
      `/api/v1/consumer/ranking/me/transactions/${qs ? `?${qs}` : ''}`
    );
  }

  public async getMyAchievements(): Promise<Achievement[]> {
    return this.get<Achievement[]>('/api/v1/consumer/ranking/me/achievements/');
  }

  public async getMyRank(period: LeaderboardPeriod = 'all'): Promise<MyRankResponse> {
    return this.get<MyRankResponse>(
      `/api/v1/consumer/ranking/me/leaderboard/?period=${period}`
    );
  }

  public async getGlobalLeaderboard(params: {
    limit?: number;
    period?: LeaderboardPeriod;
  } = {}): Promise<GlobalLeaderboardResponse> {
    const q = new URLSearchParams();
    if (params.limit) q.set('limit', String(params.limit));
    if (params.period) q.set('period', params.period);
    const qs = q.toString();
    return this.get<GlobalLeaderboardResponse>(
      `/api/v1/consumer/ranking/leaderboard/${qs ? `?${qs}` : ''}`
    );
  }

  public async getLevels(): Promise<LevelsResponse> {
    return this.get<LevelsResponse>('/api/v1/consumer/ranking/levels/');
  }

  public async getAchievementsCatalog(): Promise<AchievementsCatalogResponse> {
    return this.get<AchievementsCatalogResponse>('/api/v1/consumer/ranking/achievements/catalog/');
  }
}

export const rankingApi = new RankingApiClient();
