export const VIETNAM_OFFSET_HOURS = 7;

function ensureUtc(isoString: string): string {
  if (!isoString) return isoString;
  const hasTimezone = /[Zz]|[+-]\d{2}:\d{2}$/.test(isoString);
  if (hasTimezone) return isoString;
  return `${isoString.endsWith(' ') ? isoString.trim() : isoString}Z`;
}

export function parseDate(value: string | number | Date | null | undefined): Date {
  if (value == null) return new Date(NaN);
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return new Date(ensureUtc(value));
}

export function isValidDate(value: string | number | Date | null | undefined): boolean {
  const d = parseDate(value);
  return !isNaN(d.getTime());
}

export function formatDate(
  value: string | number | Date | null | undefined,
  locale: 'vi' | 'en' = 'vi',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = parseDate(value);
  if (isNaN(d.getTime())) return '';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', options ?? defaultOptions).format(d);
}

export function formatTime(
  value: string | number | Date | null | undefined,
  locale: 'vi' | 'en' = 'vi',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = parseDate(value);
  if (isNaN(d.getTime())) return '';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', options ?? defaultOptions).format(d);
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  locale: 'vi' | 'en' = 'vi',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = parseDate(value);
  if (isNaN(d.getTime())) return '';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', options ?? defaultOptions).format(d);
}

export function formatFullDateTime(
  value: string | number | Date | null | undefined,
  locale: 'vi' | 'en' = 'vi',
): string {
  const d = parseDate(value);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatRelative(
  value: string | number | Date | null | undefined,
  locale: 'vi' | 'en' = 'vi',
): string {
  const d = parseDate(value);
  if (isNaN(d.getTime())) return '';
  const now = Date.now();
  const diff = now - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (locale === 'vi') {
    if (seconds < 60) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return formatDate(d, locale);
  }
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d, locale);
}

export function formatCountdown(
  value: string | number | Date | null | undefined,
  locale: 'vi' | 'en' = 'vi',
): string {
  const d = parseDate(value);
  if (isNaN(d.getTime())) return '';
  const diff = d.getTime() - Date.now();
  if (diff <= 0) return locale === 'vi' ? 'Đã hết hạn' : 'Expired';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return locale === 'vi' ? `${days} ngày ${hours % 24} giờ` : `${days}d ${hours % 24}h`;
  }
  return locale === 'vi' ? `${hours} giờ ${minutes} phút` : `${hours}h ${minutes}m`;
}
