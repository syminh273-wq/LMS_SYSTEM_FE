import { configureStore } from '@reduxjs/toolkit';
import userReducer, { clearProfile } from './userSlice';
import themeReducer from '@shared/lib/redux/themeSlice';
import BaseRestApiClient from '../api/client';

export const store = configureStore({
  reducer: {
    user: userReducer,
    theme: themeReducer,
  },
});

BaseRestApiClient.onUnauthorized = () => {
  store.dispatch(clearProfile());
};

export type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;
