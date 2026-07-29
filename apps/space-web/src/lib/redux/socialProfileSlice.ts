import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { communityApi, type WorkspaceProfile } from '@/lib/api/community';
import type { RootState } from './store';
import { clearProfile } from './userSlice';

type FetchStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface SocialProfileState {
  profile: WorkspaceProfile | null;
  status: FetchStatus;
}

const initialState: SocialProfileState = {
  profile: null,
  status: 'idle',
};

export const fetchSocialProfile = createAsyncThunk<WorkspaceProfile, { force?: boolean } | undefined>(
  'socialProfile/fetch',
  async () => communityApi.getMyProfile(),
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const { status } = (getState() as RootState).socialProfile;
      return status !== 'loading' && status !== 'succeeded';
    },
  },
);

const socialProfileSlice = createSlice({
  name: 'socialProfile',
  initialState,
  reducers: {
    updateSocialAvatar: (state, action: PayloadAction<string>) => {
      if (state.profile) {
        state.profile.avatar_url = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSocialProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSocialProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchSocialProfile.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(clearProfile, (state) => {
        state.profile = null;
        state.status = 'idle';
      });
  },
});

export const { updateSocialAvatar } = socialProfileSlice.actions;
export default socialProfileSlice.reducer;
