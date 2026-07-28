'use client';

import * as React from 'react';

export type Locale = 'en' | 'vi';
const DEFAULT_LOCALE: Locale = 'vi';

export type LocaleMessages = Record<string, unknown>;
export type LocaleBundles = Record<Locale, Record<string, LocaleMessages>>;

const STORAGE_KEY = 'lms.locale';

function isSupportedLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'vi';
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isSupportedLocale(stored)) return stored;
  const browser = window.navigator?.language?.slice(0, 2).toLowerCase();
  if (isSupportedLocale(browser)) return browser;
  return DEFAULT_LOCALE;
}

function lookup(messages: LocaleMessages | undefined, key: string): string | undefined {
  if (!messages) return undefined;
  const segments = key.split('.');
  let current: unknown = messages;
  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

type InterpolationValues = Record<string, string | number>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, fallback?: string, values?: InterpolationValues) => string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const LOCALE_LOCALE_MAP: Record<Locale, string> = {
  en: 'en-US',
  vi: 'vi-VN',
};

function interpolate(template: string, values?: InterpolationValues): string {
  if (!values) return template;
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return String(values[key]);
    }
    return match;
  });
}

function resolveLocale(locale: Locale): string {
  return LOCALE_LOCALE_MAP[locale] ?? 'en-US';
}

const LocaleContext = React.createContext<LocaleContextValue | undefined>(undefined);

interface LocaleProviderProps {
  bundles: LocaleBundles;
  children: React.ReactNode;
}

export function LocaleProvider({ bundles, children }: LocaleProviderProps) {
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const initial = getInitialLocale();
    setLocaleState(initial);
    document.documentElement.lang = initial;
    setHydrated(true);
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    }
  }, []);

  const t = React.useCallback(
    (key: string, fallback?: string, values?: InterpolationValues) => {
      const localeBundles = bundles[locale] ?? {};
      const namespaces = Object.keys(localeBundles);
      const firstSegment = key.split('.')[0];
      const candidates = namespaces.includes(firstSegment)
        ? [firstSegment, ...namespaces.filter((ns) => ns !== firstSegment)]
        : namespaces;
      for (const ns of candidates) {
        const subKey = namespaces.includes(firstSegment) && ns === firstSegment
          ? key.slice(firstSegment.length + 1)
          : key;
        const value = lookup(localeBundles[ns], subKey);
        if (value !== undefined) return interpolate(value, values);
      }
      const fallbackLocale: Locale = locale === 'vi' ? 'en' : 'vi';
      const fallbackBundles = bundles[fallbackLocale] ?? {};
      for (const ns of candidates) {
        const subKey = namespaces.includes(firstSegment) && ns === firstSegment
          ? key.slice(firstSegment.length + 1)
          : key;
        const value = lookup(fallbackBundles[ns], subKey);
        if (value !== undefined) return interpolate(value, values);
      }
      return interpolate(fallback ?? key, values);
    },
    [bundles, locale]
  );

  const formatDate = React.useCallback(
    (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
      const d = value instanceof Date ? value : new Date(value);
      const defaultOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Intl.DateTimeFormat(resolveLocale(locale), options ?? defaultOptions).format(d);
    },
    [locale]
  );

  const formatTime = React.useCallback(
    (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
      const d = value instanceof Date ? value : new Date(value);
      const defaultOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
      return new Intl.DateTimeFormat(resolveLocale(locale), options ?? defaultOptions).format(d);
    },
    [locale]
  );

  const formatDateTime = React.useCallback(
    (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
      const d = value instanceof Date ? value : new Date(value);
      const defaultOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return new Intl.DateTimeFormat(resolveLocale(locale), options ?? defaultOptions).format(d);
    },
    [locale]
  );

  const formatNumber = React.useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(resolveLocale(locale), options).format(value);
    },
    [locale]
  );

  const value = React.useMemo(
    () => ({ locale, setLocale, t, formatDate, formatTime, formatDateTime, formatNumber }),
    [locale, setLocale, t, formatDate, formatTime, formatDateTime, formatNumber]
  );

  return (
    <LocaleContext.Provider value={value}>
      <div data-locale-hydrated={hydrated ? 'true' : 'false'} style={{ display: 'contents' }}>
        {children}
      </div>
    </LocaleContext.Provider>
  );
}

function useLocale() {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function useTranslation() {
  const { t, locale, setLocale, formatDate, formatTime, formatDateTime, formatNumber } = useLocale();
  return { t, locale, setLocale, formatDate, formatTime, formatDateTime, formatNumber };
}
