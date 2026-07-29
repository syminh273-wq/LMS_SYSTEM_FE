'use client';

import * as React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { ThemeProvider } from '@shared/components/ThemeProvider';
import { LocaleProvider } from '@shared/components/LocaleProvider';
import { TooltipProvider } from '@shared/components/ui/tooltip';
import { spaceWebBundles } from '@/lib/i18n/bundles';
import { AppInitializer } from './AppInitializer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider bundles={spaceWebBundles}>
      <ThemeProvider>
        <TooltipProvider delayDuration={150}>
          <Provider store={store}>
            <AppInitializer>
              {children}
            </AppInitializer>
          </Provider>
        </TooltipProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
