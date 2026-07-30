'use client';

import { use, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Info,
  FileText,
  MessageSquare,
  Video,
  ClipboardList,
  Gamepad2,
  Users,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export default function StudentsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const router = useRouter();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [openGroups, setOpenGroups] = useState({ classroom: true, learning: true, students: true });
  const toggleGroup = (key: keyof typeof openGroups) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const goToTab = (tab: string) =>
    router.push(`/space/classrooms/${uid}/details?tab=${tab}`);

  return (
    <div className="flex gap-8 items-start">
      {/* Classroom sidebar */}
      <div className={`shrink-0 transition-all duration-300 space-y-3 ${sidebarCollapsed ? 'w-[52px]' : 'w-[268px]'}`}>
        {sidebarCollapsed ? (
          /* ── Collapsed: icon-only ── */
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden py-1">
            <Button
              onClick={() => setSidebarCollapsed(false)}
              title="Mở rộng sidebar"
              variant="ghost"
              className="w-full flex justify-center py-3 hover:bg-muted/50 transition-colors"
            >
              <ChevronsRight size={16} className="text-muted-foreground" />
            </Button>
            <div className="mx-3 border-t border-border mb-1" />
            {([
              { id: 'info',     label: 'Thông tin chung',    icon: Info },
              { id: 'docs',     label: 'Tài liệu học tập',   icon: FileText },
              { id: 'chat',     label: 'Thảo luận lớp học',  icon: MessageSquare },
              { id: 'meeting',  label: 'Phòng họp',          icon: Video },
              { id: 'exams',    label: 'Bài kiểm tra',       icon: ClipboardList },
              { id: 'quiz',     label: 'Quiz Game',           icon: Gamepad2 },
              { id: 'students', label: 'Danh sách sinh viên', icon: Users },
            ] as const).map(({ id, label, icon: Icon }) => {
              const isActive = id === 'students';
              return (
                <Button
                  key={id}
                  title={label}
                  onClick={() => goToTab(id)}
                  variant="ghost"
                  className={`w-full flex justify-center py-3 rounded-none transition-colors relative ${
                    isActive
                      ? 'text-primary-brand bg-primary-brand-light hover:bg-primary-brand-light hover:text-primary-brand'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-muted-foreground'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-5 bg-primary-brand rounded-r-full top-1/2 -translate-y-1/2" />
                  )}
                  <Icon size={18} />
                </Button>
              );
            })}
          </div>
        ) : (
          /* ── Expanded: full labels ── */
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            {/* Collapse button */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-border">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">MENU</span>
              <Button
                onClick={() => setSidebarCollapsed(true)}
                title="Thu nhỏ sidebar"
                variant="ghost"
                size="icon"
                className="rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronsLeft size={15} className="text-muted-foreground" />
              </Button>
            </div>

            {/* Nhóm 1: Thông tin lớp */}
            <Button
              onClick={() => toggleGroup('classroom')}
              variant="ghost"
              className="w-full flex items-center justify-between px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Thông tin lớp
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openGroups.classroom ? '' : '-rotate-90'}`}
              />
            </Button>
            {openGroups.classroom && (
              <div className="pb-1 px-1">
                {[
                  { id: 'info',    label: 'Thông tin chung',   icon: Info },
                  { id: 'docs',    label: 'Tài liệu học tập',  icon: FileText },
                  { id: 'chat',    label: 'Thảo luận lớp học', icon: MessageSquare },
                  { id: 'meeting', label: 'Phòng họp',         icon: Video },
                ].map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    onClick={() => goToTab(id)}
                    variant="ghost"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-muted-foreground hover:bg-muted/50 group"
                  >
                    <Icon size={18} className="text-muted-foreground group-hover:text-muted-foreground" />
                    {label}
                  </Button>
                ))}
              </div>
            )}

            <div className="mx-4 border-t border-border" />

            {/* Nhóm 2: Học tập & Đánh giá */}
            <Button
              onClick={() => toggleGroup('learning')}
              variant="ghost"
              className="w-full flex items-center justify-between px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Học tập & Đánh giá
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openGroups.learning ? '' : '-rotate-90'}`}
              />
            </Button>
            {openGroups.learning && (
              <div className="pb-1 px-1">
                {[
                  { id: 'exams', label: 'Bài kiểm tra', icon: ClipboardList },
                  { id: 'quiz',  label: 'Quiz Game',    icon: Gamepad2 },
                ].map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    onClick={() => goToTab(id)}
                    variant="ghost"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-muted-foreground hover:bg-muted/50 group"
                  >
                    <Icon size={18} className="text-muted-foreground group-hover:text-muted-foreground" />
                    {label}
                  </Button>
                ))}
              </div>
            )}

            <div className="mx-4 border-t border-border" />

            {/* Nhóm 3: Quản lý sinh viên — always active */}
            <Button
              onClick={() => toggleGroup('students')}
              variant="ghost"
              className="w-full flex items-center justify-between px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Quản lý sinh viên
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openGroups.students ? '' : '-rotate-90'}`}
              />
            </Button>
            {openGroups.students && (
              <div className="pb-2 px-1">
                <Button
                  onClick={() => goToTab('students')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative bg-primary-brand-light text-primary-brand"
                >
                  <div className="absolute left-0 w-1.5 h-5 bg-primary-brand rounded-r-full" />
                  <Users size={18} className="text-primary-brand" />
                  Danh sách sinh viên
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Page content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
