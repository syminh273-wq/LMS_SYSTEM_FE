'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { spaceApi } from '@/lib/api';
import { setSettings } from '@/lib/redux/spaceSlice';
import { RootState } from '@/lib/redux/store';

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const themeColor = useSelector((state: RootState) => state.space.themeColor);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchSettings = async () => {
        try {
          const data = await spaceApi.getSettings();
          if (Object.keys(data).length > 0) {
            dispatch(setSettings(data));
          }
        } catch (err) {
          console.error('Failed to fetch global settings:', err);
        }
      };
      fetchSettings();
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Apply theme color to CSS variable
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--primary-brand', themeColor);
      
      // Also generate a lighter/darker version if needed, 
      // but for now let's just set the main one.
    }
  }, [themeColor]);

  return <>{children}</>;
}
