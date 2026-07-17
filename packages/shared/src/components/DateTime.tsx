'use client';

import * as React from 'react';
import {
  formatCountdown,
  formatDate,
  formatDateTime,
  formatFullDateTime,
  formatRelative,
  formatTime
} from "../lib/datetime";


type DateTimeType = 'date' | 'time' | 'datetime' | 'full' | 'relative' | 'countdown';

interface DateTimeProps {
  value: string | number | Date | null | undefined;
  type?: DateTimeType;
  locale?: 'vi' | 'en';
  options?: Intl.DateTimeFormatOptions;
  className?: string;
  fallback?: string;
}

export function DateTime({
  value,
  type = 'datetime',
  locale = 'vi',
  options,
  className,
  fallback = '',
}: DateTimeProps) {
  const text = React.useMemo(() => {
    if (value == null) return fallback;
    switch (type) {
      case 'date':
        return formatDate(value, locale, options);
      case 'time':
        return formatTime(value, locale, options);
      case 'datetime':
        return formatDateTime(value, locale, options);
      case 'full':
        return formatFullDateTime(value, locale);
      case 'relative':
        return formatRelative(value, locale);
      case 'countdown':
        return formatCountdown(value, locale);
      default:
        return formatDateTime(value, locale, options);
    }
  }, [value, type, locale, options, fallback]);

  if (!text) return null;

  return <span className={className}>{text}</span>;
}
