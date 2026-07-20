import type { Resource, ResourceFolder } from '../types';

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

export function getFileType(filename: string): 'image' | 'pdf' | 'document' | 'video' | 'audio' | 'other' {
  const ext = getFileExtension(filename);
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return 'document';
  if (['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return 'audio';
  return 'other';
}

export function getFileTypeIcon(filename: string): string {
  const type = getFileType(filename);
  switch (type) {
    case 'image':
      return 'Image';
    case 'pdf':
      return 'FileType';
    case 'document':
      return 'FileText';
    case 'video':
      return 'Video';
    case 'audio':
      return 'Music';
    default:
      return 'File';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function isImageFile(filename: string): boolean {
  return getFileType(filename) === 'image';
}

export function isPdfFile(filename: string): boolean {
  return getFileType(filename) === 'pdf';
}

export function sortResourcesByName(resources: Resource[], order: 'asc' | 'desc' = 'asc'): Resource[] {
  return [...resources].sort((a, b) => {
    return order === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
  });
}

export function sortResourcesByDate(resources: Resource[], order: 'asc' | 'desc' = 'desc'): Resource[] {
  return [...resources].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function sortFoldersByName(folders: ResourceFolder[], order: 'asc' | 'desc' = 'asc'): ResourceFolder[] {
  return [...folders].sort((a, b) => {
    return order === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
  });
}

export function getRootFolders(folders: ResourceFolder[]): ResourceFolder[] {
  return folders.filter((folder) => folder.parent_id === null);
}

export function getChildFolders(folders: ResourceFolder[], parentId: string): ResourceFolder[] {
  return folders.filter((folder) => folder.parent_id === parentId);
}

export function buildFolderPath(folders: ResourceFolder[], folderId: string): string[] {
  const path: string[] = [];
  let current = folders.find((f) => f.uid === folderId);
  
  while (current) {
    path.unshift(current.name);
    current = current.parent_id ? folders.find((f) => f.uid === current!.parent_id) : undefined;
  }
  
  return path;
}
