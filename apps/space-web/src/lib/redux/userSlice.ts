import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Consumer } from '@/lib/api';

interface UserState {
  profile: Consumer | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  profile: null,
  isAuthenticated: false,
};

// Try to load initial state from localStorage if available
if (typeof window !== 'undefined') {
  const savedProfile = localStorage.getItem('userProfile');
  const token = localStorage.getItem('accessToken');
  if (savedProfile && token) {
    try {
      initialState.profile = JSON.parse(savedProfile);
      initialState.isAuthenticated = true;
    } catch (e) {
      console.error("Failed to parse userProfile from localStorage", e);
    }
  }
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Consumer>) => {
      state.profile = action.payload;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('userProfile', JSON.stringify(action.payload));
      }
    },
    clearProfile: (state) => {
      state.profile = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
  },
});

export const { setProfile, clearProfile, setAuthenticated } = userSlice.actions;
export default userSlice.reducer;
