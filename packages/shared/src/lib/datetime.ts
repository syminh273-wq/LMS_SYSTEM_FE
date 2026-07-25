/**
 * Date helpers shared between consumer-web and space-web.
 *
 * The product is single-timezone (Asia/Ho_Chi_Minh, UTC+7). Backend
 * stores + returns naive ISO datetimes (no Z suffix). FE parses them
 * as local VN wall-clock and displays them as-is.
 */

const ISO_RE_WITH_TZ = /[zZ]|[+-]\d{2}:?\d{2}$/;

/**
 * Parse an ISO datetime string from the backend. Strings without a
 * timezone suffix are interpreted as VN wall-clock; strings with `Z`
 * or `±HH:MM` are honored.
 */
export function parseVnDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  const s = String(value).trim();
  if (!s) return null;
  if (ISO_RE_WITH_TZ.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  const naive = s.replace(' ', 'T');
  const d = new Date(naive);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Milliseconds until `value`. Returns null when unparseable.
 */
export function msUntil(value: string | number | Date | null | undefined): number | null {
  const d = parseVnDate(value);
  if (!d) return null;
  return d.getTime() - Date.now();
}

/**
 * Format a backend datetime for display (already in VN).
 */
export function formatLocal(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' },
): string {
  const d = parseVnDate(value);
  if (!d) return '';
  return d.toLocaleString('vi-VN', options);
}
