'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon,
  Video, FileText, Users,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

const VIEW_OPTIONS = ['Day', 'Week', 'Month'] as const;

const TODAY = 15;
const CURRENT_MONTH = 6;
const CURRENT_YEAR = 2026;

const MOCK_EVENTS = [
  { day: TODAY, time: '09:00', title: 'React Workshop', type: 'live', color: 'bg-rose-500' },
  { day: 17, time: '10:00', title: 'Database Quiz', type: 'deadline', color: 'bg-amber-500' },
  { day: 20, time: '11:59', title: 'Project Submission', type: 'deadline', color: 'bg-orange-500' },
  { day: 23, time: '14:00', title: 'Live Mentoring', type: 'meeting', color: 'bg-emerald-500' },
  { day: 27, time: '09:00', title: 'Group Discussion', type: 'meeting', color: 'bg-sky-500' },
];

const UPCOMING = [
  { title: 'Database Quiz', time: 'Ngày mai, 10:00', color: 'bg-rose-500', icon: FileText, type: 'Deadline' },
  { title: 'Project Submission', time: '20/06, 23:59', color: 'bg-amber-500', icon: FileText, type: 'Deadline' },
  { title: 'Live Mentoring', time: '23/06, 14:00', color: 'bg-emerald-500', icon: Video, type: 'Live' },
  { title: 'React Workshop', time: '27/06, 09:00', color: 'bg-sky-500', icon: Users, type: 'Workshop' },
];

export default function CalendarPage() {
  const [view, setView] = useState<typeof VIEW_OPTIONS[number]>('Month');

  const daysInMonth = 30;
  const firstDayOfWeek = new Date(CURRENT_YEAR, CURRENT_MONTH - 1, 1).getDay();
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDayOfWeek + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const eventsByDay = new Map<number, typeof MOCK_EVENTS>();
  MOCK_EVENTS.forEach(e => {
    if (!eventsByDay.has(e.day)) eventsByDay.set(e.day, []);
    eventsByDay.get(e.day)!.push(e);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold mb-2">
              <CalendarIcon size={11} />
              Lịch học
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Lịch học tập</h1>
            <p className="text-slate-600 text-[14px] mt-1">
              Quản lý lịch học và các deadline sắp tới
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
              <button className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors" aria-label="Tháng trước">
                <ChevronLeft size={15} />
              </button>
              <div className="h-5 w-px bg-slate-200" />
              <button className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors" aria-label="Tháng sau">
                <ChevronRight size={15} />
              </button>
            </div>
            <button className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">Sự kiện mới</span>
              <span className="sm:hidden">Mới</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl card-elevated overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-[15px] font-bold text-slate-900">Tháng 6, 2026</span>
              <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                {VIEW_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "px-2.5 py-1 text-[11.5px] font-semibold rounded-md transition-colors",
                      view === v
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {v === 'Day' ? 'Ngày' : v === 'Week' ? 'Tuần' : 'Tháng'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                <div key={day} className="py-2.5 text-center text-[10.5px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const isToday = day === TODAY;
                const events = day ? eventsByDay.get(day) ?? [] : [];
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[88px] sm:min-h-[100px] p-1.5 sm:p-2 border-r border-b border-slate-200 transition-colors",
                      !day ? "bg-slate-50" : "hover:bg-slate-50",
                      i % 7 === 6 && "border-r-0"
                    )}
                  >
                    {day && (
                      <>
                        <div className="flex justify-end mb-1">
                          <span className={cn(
                            "inline-flex items-center justify-center text-[11.5px] font-semibold tabular-nums w-6 h-6 rounded-md",
                            isToday
                              ? "bg-indigo-600 text-white"
                              : "text-slate-700"
                          )}>
                            {day}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {events.slice(0, 2).map((e, j) => (
                            <div
                              key={j}
                              className={cn(
                                "px-1.5 py-0.5 text-[9.5px] font-semibold text-white rounded truncate",
                                e.color
                              )}
                              title={e.title}
                            >
                              {e.title}
                            </div>
                          ))}
                          {events.length > 2 && (
                            <div className="text-[9px] text-slate-500 font-semibold px-1">
                              +{events.length - 2} khác
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 card-elevated">
              <h3 className="text-[14px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock size={14} className="text-indigo-600" />
                Sắp tới
              </h3>
              <div className="space-y-2">
                {UPCOMING.map((event, i) => {
                  const Icon = event.icon;
                  return (
                    <div
                      key={i}
                      className="group flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                    >
                      <div className={cn("w-1 h-10 rounded-full shrink-0", event.color)} />
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                          {event.title}
                        </p>
                        <p className="text-[11px] text-slate-500">{event.type} · {event.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl p-5 bg-indigo-600 text-white shadow-md">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3 border border-white/30">
                <CalendarIcon size={18} />
              </div>
              <p className="text-[13.5px] font-bold">Đồng bộ Google</p>
              <p className="text-[11.5px] text-indigo-100 mt-1 mb-3 leading-relaxed">
                Kết nối lịch học với Google Calendar để không bỏ lỡ sự kiện nào.
              </p>
              <button className="w-full h-8 rounded-lg bg-white text-indigo-700 text-[12px] font-semibold hover:bg-indigo-50 transition-colors">
                Kết nối ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
