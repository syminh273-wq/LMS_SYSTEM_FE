import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Consumer } from '@/lib/api';

interface UserState {
  profile: Consumer | null;
  isAuthenticated: boolean;
}

// profile always starts null on both server and client render; AppInitializer
// rehydrates it from localStorage in a useEffect after mount to avoid a
// hydration mismatch (SSR never has access to localStorage).
const initialState: UserState = {
  profile: null,
  isAuthenticated: false,
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },
  },
});

export const { setProfile, clearProfile } = userSlice.actions;
export default userSlice.reducer;
