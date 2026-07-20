import type { Space } from '../types';

export function getSpaceInitials(space: Space): string {
  return space.name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getSpaceStatusColor(isActive: boolean): string {
  return isActive
    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
    : 'bg-gray-50 text-gray-600 border-gray-100';
}

export function getSpaceStatusText(isActive: boolean, t: (key: string) => string): string {
  return isActive ? t('settings.space.status.active') : t('settings.space.status.inactive');
}

export function formatSpaceUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/${slug}`;
}

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug) return { valid: false, error: 'Slug không được để trống' };
  if (slug.length < 3) return { valid: false, error: 'Slug phải có ít nhất 3 ký tự' };
  if (slug.length > 50) return { valid: false, error: 'Slug không được quá 50 ký tự' };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { valid: false, error: 'Slug chỉ chứa chữ thường, số và dấu gạch ngang' };
  }
  return { valid: true };
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}
