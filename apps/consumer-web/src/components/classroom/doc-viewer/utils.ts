export function isImageFile(fileType?: string): boolean {
  if (!fileType) return false;
  const t = fileType.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(t);
}

export function isPdfFile(fileType?: string): boolean {
  if (!fileType) return false;
  return fileType.toLowerCase() === 'pdf';
}
