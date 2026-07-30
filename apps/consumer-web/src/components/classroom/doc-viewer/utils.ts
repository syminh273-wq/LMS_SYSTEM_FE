export function isImageFile(fileType?: string): boolean {
  if (!fileType) return false;
  const t = fileType.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(t);
}

export function isPdfFile(fileType?: string): boolean {
  if (!fileType) return false;
  return fileType.toLowerCase() === 'pdf';
}

export function isVideoFile(fileType?: string): boolean {
  if (!fileType) return false;
  return ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileType.toLowerCase());
}

export function isAudioFile(fileType?: string): boolean {
  if (!fileType) return false;
  return ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(fileType.toLowerCase());
}
