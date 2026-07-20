import type { StudentClassroomStat, StudentDetail, TeacherContact } from '../types';

export function getStudentFullName(student: StudentDetail): string {
  return student.consumer.full_name;
}

export function getStudentInitials(student: StudentDetail): string {
  return student.consumer.full_name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function calculateOverallAverage(classrooms: StudentClassroomStat[]): number | null {
  const validClassrooms = classrooms.filter((c) => c.avg_grade !== null);
  if (validClassrooms.length === 0) return null;

  const total = validClassrooms.reduce((sum, c) => sum + (c.avg_grade || 0), 0);
  return Math.round((total / validClassrooms.length) * 100) / 100;
}

export function getTotalExamsSubmitted(classrooms: StudentClassroomStat[]): number {
  return classrooms.reduce((sum, c) => sum + c.submitted_count, 0);
}

export function getTotalExamsAssigned(classrooms: StudentClassroomStat[]): number {
  return classrooms.reduce((sum, c) => sum + c.total_exams, 0);
}

export function getSubmissionRate(classrooms: StudentClassroomStat[]): number {
  const total = getTotalExamsAssigned(classrooms);
  const submitted = getTotalExamsSubmitted(classrooms);
  if (total === 0) return 0;
  return Math.round((submitted / total) * 100);
}

export function getContactFullName(contact: TeacherContact): string {
  return contact.consumer_name || `${contact.first_name} ${contact.last_name}`.trim();
}

export function getContactInitials(contact: TeacherContact): string {
  const name = getContactFullName(contact);
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function sortClassroomStatsByJoinDate(
  classrooms: StudentClassroomStat[],
  order: 'asc' | 'desc' = 'desc'
): StudentClassroomStat[] {
  return [...classrooms].sort((a, b) => {
    if (!a.joined_at) return 1;
    if (!b.joined_at) return -1;
    const dateA = new Date(a.joined_at).getTime();
    const dateB = new Date(b.joined_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function sortClassroomStatsByGrade(
  classrooms: StudentClassroomStat[],
  order: 'asc' | 'desc' = 'desc'
): StudentClassroomStat[] {
  return [...classrooms].sort((a, b) => {
    const gradeA = a.avg_grade ?? -1;
    const gradeB = b.avg_grade ?? -1;
    return order === 'desc' ? gradeB - gradeA : gradeA - gradeB;
  });
}

export function getGradeColor(grade: number | null): string {
  if (grade === null) return 'text-gray-500';
  if (grade >= 8) return 'text-emerald-600';
  if (grade >= 6.5) return 'text-blue-600';
  if (grade >= 5) return 'text-amber-600';
  return 'text-red-600';
}

export function formatGrade(grade: number | null): string {
  if (grade === null) return 'N/A';
  return grade.toFixed(1);
}
