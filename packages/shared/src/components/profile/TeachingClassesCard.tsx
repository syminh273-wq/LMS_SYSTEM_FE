import * as React from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type TeachingClassItem = {
  uid: string;
  name: string;
  description?: string;
  category?: string;
  pricing_type?: 'free' | 'paid';
  price_vnd?: number;
  max_students?: number;
  preview_folder_uid?: string | null;
  created_at?: string;
};

export type TeachingClassesCardProps = {
  classes: TeachingClassItem[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
  detailHrefBase?: string;
  title?: string;
};

export function TeachingClassesCard({
  classes,
  loading = false,
  emptyText = 'Chưa có lớp học công khai nào.',
  className,
  detailHrefBase = '/space/classrooms',
  title = 'Lớp đang giảng dạy',
}: TeachingClassesCardProps) {
  return (
    <section
      className={cn(
        'bg-white border border-slate-200 rounded-xl overflow-hidden card-elevated',
        className,
      )}
    >
      <header className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-slate-100">
        <BookOpen className="size-4 text-indigo-600" />
        <h2 className="text-[14px] font-bold text-slate-900">{title}</h2>
        {!loading && classes.length > 0 && (
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
            {classes.length}
          </span>
        )}
      </header>

      <div className="px-4 sm:px-5 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-500">
            <Loader2 className="size-4 animate-spin mr-2" />
            <span className="text-[13px]">Đang tải…</span>
          </div>
        ) : classes.length === 0 ? (
          <p className="text-[13px] text-slate-500 py-3 text-center">{emptyText}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {classes.map((c) => (
              <li key={c.uid}>
                <a
                  href={`${detailHrefBase}/${c.uid}`}
                  className="flex items-center gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors group"
                >
                  <span className="size-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <BookOpen className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-slate-900 truncate group-hover:text-indigo-700">
                      {c.name}
                    </span>
                    {c.category && (
                      <span className="block text-[11px] text-slate-500 capitalize">
                        {c.category}
                        {c.pricing_type === 'paid' && c.price_vnd
                          ? ` · ${Number(c.price_vnd).toLocaleString('vi-VN')}đ`
                          : c.pricing_type === 'free'
                          ? ' · Miễn phí'
                          : ''}
                      </span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
