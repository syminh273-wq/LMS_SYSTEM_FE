'use client';

import { use, useState } from 'react';
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
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden py-1">
            <button
              onClick={() => setSidebarCollapsed(false)}
              title="Mở rộng sidebar"
              className="w-full flex justify-center py-3 hover:bg-slate-50 transition-colors"
            >
              <ChevronsRight size={16} className="text-slate-400" />
            </button>
            <div className="mx-3 border-t border-slate-100 mb-1" />
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
                <button
                  key={id}
                  title={label}
                  onClick={() => goToTab(id)}
                  className={`w-full flex justify-center py-3 transition-colors relative ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-5 bg-indigo-600 rounded-r-full top-1/2 -translate-y-1/2" />
                  )}
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        ) : (
          /* ── Expanded: full labels ── */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Collapse button */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">MENU</span>
              <button
                onClick={() => setSidebarCollapsed(true)}
                title="Thu nhỏ sidebar"
                className="rounded-lg p-1 hover:bg-slate-100 transition-colors"
              >
                <ChevronsLeft size={15} className="text-slate-400" />
              </button>
            </div>

            {/* Nhóm 1: Thông tin lớp */}
            <button
              onClick={() => toggleGroup('classroom')}
              className="w-full flex items-center justify-between px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
            >
              Thông tin lớp
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openGroups.classroom ? '' : '-rotate-90'}`}
              />
            </button>
            {openGroups.classroom && (
              <div className="pb-1 px-1">
                {[
                  { id: 'info',    label: 'Thông tin chung',   icon: Info },
                  { id: 'docs',    label: 'Tài liệu học tập',  icon: FileText },
                  { id: 'chat',    label: 'Thảo luận lớp học', icon: MessageSquare },
                  { id: 'meeting', label: 'Phòng họp',         icon: Video },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => goToTab(id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-slate-500 hover:bg-slate-50 group"
                  >
                    <Icon size={18} className="text-slate-400 group-hover:text-slate-600" />
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="mx-4 border-t border-slate-100" />

            {/* Nhóm 2: Học tập & Đánh giá */}
            <button
              onClick={() => toggleGroup('learning')}
              className="w-full flex items-center justify-between px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
            >
              Học tập & Đánh giá
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openGroups.learning ? '' : '-rotate-90'}`}
              />
            </button>
            {openGroups.learning && (
              <div className="pb-1 px-1">
                {[
                  { id: 'exams', label: 'Bài kiểm tra', icon: ClipboardList },
                  { id: 'quiz',  label: 'Quiz Game',    icon: Gamepad2 },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => goToTab(id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-slate-500 hover:bg-slate-50 group"
                  >
                    <Icon size={18} className="text-slate-400 group-hover:text-slate-600" />
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="mx-4 border-t border-slate-100" />

            {/* Nhóm 3: Quản lý sinh viên — always active */}
            <button
              onClick={() => toggleGroup('students')}
              className="w-full flex items-center justify-between px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
            >
              Quản lý sinh viên
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openGroups.students ? '' : '-rotate-90'}`}
              />
            </button>
            {openGroups.students && (
              <div className="pb-2 px-1">
                <button
                  onClick={() => goToTab('students')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative bg-indigo-50 text-indigo-600"
                >
                  <div className="absolute left-0 w-1.5 h-5 bg-indigo-600 rounded-r-full" />
                  <Users size={18} className="text-indigo-600" />
                  Danh sách sinh viên
                </button>
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
