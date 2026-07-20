import { configureStore } from '@reduxjs/toolkit';
import userReducer, { clearProfile } from './userSlice';
import spaceReducer from './spaceSlice';
import quizTasksReducer from './quizTasksSlice';
import themeReducer from '@shared/lib/redux/themeSlice';
import BaseRestApiClient from '@/core/api/client';

export const store = configureStore({
  reducer: {
    user: userReducer,
    space: spaceReducer,
    theme: themeReducer,
    quizTasks: quizTasksReducer,
  },
});

BaseRestApiClient.onUnauthorized = () => {
  store.dispatch(clearProfile());
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
