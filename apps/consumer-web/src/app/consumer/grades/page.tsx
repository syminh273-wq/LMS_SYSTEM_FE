'use client';

import * as React from 'react';
import { Award, BookOpen, GraduationCap, TrendingUp, ChevronRight, FileText } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';

export default function GradesPage() {
  return (
    <div className="p-6 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Grades & Performance</h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">Track your academic progress and achievements.</p>
          </div>
          <button className="bg-white dark:bg-card border border-gray-100 dark:border-border px-3.5 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md cursor-pointer">
            <FileText size={12} className="text-[#4F46E5]" />
            Export Transcript
          </button>
        </header>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Overall GPA', value: '3.85', icon: GraduationCap, color: 'bg-indigo-50 text-[#4F46E5]' },
            { label: 'Credits Earned', value: '42 / 120', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Rank', value: 'Top 5%', icon: Award, color: 'bg-amber-50 text-amber-600' },
          ].map((stat, i) => (
            <Card key={i} className="rounded-2xl border-gray-100 dark:border-border shadow-sm overflow-hidden">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Grades */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={12} className="text-[#4F46E5]" />
            Recent Results
          </h3>
          
          <div className="space-y-3">
            {[
              { course: 'Advanced Web Development', assignment: 'Final Project', grade: '95/100', status: 'A+', date: '2 days ago' },
              { course: 'Database Management Systems', assignment: 'Midterm Exam', grade: '88/100', status: 'B+', date: '1 week ago' },
              { course: 'UI/UX Design Principles', assignment: 'Case Study', grade: '92/100', status: 'A', date: '2 weeks ago' },
              { course: 'Mobile App Development', assignment: 'Quiz #3', grade: '100/100', status: 'A+', date: '3 weeks ago' },
            ].map((item, i) => (
              <Card key={i} className="group rounded-[20px] border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-muted flex items-center justify-center text-[#4F46E5] font-black text-[10px]">
                        {item.status}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-gray-900 dark:text-white group-hover:text-[#4F46E5] transition-colors">{item.course}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{item.assignment}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[11px] font-black text-gray-900 dark:text-white">{item.grade}</p>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">{item.date}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-[#4F46E5] transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Legend/Info */}
        <div className="p-5 rounded-[24px] bg-[#f8faff] dark:bg-muted/20 border border-gray-100 dark:border-border flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="w-7 h-7 rounded-full bg-white dark:bg-muted border-2 border-[#f8faff] dark:border-muted flex items-center justify-center">
                      <Award size={12} className="text-amber-500" />
                   </div>
                 ))}
              </div>
              <div>
                 <p className="text-[11px] font-bold text-gray-900 dark:text-white">You've unlocked 12 achievements</p>
                 <p className="text-[9px] text-gray-500">Keep up the great work to earn more badges!</p>
              </div>
           </div>
           <button className="text-[10px] font-bold text-[#4F46E5] hover:underline cursor-pointer">
              View All Badges
           </button>
        </div>
      </div>
    </div>
  );
}
