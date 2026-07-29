import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Consumer } from '@/lib/api';
import { accountService } from '@/lib/api/account';
import type { RootState } from './store';

type FetchStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface UserState {
  profile: Consumer | null;
  isAuthenticated: boolean;
  status: FetchStatus;
}

// profile always starts null on both server and client render; AppInitializer
// rehydrates it from localStorage in a useEffect after mount to avoid a
// hydration mismatch (SSR never has access to localStorage).
const initialState: UserState = {
  profile: null,
  isAuthenticated: false,
  status: 'idle',
};

export const fetchAccountProfile = createAsyncThunk<Consumer, { force?: boolean } | undefined>(
  'user/fetchAccountProfile',
  async () => accountService.getProfile(),
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const { status } = (getState() as RootState).user;
      return status !== 'loading' && status !== 'succeeded';
    },
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Consumer>) => {
      state.profile = action.payload;
      state.isAuthenticated = true;
      state.status = 'succeeded';
      if (typeof window !== 'undefined') {
        localStorage.setItem('userProfile', JSON.stringify(action.payload));
      }
    },
    clearProfile: (state) => {
      state.profile = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAccountProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.isAuthenticated = true;
        state.status = 'succeeded';
        if (typeof window !== 'undefined') {
          localStorage.setItem('userProfile', JSON.stringify(action.payload));
        }
      })
      .addCase(fetchAccountProfile.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const { setProfile, clearProfile } = userSlice.actions;
export default userSlice.reducer;
