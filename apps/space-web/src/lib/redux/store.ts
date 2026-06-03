import { configureStore } from '@reduxjs/toolkit';
import userReducer, { clearProfile } from './userSlice';
import spaceReducer from './spaceSlice';
import BaseRestApiClient from '../api/client';

export const store = configureStore({
  reducer: {
    user: userReducer,
    space: spaceReducer,
  },
});

BaseRestApiClient.onUnauthorized = () => {
  store.dispatch(clearProfile());
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
