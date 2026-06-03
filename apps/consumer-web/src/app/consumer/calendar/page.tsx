'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';

export default function CalendarPage() {
  return (
    <div className="p-6 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Academic Calendar</h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">Manage your schedule and upcoming deadlines.</p>
          </div>
          <div className="flex items-center gap-2.5">
             <div className="flex items-center bg-white dark:bg-card border border-gray-100 dark:border-border rounded-lg overflow-hidden shadow-sm">
                <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-muted transition-colors cursor-pointer">
                  <ChevronLeft size={14} className="text-gray-500" />
                </button>
                <div className="h-4 w-px bg-gray-100 dark:bg-border" />
                <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-muted transition-colors cursor-pointer">
                  <ChevronRight size={14} className="text-gray-500" />
                </button>
             </div>
             <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-3.5 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-[#4F46E5]/15 active:scale-[0.98] cursor-pointer">
                <Plus size={12} />
                New Event
              </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Main Calendar View (Mock) */}
          <Card className="lg:col-span-5 rounded-[20px] border-gray-100 dark:border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 dark:border-border/50 flex items-center justify-between bg-gray-50/30">
              <span className="text-sm font-bold text-gray-900 dark:text-white">June 2026</span>
              <div className="flex gap-1">
                {['Day', 'Week', 'Month'].map((view) => (
                  <button key={view} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${view === 'Month' ? 'bg-white dark:bg-muted shadow-sm text-[#4F46E5]' : 'text-gray-500 hover:text-gray-700'}`}>
                    {view}
                  </button>
                ))}
              </div>
            </div>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-gray-50 dark:border-border/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-2 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/10">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-[80px]">
                {Array.from({ length: 35 }).map((_, i) => {
                  const day = i - 0; // Simplified mock
                  const isCurrentMonth = day > 0 && day <= 30;
                  const isToday = day === 1;
                  return (
                    <div key={i} className={`p-2 border-r border-b border-gray-50 dark:border-border/50 transition-colors hover:bg-gray-50/50 dark:hover:bg-muted/10 ${!isCurrentMonth ? 'bg-gray-50/20 opacity-30' : ''}`}>
                      <span className={`text-[10px] font-bold ${isToday ? 'w-5 h-5 flex items-center justify-center bg-[#4F46E5] text-white rounded-full' : 'text-gray-500'}`}>
                        {isCurrentMonth ? day : ''}
                      </span>
                      {isToday && (
                        <div className="mt-1 space-y-1">
                          <div className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-[#4F46E5] text-[7px] font-bold rounded border-l-2 border-[#4F46E5] truncate">
                            9:00 AM React Workshop
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sidebar */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock size={12} className="text-[#4F46E5]" />
                Upcoming
              </h3>
              <div className="space-y-3">
                {[
                  { title: 'Database Quiz', time: 'Tomorrow, 10:00 AM', color: 'bg-red-500' },
                  { title: 'Project Submission', time: 'June 5, 11:59 PM', color: 'bg-amber-500' },
                  { title: 'Live Mentoring', time: 'June 8, 2:00 PM', color: 'bg-blue-500' },
                ].map((event, i) => (
                  <div key={i} className="group p-3 rounded-xl bg-white dark:bg-card border border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`w-1 h-8 rounded-full ${event.color}`} />
                      <div>
                        <p className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-[#4F46E5] transition-colors">{event.title}</p>
                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">{event.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-[20px] bg-[#EBF2FF] dark:bg-muted/30 border border-indigo-100 dark:border-indigo-900/20">
              <CalendarIcon size={24} className="text-[#4F46E5] mb-2" />
              <p className="text-[11px] font-bold text-gray-900 dark:text-white">Sync with Google</p>
              <p className="text-[9px] text-gray-500 mt-1 mb-3">Connect your academic calendar with your personal devices.</p>
              <button className="w-full py-1.5 bg-white dark:bg-muted rounded-lg text-[9px] font-bold text-gray-700 shadow-sm border border-gray-100 dark:border-border hover:bg-gray-50 cursor-pointer">
                Connect Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
