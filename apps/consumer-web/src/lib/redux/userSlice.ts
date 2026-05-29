import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Consumer } from '@/lib/api';

interface UserState {
  profile: Consumer | null;
  isAuthenticated: boolean;
  faceEnrolled: boolean | null; // null = chưa fetch, true/false = đã biết
}

const initialState: UserState = {
  profile: null,
  isAuthenticated: false,
  faceEnrolled: null,
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
  const savedFaceEnrolled = localStorage.getItem('faceEnrolled');
  if (savedFaceEnrolled !== null) {
    initialState.faceEnrolled = savedFaceEnrolled === 'true';
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
      state.faceEnrolled = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('faceEnrolled');
      }
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setFaceEnrolled: (state, action: PayloadAction<boolean>) => {
      state.faceEnrolled = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('faceEnrolled', String(action.payload));
      }
    },
  },
});

export const { setProfile, clearProfile, setAuthenticated, setFaceEnrolled } = userSlice.actions;
export default userSlice.reducer;
