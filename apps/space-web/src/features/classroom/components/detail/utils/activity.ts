import type { ActivityLogEventType } from '@/lib/api/types';
import {
  GraduationCap,
  File,
  Trash2,
  ClipboardList,
  CheckCircle2,
  Timer,
  Gamepad2,
  Video,
  UserPlus,
  UserX,
  Users,
  FileCheck,
  Clock as ClockIcon,
} from 'lucide-react';
import type React from 'react';

export function getActivityMeta(eventType: ActivityLogEventType, t: (key: string) => string): {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
} {
  const map: Record<ActivityLogEventType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    classroom_created:  { icon: GraduationCap, color: 'text-primary-brand', bg: 'bg-primary-brand-light',  label: t('classroom.ui.activity_classroom_created') },
    document_uploaded:  { icon: File,          color: 'text-blue-600',   bg: 'bg-blue-100',    label: t('classroom.ui.activity_document_uploaded') },
    document_deleted:   { icon: Trash2,        color: 'text-red-500',    bg: 'bg-red-100',     label: t('classroom.ui.activity_document_deleted') },
    exam_created:       { icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-100',  label: t('classroom.ui.activity_exam_created') },
    exam_published:     { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-100',   label: t('classroom.ui.activity_exam_published') },
    exam_opened:        { icon: Timer,         color: 'text-emerald-600',bg: 'bg-emerald-100', label: t('classroom.ui.activity_exam_opened') },
    exam_closed:        { icon: ClockIcon,     color: 'text-muted-foreground',  bg: 'bg-muted',   label: t('classroom.ui.activity_exam_closed') },
    exam_deleted:       { icon: Trash2,        color: 'text-red-500',    bg: 'bg-red-100',     label: t('classroom.ui.activity_exam_deleted') },
    quiz_assigned:      { icon: Gamepad2,      color: 'text-purple-600', bg: 'bg-purple-100',  label: t('classroom.ui.activity_quiz_assigned') },
    meeting_started:    { icon: Video,         color: 'text-sky-600',    bg: 'bg-sky-100',     label: t('classroom.ui.activity_meeting_started') },
    meeting_ended:      { icon: Video,         color: 'text-muted-foreground',  bg: 'bg-muted',   label: t('classroom.ui.activity_meeting_ended') },
    member_joined:      { icon: UserPlus,      color: 'text-blue-500',   bg: 'bg-blue-100',    label: t('classroom.ui.activity_member_joined') },
    member_approved:    { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-100',   label: t('classroom.ui.activity_member_approved') },
    member_rejected:    { icon: UserX,         color: 'text-red-500',    bg: 'bg-red-100',     label: t('classroom.ui.activity_member_rejected') },
    member_kicked:      { icon: UserX,         color: 'text-red-500',    bg: 'bg-red-100',     label: t('classroom.ui.activity_member_kicked') },
    member_left:        { icon: Users,         color: 'text-muted-foreground',  bg: 'bg-muted',   label: t('classroom.ui.activity_member_left') },
    exam_submitted:     { icon: FileCheck,     color: 'text-teal-600',   bg: 'bg-teal-100',    label: t('classroom.ui.activity_exam_submitted') },
  };
  return map[eventType] ?? { icon: ClipboardList, color: 'text-muted-foreground', bg: 'bg-muted', label: eventType };
}
