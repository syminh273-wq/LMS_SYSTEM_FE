import type { Classroom, ClassroomMember } from '../types';

export function getClassroomInitials(classroom: Classroom): string {
  return classroom.name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getClassroomStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'inactive':
      return 'bg-gray-50 text-gray-600 border-gray-100';
    case 'archived':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}

export function getMemberRoleBadge(role: string): string {
  switch (role) {
    case 'teacher':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'student':
      return 'bg-purple-50 text-purple-600 border-purple-100';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}

export function getMemberStatusBadge(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'pending':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}


export function isClassroomFull(classroom: Classroom, memberCount: number): boolean {
  return classroom.max_students > 0 && memberCount >= classroom.max_students;
}

export function sortClassroomsByDate(classrooms: Classroom[], order: 'asc' | 'desc' = 'desc'): Classroom[] {
  return [...classrooms].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function filterClassroomsBySearch(classrooms: Classroom[], searchQuery: string): Classroom[] {
  const query = searchQuery.toLowerCase();
  return classrooms.filter(
    (classroom) =>
      classroom.name.toLowerCase().includes(query) ||
      classroom.pid.toLowerCase().includes(query) ||
      classroom.description.toLowerCase().includes(query)
  );
}

export function getMembersByRole(members: ClassroomMember[], role: 'teacher' | 'student'): ClassroomMember[] {
  return members.filter((member) => member.role === role);
}

export function getApprovedMembers(members: ClassroomMember[]): ClassroomMember[] {
  return members.filter((member) => member.status === 'approved');
}

export function getPendingMembers(members: ClassroomMember[]): ClassroomMember[] {
  return members.filter((member) => member.status === 'pending');
}
