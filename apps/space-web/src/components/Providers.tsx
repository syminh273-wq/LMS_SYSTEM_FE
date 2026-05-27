'use client';

import * as React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { ThemeProvider } from '@shared/components/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
        {children}
      </Provider>
    </ThemeProvider>
  );
}
