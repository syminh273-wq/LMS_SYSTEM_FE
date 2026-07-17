export function isImageFile(fileType?: string): boolean {
  if (!fileType) return false;
  const t = fileType.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(t);
}

export function isPdfFile(fileType?: string): boolean {
  if (!fileType) return false;
  return fileType.toLowerCase() === 'pdf';
}

export const NOTE_COLORS: Record<string, string> = {
  yellow: 'bg-yellow-300/90 text-yellow-900',
  pink: 'bg-pink-300/90 text-pink-900',
  green: 'bg-emerald-300/90 text-emerald-900',
  blue: 'bg-sky-300/90 text-sky-900',
};
