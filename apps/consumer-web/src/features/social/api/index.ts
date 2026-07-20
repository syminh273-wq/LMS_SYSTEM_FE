import BaseRestApiClient from '@/core/api/client';
import type { Post, PostComment, CreatePostRequest, StudentProfileSettings, PublicStudentProfile } from '@lms/types';

class SocialApiClient extends BaseRestApiClient {
  // ── Feed ────────────────────────────────────────────────────────────────────
  public async getFeed(limit = 20, before?: string): Promise<Post[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', before);
    return this.get(`/api/v1/consumer/social/feed/?${params}`);
  }

  public async getMyPosts(limit = 20, before?: string): Promise<Post[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', before);
    return this.get(`/api/v1/consumer/social/posts/mine/?${params}`);
  }

  public async getUserPosts(consumerUid: string, limit = 20): Promise<Post[]> {
    return this.get(`/api/v1/consumer/social/posts/user/${consumerUid}/?limit=${limit}`);
  }

  public async listPosts(consumerUid?: string): Promise<Post[]> {
    if (consumerUid) return this.getUserPosts(consumerUid);
    return this.getFeed();
  }

  // ── Posts ───────────────────────────────────────────────────────────────────
  public async createPost(data: CreatePostRequest): Promise<Post> {
    return this.post('/api/v1/consumer/social/posts/', data);
  }

  public async deletePost(uid: string): Promise<void> {
    return super.delete(`/api/v1/consumer/social/posts/${uid}/`);
  }

  // ── Likes ───────────────────────────────────────────────────────────────────
  public async toggleLike(uid: string): Promise<{ liked: boolean; likes_count: number }> {
    return this.post(`/api/v1/consumer/social/posts/${uid}/like/`, {});
  }

  public async likePost(uid: string): Promise<{ liked: boolean; likes_count: number }> {
    return this.toggleLike(uid);
  }

  public async unlikePost(uid: string): Promise<{ liked: boolean; likes_count: number }> {
    return this.toggleLike(uid);
  }

  // ── Comments ────────────────────────────────────────────────────────────────
  public async getComments(uid: string, limit = 30): Promise<PostComment[]> {
    return this.get(`/api/v1/consumer/social/posts/${uid}/comments/?limit=${limit}`);
  }

  public async listComments(uid: string): Promise<PostComment[]> {
    return this.getComments(uid);
  }

  public async addComment(uid: string, content: string): Promise<PostComment> {
    return this.post(`/api/v1/consumer/social/posts/${uid}/comments/`, { content });
  }

  public async deleteComment(uid: string, commentUid: string): Promise<void> {
    return super.delete(`/api/v1/consumer/social/posts/${uid}/comments/${commentUid}/`);
  }

  // ── Following ──────────────────────────────────────────────────────────────
  public async toggleFollow(targetUid: string): Promise<{ following: boolean }> {
    return this.post(`/api/v1/consumer/social/follow/${targetUid}/`, {});
  }

  public async getFollowStatus(targetUid: string): Promise<{ following: boolean }> {
    return this.get(`/api/v1/consumer/social/follow/status/${targetUid}/`);
  }

  public async getFollowing(uid?: string, limit = 50): Promise<any[]> {
    const url = uid 
      ? `/api/v1/consumer/social/following/?uid=${uid}&limit=${limit}`
      : `/api/v1/consumer/social/following/?limit=${limit}`;
    return this.get(url);
  }

  public async getFollowers(uid?: string, limit = 50): Promise<any[]> {
    const url = uid 
      ? `/api/v1/consumer/social/followers/?uid=${uid}&limit=${limit}`
      : `/api/v1/consumer/social/followers/?limit=${limit}`;
    return this.get(url);
  }

  public async getFollowingFeed(limit = 20): Promise<Post[]> {
    return this.get(`/api/v1/consumer/social/feed/following/?limit=${limit}`);
  }

  // ── Profile ─────────────────────────────────────────────────────────────────
  public async getPublicProfile(consumerUid: string): Promise<PublicStudentProfile> {
    return this.get<PublicStudentProfile>(`/api/v1/consumer/social/profile/${consumerUid}/public/`);
  }

  public async updateProfile(data: Partial<StudentProfileSettings>): Promise<StudentProfileSettings> {
    return this.put<StudentProfileSettings>('/api/v1/consumer/social/profile/settings/', data);
  }
}

export const socialApi = new SocialApiClient();
