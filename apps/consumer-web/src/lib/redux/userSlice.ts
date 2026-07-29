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
    setFaceEnrolled: (state, action: PayloadAction<boolean>) => {
      state.faceEnrolled = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('faceEnrolled', String(action.payload));
      }
    },
    // Runs only after mount (see Providers.tsx) so the client's first render
    // still matches the server-rendered HTML; restoring from localStorage
    // here (post-hydration) avoids a hydration mismatch.
    restoreSession: (state, action: PayloadAction<{ profile: Consumer | null; faceEnrolled: boolean | null }>) => {
      state.profile = action.payload.profile;
      state.isAuthenticated = Boolean(action.payload.profile);
      state.faceEnrolled = action.payload.faceEnrolled;
    },
  },
});

export const { setProfile, clearProfile, setFaceEnrolled, restoreSession } = userSlice.actions;
export default userSlice.reducer;
