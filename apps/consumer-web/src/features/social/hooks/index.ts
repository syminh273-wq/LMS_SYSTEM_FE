import { useState, useEffect, useCallback } from 'react';
import type { Post, PostComment, StudentProfileSettings, PublicStudentProfile, PostEmotion, PostVisibility } from '../types';
import { socialApi } from '../api';

export function usePostList(consumerUid?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await socialApi.listPosts(consumerUid);
      setPosts(Array.isArray(res) ? res : (res as any).results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [consumerUid]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    refresh: fetchPosts,
  };
}

export function usePostComments(postUid: string) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComments = useCallback(async () => {
    if (!postUid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await socialApi.listComments(postUid);
      setComments(Array.isArray(res) ? res : (res as any).results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [postUid]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    refresh: fetchComments,
  };
}

export function useCreatePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createPost = useCallback(async (data: { content: string; visibility: PostVisibility; emotion?: PostEmotion; image_url?: string }) => {
    try {
      setLoading(true);
      setError('');
      const res = await socialApi.createPost(data);
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createPost,
    loading,
    error,
  };
}

export function useLikePost() {
  const [loading, setLoading] = useState(false);

  const likePost = useCallback(async (postUid: string) => {
    try {
      setLoading(true);
      await socialApi.likePost(postUid);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unlikePost = useCallback(async (postUid: string) => {
    try {
      setLoading(true);
      await socialApi.unlikePost(postUid);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { likePost, unlikePost, loading };
}

export function useStudentProfile(consumerUid?: string) {
  const [profile, setProfile] = useState<PublicStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!consumerUid) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await socialApi.getPublicProfile(consumerUid);
      setProfile(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [consumerUid]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
  };
}

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateProfile = useCallback(async (data: Partial<StudentProfileSettings>) => {
    try {
      setLoading(true);
      setError('');
      const res = await socialApi.updateProfile(data);
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateProfile,
    loading,
    error,
  };
}
