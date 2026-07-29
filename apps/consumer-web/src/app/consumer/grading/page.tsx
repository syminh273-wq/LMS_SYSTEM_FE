'use client';

import * as React from 'react';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import GradingScaleView from '@/components/grading/GradingScaleView';

export default function GradingScalePage() {
  const { t } = useTranslation();
  const g = (key: string, fallback: string) => t(`grading.${key}`, fallback);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <GraduationCap size={22} />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            {g('title', 'Quy đổi điểm')}
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {g('subtitle', 'Bảng quy đổi điểm và XP hiện đang áp dụng trong hệ thống')}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs font-medium text-foreground leading-relaxed">
          {g('intro', 'Trang này giúp bạn hiểu cách điểm Quiz/Exam và XP được tính, cùng các mốc cấp bậc để đạt được khi học tập.')}
        </p>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-2">
          {g('last_updated', 'Cập nhật theo cấu hình backend')}
        </p>
      </div>

      <GradingScaleView showLeaderboard={false} />
    </div>
  );
}
