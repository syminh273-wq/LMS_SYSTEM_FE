import AbstractRestApiClient from './client';
import type { Post, PostComment, CreatePostRequest, SuggestionsResponse } from './types';

class SocialApiClient extends AbstractRestApiClient {
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

  // ── Posts ───────────────────────────────────────────────────────────────────
  public async createPost(data: CreatePostRequest): Promise<Post> {
    return this.post('/api/v1/consumer/social/posts/', data);
  }

  public async uploadPostImages(files: File[]): Promise<{ urls: string[]; errors: { name: string; error: string }[]; count: number }> {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return this.post('/api/v1/consumer/social/posts/upload-images/', fd);
  }

  public async deletePost(uid: string): Promise<void> {
    return super.delete(`/api/v1/consumer/social/posts/${uid}/`);
  }

  // ── Likes ───────────────────────────────────────────────────────────────────
  public async toggleLike(uid: string): Promise<{ liked: boolean; likes_count: number }> {
    return this.post(`/api/v1/consumer/social/posts/${uid}/like/`, {});
  }

  // ── Comments ────────────────────────────────────────────────────────────────
  public async getComments(uid: string, limit = 30): Promise<PostComment[]> {
    return this.get(`/api/v1/consumer/social/posts/${uid}/comments/?limit=${limit}`);
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

  // ── Suggestions ────────────────────────────────────────────────────────────
  public async getSuggestions(limit = 6): Promise<SuggestionsResponse> {
    return this.get(`/api/v1/consumer/social/suggestions/?limit=${limit}`);
  }
}

export const socialApi = new SocialApiClient();
