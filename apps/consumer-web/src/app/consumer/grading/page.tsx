'use client';

import * as React from 'react';
import { Calculator } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import GradingScaleView from '@/components/grading/GradingScaleView';

export default function GradingScalePage() {
  const { t } = useTranslation();
  const g = (key: string, fallback: string) => t(`grading.${key}`, fallback);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
          <Calculator size={22} />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {g('title', 'Quy đổi điểm')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {g('subtitle', 'Bảng quy đổi điểm và XP hiện đang áp dụng trong hệ thống')}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/10">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
          {g('intro', 'Trang này giúp bạn hiểu cách điểm Quiz/Exam và XP được tính, cùng các mốc cấp bậc để đạt được khi học tập.')}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-2">
          {g('last_updated', 'Cập nhật theo cấu hình backend')}
        </p>
      </div>

      <GradingScaleView showLeaderboard={false} />
    </div>
  );
}
