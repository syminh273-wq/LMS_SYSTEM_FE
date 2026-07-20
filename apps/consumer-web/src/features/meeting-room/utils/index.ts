import type { MeetingRoom, MeetingSession } from '../types';

export function getMeetingRoomStatusColor(isActive: boolean): string {
  return isActive
    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
    : 'bg-gray-50 text-gray-600 border-gray-100';
}

export function getMeetingRoomStatusText(isActive: boolean, t: (key: string) => string): string {
  return isActive ? t('meetingRoom.status.active') : t('meetingRoom.status.inactive');
}


export function isMeetingOngoing(session: MeetingSession): boolean {
  return session.ended_at === null;
}

export function getParticipantCount(session: MeetingSession): number {
  return session.participants.length;
}

export function sortRoomsByName(rooms: MeetingRoom[], order: 'asc' | 'desc' = 'asc'): MeetingRoom[] {
  return [...rooms].sort((a, b) => {
    return order === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
  });
}

export function sortSessionsByDate(sessions: MeetingSession[], order: 'asc' | 'desc' = 'desc'): MeetingSession[] {
  return [...sessions].sort((a, b) => {
    const dateA = new Date(a.started_at).getTime();
    const dateB = new Date(b.started_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function getActiveSessions(sessions: MeetingSession[]): MeetingSession[] {
  return sessions.filter(isMeetingOngoing);
}

export function getRoomInitials(room: MeetingRoom): string {
  return room.name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
