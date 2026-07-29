import * as React from 'react';
import SpaceClassroomRankingView from '@/components/ranking/SpaceClassroomRankingView';

interface RankingTabProps {
  classroomUid: string;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function RankingTab({
  classroomUid,
  t,
}: RankingTabProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-card rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-10 bg-muted/50">
          <h3 className="text-xl font-bold text-foreground">
            {t('classroom.ui.tab_ranking', 'Ranking')}
          </h3>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {t('ranking.subtitle', 'Top students by total XP earned from classroom activities.')}
          </p>
        </div>
        <div className="p-6">
          <SpaceClassroomRankingView classroomUid={classroomUid} t={t} />
        </div>
      </div>
    </div>
  );
}
