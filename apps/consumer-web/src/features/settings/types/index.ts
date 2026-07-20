export interface Space {
  uid: string;
  owner_uid: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpaceSettings {
  [key: string]: unknown;
}

export interface UserSettings {
  [key: string]: unknown;
}

export interface CreateSpaceRequest {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
}

export interface UpdateSpaceRequest {
  name?: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
}

export interface UpdateSettingsRequest {
  [key: string]: unknown;
}
