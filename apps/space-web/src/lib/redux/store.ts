import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import spaceReducer from './spaceSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    space: spaceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
