import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { spaceApi } from '@/lib/api';
import { setSettings } from '@/lib/redux/spaceSlice';
import { setProfile, fetchAccountProfile } from '@/lib/redux/userSlice';
import { fetchSocialProfile } from '@/lib/redux/socialProfileSlice';
import { RootState, useAppDispatch } from '@/lib/redux/store';

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const themeColor = useSelector((state: RootState) => state.space.themeColor);

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    if (savedProfile) {
      try {
        dispatch(setProfile(JSON.parse(savedProfile)));
      } catch (e) {
        console.error('Failed to parse userProfile from localStorage', e);
      }
    }

    // Dispatch on token presence rather than the (not-yet-populated) redux
    // isAuthenticated flag — on a fresh login there is no cached userProfile
    // yet, so gating on isAuthenticated would mean these never fire.
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
    dispatch(fetchAccountProfile());
    dispatch(fetchSocialProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
