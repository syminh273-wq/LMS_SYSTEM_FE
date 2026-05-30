export function getAvatarText(fullName?: string | null, fallback = 'SA') {
  const words = (fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return fallback.toUpperCase();
  }

  const first = words[0]?.[0] || '';
  const last = words.length > 1 ? words[words.length - 1]?.[0] || '' : words[0]?.[1] || '';

  return `${first}${last}`.toUpperCase();
}
