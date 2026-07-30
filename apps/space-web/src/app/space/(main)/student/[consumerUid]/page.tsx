'use client';

import { useEffect, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, BarChart2, Mail, Calendar,
  CheckCircle2, Clock, ChevronRight, GraduationCap,
} from 'lucide-react';
import { studentApi } from '@/lib/api/student';
import type { StudentDetail, StudentClassroomStat } from '@/lib/api/types';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function GradeBadge({ avg }: { avg: number | null }) {
  if (avg === null) return <span className="text-xs text-muted-foreground">No grades yet</span>;
  const color = avg >= 8 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
    : avg >= 5 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400'
    : 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {avg.toFixed(1)}
    </span>
  );
}

function ClassroomRow({ row, consumerUid }: { row: StudentClassroomStat; consumerUid: string }) {
  const submitRate = row.total_exams > 0
    ? Math.round((row.submitted_count / row.total_exams) * 100)
    : null;

  return (
    <Link
      href={`/space/classrooms/${row.classroom.uid}/details`}
      className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary-brand hover:shadow-sm dark:hover:border-primary-brand-dark transition-all"
    >
      <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary-brand-light dark:bg-primary-brand-dark/40">
        <BookOpen size={18} className="text-primary-brand" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary-brand dark:group-hover:text-primary-brand transition-colors">
          {row.classroom.name}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar size={10} />
            Joined {formatDate(row.joined_at)}
          </span>
          {submitRate !== null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 size={10} />
              {row.submitted_count}/{row.total_exams} submitted
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <GradeBadge avg={row.avg_grade} />
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg">
          <BarChart2 size={12} />
          Chart
        </div>
        <ChevronRight size={15} className="text-muted-foreground/40 group-hover:text-primary-brand transition-colors" />
      </div>
    </Link>
  );
}

export default function StudentDetailPage() {
  const { consumerUid } = useParams<{ consumerUid: string }>();
  const router = useRouter();
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    studentApi.getStudentDetail(consumerUid)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [consumerUid]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded-lg" />
        <div className="h-40 bg-muted rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-base font-semibold text-foreground">Student not found</p>
        <Button onClick={() => router.back()} className="mt-3 text-sm text-primary-brand hover:underline">
          Go back
        </Button>
      </div>
    );
  }

  const { consumer, classrooms } = data;
  const totalExams = classrooms.reduce((s, c) => s + c.total_exams, 0);
  const totalSubmitted = classrooms.reduce((s, c) => s + c.submitted_count, 0);
  const gradesWithValue = classrooms.filter(c => c.avg_grade !== null);
  const overallAvg = gradesWithValue.length > 0
    ? gradesWithValue.reduce((s, c) => s + (c.avg_grade ?? 0), 0) / gradesWithValue.length
    : null;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Back to students
      </Button>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <Avatar className="h-16 w-16 border-2 border-muted flex-shrink-0">
            <AvatarImage src={consumer.avatar_url} alt={consumer.full_name} />
            <AvatarFallback className="bg-primary-brand-light text-primary-brand-dark dark:bg-primary-brand-dark dark:text-primary-brand-muted font-bold text-lg">
              {initials(consumer.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground">{consumer.full_name || '(No name)'}</h2>
            <p className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Mail size={13} /> {consumer.email}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Clock size={13} /> First joined {formatDate(consumer.first_joined_at)}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{classrooms.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Classrooms</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-2xl font-bold text-foreground">{totalSubmitted}<span className="text-sm font-normal text-muted-foreground">/{totalExams}</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Assignments submitted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {overallAvg !== null ? overallAvg.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Overall avg grade</p>
          </div>
        </div>
      </div>

      {/* Classrooms */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap size={16} className="text-primary-brand" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Classrooms ({classrooms.length})
          </h3>
        </div>

        {classrooms.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No classrooms found.</p>
        ) : (
          <div className="space-y-2.5">
            {classrooms.map(row => (
              <ClassroomRow key={row.classroom.uid} row={row} consumerUid={consumerUid} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
