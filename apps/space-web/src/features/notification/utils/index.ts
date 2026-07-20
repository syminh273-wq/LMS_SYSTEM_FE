import type { NotificationItem } from '../types';

export function getNotificationIcon(notifyType: string): string {
  switch (notifyType) {
    case 'exam_submitted':
      return 'FileCheck';
    case 'exam_graded':
      return 'Award';
    case 'quiz_assigned':
      return 'HelpCircle';
    case 'member_joined':
      return 'UserPlus';
    case 'member_approved':
      return 'UserCheck';
    case 'classroom_created':
      return 'School';
    default:
      return 'Bell';
  }
}

export function getNotificationColor(notifyType: string): string {
  switch (notifyType) {
    case 'exam_submitted':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'exam_graded':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'quiz_assigned':
      return 'bg-purple-50 text-purple-600 border-purple-100';
    case 'member_joined':
    case 'member_approved':
      return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}


export function sortNotificationsByDate(notifications: NotificationItem[], order: 'asc' | 'desc' = 'desc'): NotificationItem[] {
  return [...notifications].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function filterUnreadNotifications(notifications: NotificationItem[]): NotificationItem[] {
  return notifications.filter((n) => !n.is_read);
}

export function getUnreadCount(notifications: NotificationItem[]): number {
  return notifications.filter((n) => !n.is_read).length;
}

export function parseNotificationMetadata(metadata: string | Record<string, unknown>): Record<string, unknown> {
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
  return metadata;
}
