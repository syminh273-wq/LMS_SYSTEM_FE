export type SocialLink = {
  platform: 'facebook' | 'linkedin' | 'github' | 'twitter' | 'instagram' | 'website' | string;
  url: string;
  label: string;
};

export type ProfileCertificate = {
  title: string;
  issuer: string;
  issued_date: string;
  url: string;
  badge_url?: string;
};

export type CustomField = {
  key: string;
  value: string;
};

export type ProfileMetadata = {
  hobbies?: string[];
  social_links?: SocialLink[];
  certificates?: ProfileCertificate[];
  custom_fields?: CustomField[];
};

export type ThemeColor = 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet';
export type CoverStyle = 'gradient' | 'solid' | 'mesh';
export type ProfileVisibility = 'public' | 'class_only' | 'private';

export type StudentProfileSettings = {
  consumer_uid: string;
  bio: string;
  address: string;
  city: string;
  country: string;
  theme_color: ThemeColor;
  cover_style: CoverStyle;
  cover_value: string;
  show_stats: boolean;
  show_classrooms: boolean;
  show_grades: boolean;
  show_badges: boolean;
  show_address: boolean;
  show_links: boolean;
  show_hobbies: boolean;
  show_certificates: boolean;
  show_activity: boolean;
  show_contact: boolean;
  sections_order: string[];
  profile_visibility: ProfileVisibility;
  metadata: ProfileMetadata;
  updated_at: string | null;
};

export type PublicStudentProfile = StudentProfileSettings & {
  consumer: {
    uid: string;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    full_name: string;
    phone?: string;
    avatar_url: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  } | null;
};

export type PostVisibility = 'public' | 'private' | 'friends';

export type PostEmotion = 'happy' | 'sad' | 'motivated' | 'excited' | 'tired' | 'thinking' | 'confident' | 'celebrating' | 'stressed' | 'loved' | '';

export type Post = {
  uid: string;
  consumer_uid: string;
  author_name: string;
  author_avatar: string;
  content: string;
  emotion: PostEmotion;
  image_url: string;
  visibility: PostVisibility;
  classroom_tag: string | null;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
  created_at: string;
};

export type PostComment = {
  uid: string;
  post_uid: string;
  consumer_uid: string;
  author_name: string;
  author_avatar: string;
  content: string;
  created_at: string;
};

export type CreatePostRequest = {
  content: string;
  emotion?: PostEmotion;
  image_url?: string;
  visibility: PostVisibility;
  classroom_tag?: string;
};
