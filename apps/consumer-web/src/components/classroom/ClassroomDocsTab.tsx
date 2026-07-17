'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  File as FileIcon,
  Download,
  Search,
  Filter,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { Input } from '@shared/components/ui/input';
import { toast } from 'sonner';

export type ClassroomDocItem = {
  uid: string;
  name: string;
  url: string;
  file_type?: string;
  size?: number;
  metadata?: Record<string, string>;
  created_at?: string;
};

type Props = {
  classroomUid: string;
  accessToken: string | null;
  apiBase: string;
  showFilter?: boolean;
  onLoaded?: (docs: ClassroomDocItem[]) => void;
};

function pickIcon(fileType?: string) {
  const t = (fileType || '').toLowerCase();
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(t)) return FileText;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(t)) return FileImage;
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(t)) return FileVideo;
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(t)) return FileAudio;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(t)) return FileArchive;
  if (['xls', 'xlsx', 'csv'].includes(t)) return FileSpreadsheet;
  return FileIcon;
}

function formatSize(bytes?: number) {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function ClassroomDocsTab({ classroomUid, accessToken, apiBase, showFilter = true, onLoaded }: Props) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<ClassroomDocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string>('__all__');

  useEffect(() => {
    let cancelled = false;
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const res = await fetch(`${apiBase}/api/v1/consumer/course/classrooms/${classroomUid}/docs/`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ClassroomDocItem[];
        if (cancelled) return;
        setDocs(Array.isArray(data) ? data : []);
        onLoaded?.(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) toast.error(t('classroom.labels.docs_load_error', undefined, { defaultValue: 'Không thể tải danh sách tài liệu.' }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchDocs();
    return () => {
      cancelled = true;
    };
  }, [classroomUid, accessToken, apiBase, onLoaded, t]);

  const sections = useMemo(() => {
    const set = new Set<string>();
    for (const d of docs) {
      const s = d.metadata?.section?.trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort();
  }, [docs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      if (activeSection !== '__all__' && (d.metadata?.section ?? '') !== activeSection) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q);
    });
  }, [docs, search, activeSection]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-indigo-600" />
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-tighter">
            {t('classroom.labels.docs_title', undefined, { defaultValue: 'Tài liệu học tập' })}
          </h3>
          <span className="text-xs font-bold text-slate-400">
            ({filtered.length}/{docs.length})
          </span>
        </div>
        {showFilter && (
          <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
            <div className="relative max-w-xs flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('classroom.labels.docs_search_placeholder', undefined, { defaultValue: 'Tìm tài liệu...' })}
                className="pl-8 h-9 text-xs"
              />
            </div>
            {sections.length > 0 && (
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={activeSection}
                  onChange={(e) => setActiveSection(e.target.value)}
                  className="pl-8 pr-3 h-9 text-xs font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="__all__">{t('classroom.labels.docs_filter_all', undefined, { defaultValue: 'Tất cả mục' })}</option>
                  {sections.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm font-medium">{t('classroom.labels.docs_loading', undefined, { defaultValue: 'Đang tải...' })}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">
            {docs.length === 0
              ? t('classroom.labels.docs_empty', undefined, { defaultValue: 'Giáo viên chưa đăng tài liệu nào cho lớp này.' })
              : t('classroom.labels.docs_no_match', undefined, { defaultValue: 'Không có tài liệu nào khớp bộ lọc.' })}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 min-w-0">
          {filtered.map((d) => {
            const Icon = pickIcon(d.file_type);
            const section = d.metadata?.section?.trim();
            return (
              <a
                key={d.uid}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all min-w-0 overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate min-w-0 flex-1" title={d.name}>{d.name}</p>
                    <Download size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-wrap">
                    {d.file_type && <span className="px-1.5 py-0.5 bg-slate-100 rounded">{d.file_type}</span>}
                    {d.size ? <span>{formatSize(d.size)}</span> : null}
                    {d.created_at ? <span>{formatDate(d.created_at)}</span> : null}
                    {section && (
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded normal-case tracking-normal">
                        {section}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
