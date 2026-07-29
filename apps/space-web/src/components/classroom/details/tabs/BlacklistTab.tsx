'use client';

import * as React from 'react';
import { ShieldBan, ShieldOff, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { BlacklistEntry } from '@/lib/api/types';

interface BlacklistTabProps {
  blacklist: BlacklistEntry[];
  loadingBlacklist: boolean;
  unblockingId: string | null;
  setUnblockingId: (id: string | null) => void;
  setBlacklist: React.Dispatch<React.SetStateAction<BlacklistEntry[]>>;
  formatDate: (v: string | null | undefined) => string;
  classroomUid: string;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
  onUnblock: (entry: BlacklistEntry) => Promise<void> | void;
}

export default function BlacklistTab({
  blacklist,
  loadingBlacklist,
  unblockingId,
  setUnblockingId: _setUnblockingId,
  setBlacklist: _setBlacklist,
  formatDate,
  classroomUid: _classroomUid,
  t,
  onUnblock,
}: BlacklistTabProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-card rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-10 bg-muted/50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.blacklist_title')}</h3>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {loadingBlacklist ? t('classroom.ui.blacklist_loading') : (
                <>
                  {t('classroom.ui.blacklist_count_classroom', undefined, { count: blacklist.filter(e => e.scope === 'classroom').length })}
                  {' · '}
                  {t('classroom.ui.blacklist_count_global', undefined, { count: blacklist.filter(e => e.scope === 'global').length })}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="p-10">
          {loadingBlacklist ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : blacklist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 bg-muted/30 rounded-[32px]">
              <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4 shadow-sm">
                <ShieldBan size={24} className="opacity-40" />
              </div>
              <p className="text-sm font-bold text-foreground uppercase tracking-widest">{t('classroom.ui.blacklist_empty')}</p>
              <p className="text-xs font-medium mt-1">{t('classroom.ui.blacklist_empty_hint')}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] bg-card shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">{t('classroom.ui.blacklist_th_user')}</th>
                    <th className="px-6 py-4">{t('classroom.ui.blacklist_th_reason')}</th>
                    <th className="px-6 py-4">{t('classroom.ui.blacklist_th_blocked_at')}</th>
                    <th className="px-6 py-4 text-right">{t('classroom.ui.blacklist_th_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {blacklist.map(entry => (
                    <tr key={entry.consumer_uid} className="hover:bg-rose-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${entry.scope === 'global' ? 'bg-rose-100' : 'bg-orange-100'}`}>
                            <ShieldBan size={16} className={entry.scope === 'global' ? 'text-rose-500' : 'text-orange-500'} />
                          </div>
                          <div>
                            <div className="text-xs font-black text-foreground font-mono">{entry.consumer_uid.slice(0, 8)}…</div>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                              entry.scope === 'global'
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-orange-100 text-orange-600'
                            }`}>
                              {entry.scope === 'global' ? t('classroom.ui.blacklist_scope_global') : t('classroom.ui.blacklist_scope_classroom')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs">
                        {entry.reason || <span className="italic opacity-50">{t('classroom.ui.blacklist_no_reason')}</span>}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                        {entry.created_at ? formatDate(entry.created_at) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={unblockingId === entry.consumer_uid}
                          className="rounded-xl gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                          onClick={async () => {
                            await onUnblock(entry);
                          }}
                        >
                          {unblockingId === entry.consumer_uid
                            ? <Loader2 size={13} className="animate-spin" />
                            : <ShieldOff size={13} />}
                          {t('classroom.ui.blacklist_unblock')}
                        </Button>
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
