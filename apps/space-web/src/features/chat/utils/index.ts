import type { ChatMessage, ChatConversation, MsgType } from '../types';

export function getMessageTypeIcon(msgType: MsgType): string {
  switch (msgType) {
    case 'text':
      return 'MessageSquare';
    case 'image':
      return 'Image';
    case 'video':
      return 'Video';
    case 'audio':
      return 'Mic';
    case 'pdf':
      return 'FileText';
    case 'file':
      return 'File';
    default:
      return 'MessageSquare';
  }
}

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Hôm qua';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('vi-VN', { weekday: 'long' });
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function sortMessagesByDate(messages: ChatMessage[], order: 'asc' | 'desc' = 'asc'): ChatMessage[] {
  return [...messages].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function sortConversationsByLastMessage(conversations: ChatConversation[]): ChatConversation[] {
  return [...conversations].sort((a, b) => {
    if (!a.last_msg_at) return 1;
    if (!b.last_msg_at) return -1;
    const dateA = new Date(a.last_msg_at).getTime();
    const dateB = new Date(b.last_msg_at).getTime();
    return dateB - dateA;
  });
}

export function getConversationInitials(conversation: ChatConversation): string {
  return conversation.name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function isMessageFromUser(message: ChatMessage, userId: string): boolean {
  return message.sender_id === userId;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}
