import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import userReducer, { clearProfile } from './userSlice';
import socialProfileReducer from './socialProfileSlice';
import spaceReducer from './spaceSlice';
import quizTasksReducer from './quizTasksSlice';
import themeReducer from '@shared/lib/redux/themeSlice';
import AbstractRestApiClient from '../api/client';

export const store = configureStore({
  reducer: {
    user: userReducer,
    socialProfile: socialProfileReducer,
    space: spaceReducer,
    theme: themeReducer,
    quizTasks: quizTasksReducer,
  },
});

AbstractRestApiClient.onUnauthorized = () => {
  store.dispatch(clearProfile());
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
