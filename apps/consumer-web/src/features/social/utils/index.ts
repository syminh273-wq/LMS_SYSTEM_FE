import type { Post, PostComment, PostEmotion, PostVisibility, StudentProfileSettings } from '../types';

export function getPostVisibilityIcon(visibility: PostVisibility): string {
  switch (visibility) {
    case 'public':
      return 'Globe';
    case 'friends':
      return 'Users';
    case 'private':
      return 'Lock';
    default:
      return 'Globe';
  }
}

export function getPostVisibilityText(visibility: PostVisibility, t: (key: string) => string): string {
  switch (visibility) {
    case 'public':
      return t('social.visibility.public');
    case 'friends':
      return t('social.visibility.friends');
    case 'private':
      return t('social.visibility.private');
    default:
      return visibility;
  }
}

export function getEmotionIcon(emotion: PostEmotion): string {
  switch (emotion) {
    case 'happy':
      return '😊';
    case 'sad':
      return '😢';
    case 'motivated':
      return '💪';
    case 'excited':
      return '🤩';
    case 'tired':
      return '😴';
    case 'thinking':
      return '🤔';
    case 'confident':
      return '😎';
    case 'celebrating':
      return '🎉';
    case 'stressed':
      return '😰';
    case 'loved':
      return '🥰';
    default:
      return '';
  }
}

export function getEmotionText(emotion: PostEmotion, t: (key: string) => string): string {
  if (!emotion) return '';
  
  const emotionMap: Record<string, string> = {
    happy: t('social.emotion.happy'),
    sad: t('social.emotion.sad'),
    motivated: t('social.emotion.motivated'),
    excited: t('social.emotion.excited'),
    tired: t('social.emotion.tired'),
    thinking: t('social.emotion.thinking'),
    confident: t('social.emotion.confident'),
    celebrating: t('social.emotion.celebrating'),
    stressed: t('social.emotion.stressed'),
    loved: t('social.emotion.loved'),
  };
  
  return emotionMap[emotion] || emotion;
}


export function formatLikeCount(count: number): string {
  if (count === 0) return '0';
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

export function formatCommentCount(count: number): string {
  if (count === 0) return '0 bình luận';
  if (count === 1) return '1 bình luận';
  return `${count} bình luận`;
}

export function sortPostsByDate(posts: Post[], order: 'asc' | 'desc' = 'desc'): Post[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function sortCommentsByDate(comments: PostComment[], order: 'asc' | 'desc' = 'asc'): PostComment[] {
  return [...comments].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function getProfileCompletionPercent(profile: StudentProfileSettings): number {
  const fields = [
    profile.bio,
    profile.address,
    profile.city,
    profile.country,
    profile.metadata?.hobbies?.length,
    profile.metadata?.social_links?.length,
    profile.metadata?.certificates?.length,
  ];

  const filled = fields.filter((f) => f && (typeof f === 'number' ? f > 0 : true)).length;
  return Math.round((filled / fields.length) * 100);
}

export function getProfileInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getThemeColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    rose: 'from-rose-500 to-rose-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    violet: 'from-violet-500 to-violet-600',
  };
  return colorMap[color] || colorMap.indigo;
}
