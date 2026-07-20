import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SpaceSettings {
  space_profile?: {
    name?: string;
    slug?: string;
    description?: string;
    logo_url?: string;
    theme_color?: string;
  };
  security_config?: Record<string, any>;
  classroom_defaults?: Record<string, any>;
  notification_prefs?: Record<string, any>;
}

interface SpaceState {
  settings: SpaceSettings | null;
  themeColor: string;
}

const initialState: SpaceState = {
  settings: null,
  themeColor: '#4f46e5', // Default indigo-600
};

// Try to load initial theme from localStorage if available
if (typeof window !== 'undefined') {
  const savedColor = localStorage.getItem('themeColor');
  if (savedColor) {
    initialState.themeColor = savedColor;
  }
}

const spaceSlice = createSlice({
  name: 'space',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<SpaceSettings>) => {
      state.settings = action.payload;
      if (action.payload.space_profile?.theme_color) {
        state.themeColor = action.payload.space_profile.theme_color;
        if (typeof window !== 'undefined') {
          localStorage.setItem('themeColor', action.payload.space_profile.theme_color);
        }
      }
    },
    setThemeColor: (state, action: PayloadAction<string>) => {
      state.themeColor = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('themeColor', action.payload);
      }
    },
  },
});

export const { setSettings, setThemeColor } = spaceSlice.actions;
export default spaceSlice.reducer;
