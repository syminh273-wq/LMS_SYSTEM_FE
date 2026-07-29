'use client';

import * as React from 'react';
import { MoreVertical, UserX, Users, ShieldBan, ClipboardCheck, BarChart2, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import type { ClassroomMember } from '@/lib/api/types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface StudentsTabProps {
  members: ClassroomMember[];
  loadingMembers: boolean;
  kickingId: string | null;
  setMemberToKick: (member: ClassroomMember | null) => void;
  setMemberToBlock: (value: { member: ClassroomMember; scope: 'classroom' | 'global' } | null) => void;
  setDetailsMember: (member: ClassroomMember | null) => void;
  setAnalyzeMember: (member: ClassroomMember | null) => void;
  formatDateTime: (v: string) => string;
  router: AppRouterInstance;
  classroomUid: string;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function StudentsTab({
  members,
  loadingMembers,
  kickingId,
  setMemberToKick,
  setMemberToBlock,
  setDetailsMember: _setDetailsMember,
  setAnalyzeMember: _setAnalyzeMember,
  formatDateTime,
  router,
  classroomUid,
  t,
}: StudentsTabProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-card rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-10 bg-muted/50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.students_title')}</h3>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {loadingMembers ? t('classroom.ui.students_loading') : t('classroom.ui.students_count_in_class', undefined, { count: members.filter(m => m.role === 'student').length })}
            </p>
          </div>
        </div>

        <div className="p-10">
          {loadingMembers ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : members.filter(m => m.role === 'student').length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 bg-muted/30 rounded-[32px]">
              <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4 shadow-sm">
                <Users size={24} className="opacity-40" />
              </div>
              <p className="text-sm font-bold text-foreground uppercase tracking-widest">{t('classroom.ui.students_empty')}</p>
              <p className="text-xs font-medium mt-1">{t('classroom.ui.students_empty_hint')}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] bg-card shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">{t('classroom.ui.students_th_member')}</th>
                    <th className="px-6 py-4">{t('classroom.ui.students_th_joined_at')}</th>
                    <th className="px-6 py-4 text-right">{t('classroom.ui.students_th_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.filter(m => m.role === 'student').map(member => (
                    <tr key={member.member_id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {member.member_avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={member.member_avatar} alt={member.member_name} className="w-10 h-10 rounded-2xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand font-black text-sm">
                              {member.member_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-bold text-foreground">{member.member_name}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('classroom.ui.students_role_badge')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                        {formatDateTime(member.joined_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground">
                              {kickingId === member.member_id
                                ? <Loader2 size={16} className="animate-spin" />
                                : <MoreVertical size={16} />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => router.push(`/space/classrooms/${classroomUid}/students/${member.member_id}`)}>
                              <ClipboardCheck size={14} className="mr-2" />
                              {t('classroom.ui.students_action_view_detail')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/space/classrooms/${classroomUid}/students/${member.member_id}/analyze`)}>
                              <BarChart2 size={14} className="mr-2" />
                              {t('classroom.ui.students_action_view_analysis')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setMemberToKick(member)}>
                              <UserX size={14} className="mr-2" />
                              {t('classroom.ui.students_action_kick')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setMemberToBlock({ member, scope: 'classroom' })}
                            >
                              <ShieldBan size={14} className="mr-2" />
                              {t('classroom.ui.students_action_block_classroom')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setMemberToBlock({ member, scope: 'global' })}
                            >
                              <ShieldBan size={14} className="mr-2" />
                              {t('classroom.ui.students_action_block_global')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
