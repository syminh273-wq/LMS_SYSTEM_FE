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
  Folder as FolderIcon,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Home,
  Loader2,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Download,
  Lock,
  Eye,
  Crown,
} from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import {
  fetchDocsTree,
  fetchDocsInFolder,
  sortDocs,
} from './api';
import { buildFolderTree, findPathToFolder } from './tree-utils';
import type { ClassroomDoc, ClassroomFolder, SortField, SortDir, FolderNode } from './types';
import { DocViewerPanel } from '../doc-viewer/DocViewerPanel';
import { isMediaFile } from '../doc-viewer/utils';

const ICON_BY_TYPE: Record<string, typeof FileText> = {
  pdf: FileText, doc: FileText, docx: FileText, txt: FileText, md: FileText,
  jpg: FileImage, jpeg: FileImage, png: FileImage, gif: FileImage, webp: FileImage, svg: FileImage, bmp: FileImage,
  mp4: FileVideo, mov: FileVideo, avi: FileVideo, mkv: FileVideo, webm: FileVideo,
  mp3: FileAudio, wav: FileAudio, ogg: FileAudio, m4a: FileAudio,
  zip: FileArchive, rar: FileArchive, '7z': FileArchive, tar: FileArchive, gz: FileArchive,
  xls: FileSpreadsheet, xlsx: FileSpreadsheet, csv: FileSpreadsheet,
};

function pickIcon(fileType?: string) {
  return ICON_BY_TYPE[(fileType || '').toLowerCase()] ?? FileIcon;
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
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

type ProgressByDoc = Record<string, { read_progress: number; is_completed: boolean; note_count: number }>;

type Props = {
  classroomUid: string;
  apiBase: string;
  accessToken: string | null;
  t: (key: string, fallback?: string) => string;
  isPaidClassroom?: boolean;
  hasPaid?: boolean;
  onUpgrade?: () => void;
  upgrading?: boolean;
};

function NodeRow({
  node,
  depth,
  selected,
  onSelect,
  isPreview,
  locked,
  paidLocked,
}: {
  node: FolderNode;
  depth: number;
  selected: boolean;
  onSelect: (id: string) => void;
  isPreview?: boolean;
  locked?: boolean;
  paidLocked: boolean;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer text-sm font-medium transition ${
          selected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
        } ${locked ? 'opacity-60' : ''}`}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => onSelect(node.uid)}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="p-0.5 text-slate-400 hover:text-slate-700"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? open ? <ChevronDown size={14} /> : <ChevronRight size={14} /> : <span className="inline-block w-[14px]" />}
        </button>
        {open ? <FolderOpen size={15} className="shrink-0" /> : <FolderIcon size={15} className="shrink-0" />}
        <span className="truncate flex-1 ml-1">{node.name}</span>
        {isPreview && <Eye size={12} className="text-emerald-600" title="Preview" />}
        {locked && <Lock size={12} className="text-slate-400" title="Cần nâng cấp" />}
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map((c) => (
            <NodeRow
              key={c.uid}
              node={c}
              depth={depth + 1}
              selected={false}
              onSelect={onSelect}
              isPreview={Boolean((c as any).is_preview_only)}
              locked={paidLocked && !(c as any).is_preview_only}
              paidLocked={paidLocked}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const SORT_FIELDS: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Tên' },
  { field: 'created_at', label: 'Ngày tải' },
  { field: 'size', label: 'Dung lượng' },
  { field: 'file_type', label: 'Loại' },
];

export function ClassroomDocsViewer({ classroomUid, apiBase, accessToken, t, isPaidClassroom = false, hasPaid = false, onUpgrade, upgrading }: Props) {
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [allFolders, setAllFolders] = useState<ClassroomFolder[]>([]);
  const [rootDocs, setRootDocs] = useState<ClassroomDoc[]>([]);
  const [folderDocs, setFolderDocs] = useState<ClassroomDoc[]>([]);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [openDoc, setOpenDoc] = useState<ClassroomDoc | null>(null);
  const [progressByDoc, setProgressByDoc] = useState<ProgressByDoc>({});

  const ctx = useMemo(() => ({ apiBase, accessToken, classroomUid }), [apiBase, accessToken, classroomUid]);
  const paidLocked = isPaidClassroom && !hasPaid;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDocsTree(ctx)
      .then((data: any) => {
        if (cancelled) return;
        setAllFolders(data.folders);
        setRootDocs(data.docs_root);
        setPreviewOnly(Boolean(data.preview_only));
        setTree(buildFolderTree(data.folders));
      })
      .catch(() => {
        if (!cancelled) toast.error(t('classroom.labels.docs_load_error', 'Không thể tải danh sách tài liệu.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx, t]);

  useEffect(() => {
    if (selectedFolderId === null) {
      return;
    }
    let cancelled = false;
    fetchDocsInFolder(ctx, selectedFolderId)
      .then((docs) => {
        if (!cancelled) setFolderDocs(docs);
      })
      .catch(() => {
        if (!cancelled) setFolderDocs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx, selectedFolderId]);

  // Fetch progress for each doc (lightweight, only fields we need)
  const allVisibleDocs = useMemo(() => {
    const map = new Map<string, ClassroomDoc>();
    for (const d of rootDocs) map.set(d.uid, d);
    for (const d of folderDocs) map.set(d.uid, d);
    return Array.from(map.values());
  }, [rootDocs, folderDocs]);

  useEffect(() => {
    let cancelled = false;
    const docsToFetch = allVisibleDocs.filter((d) => !(d.uid in progressByDoc));
    if (docsToFetch.length === 0) return;
    Promise.all(
      docsToFetch.map((d) =>
        fetch(`${ctx.apiBase}/api/v1/consumer/course/classrooms/${ctx.classroomUid}/docs/${d.uid}/progress/`, {
          headers: ctx.accessToken ? { Authorization: `Bearer ${ctx.accessToken}` } : {},
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        setProgressByDoc((prev) => {
          const next = { ...prev };
          docsToFetch.forEach((d, i) => {
            const r = results[i] as { read_progress?: number; is_completed?: boolean; note_count?: number } | null;
            if (r) {
              next[d.uid] = {
                read_progress: r.read_progress ?? 0,
                is_completed: r.is_completed ?? false,
                note_count: r.note_count ?? 0,
              };
            }
          });
          return next;
        });
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [allVisibleDocs, ctx]);

  const currentDocs = selectedFolderId === null ? rootDocs : folderDocs;
  const currentBreadcrumb = useMemo(() => {
    if (selectedFolderId === null) return [];
    return findPathToFolder(allFolders, selectedFolderId);
  }, [allFolders, selectedFolderId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q ? currentDocs.filter((d) => d.name.toLowerCase().includes(q)) : currentDocs;
    return sortDocs(base, sortField, sortDir);
  }, [currentDocs, search, sortField, sortDir]);

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
      {paidLocked && (
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-amber-700" />
            <span className="text-sm font-bold text-foreground">Chỉ hiển thị Preview folder cho đến khi bạn nâng cấp.</span>
          </div>
          {onUpgrade && (
            <Button
              onClick={onUpgrade}
              disabled={upgrading}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 rounded-lg px-4 shadow-sm shadow-amber-500/20"
            >
              {upgrading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Crown size={12} className="mr-1" />}
              Nâng cấp
            </Button>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedFolderId(null)}
          className={`px-2 py-1 rounded-md font-bold ${
            selectedFolderId === null ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'
          }`}
        >
          {t('classroom.docs.root_label', 'Tất cả tài liệu')}
        </button>
        {currentBreadcrumb.map((f) => (
          <React.Fragment key={f.uid}>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={() => setSelectedFolderId(f.uid)}
              className={`px-2 py-1 rounded-md font-bold ${
                f.uid === selectedFolderId ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'
              }`}
            >
              <FolderIcon size={12} className="inline-block mr-1" />
              {f.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col gap-1 w-full lg:w-64 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 pt-1 pb-2">
            {t('classroom.docs.folders_title', 'Thư mục')}
          </span>
          <div
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer text-sm font-medium transition ${
              selectedFolderId === null ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setSelectedFolderId(null)}
          >
            <Home size={15} className="shrink-0" />
            <span className="truncate flex-1 ml-1">
              {t('classroom.docs.root_label', 'Tất cả tài liệu')}
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
              {rootDocs.length}
            </span>
          </div>
          {tree.map((node) => (
            <NodeRow
              key={node.uid}
              node={node}
              depth={0}
              selected={selectedFolderId === node.uid}
              onSelect={setSelectedFolderId}
              isPreview={Boolean((node as any).is_preview_only)}
              locked={paidLocked && !(node as any).is_preview_only}
              paidLocked={paidLocked}
            />
          ))}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative max-w-xs flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('classroom.docs.search_placeholder', 'Tìm tài liệu...')}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <ArrowUpDown size={14} className="text-slate-400" />
              {SORT_FIELDS.map((s) => (
                <button
                  key={s.field}
                  type="button"
                  onClick={() => handleSortChange(s.field)}
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    sortField === s.field ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                  {sortField === s.field && (
                    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading && currentDocs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm font-medium">{t('classroom.labels.docs_loading', 'Đang tải...')}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">
                {currentDocs.length === 0
                  ? t('classroom.labels.docs_empty', 'Giáo viên chưa đăng tài liệu nào cho lớp này.')
                  : t('classroom.labels.docs_no_match', 'Không có tài liệu nào khớp bộ lọc.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 min-w-0">
              {filtered.map((d) => {
                const Icon = pickIcon(d.file_type);
                const prog = progressByDoc[d.uid];
                const completed = prog?.is_completed ?? false;
                const pct = prog?.read_progress ?? 0;
                const media = isMediaFile(d.file_type);
                return (
                  <button
                    type="button"
                    key={d.uid}
                    onClick={() => setOpenDoc(d)}
                    className="group relative text-left flex items-start gap-3 p-3 pr-10 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all min-w-0 overflow-hidden"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100">
                      {React.createElement(Icon, { size: 20 })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate min-w-0 flex-1" title={d.name}>{d.name}</p>
                        {completed && !media && (
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-wrap">
                        {d.file_type && <span className="px-1.5 py-0.5 bg-slate-100 rounded">{d.file_type}</span>}
                        {d.size ? <span>{formatSize(d.size)}</span> : null}
                        {d.created_at ? <span>{formatDate(d.created_at)}</span> : null}
                        {pct > 0 && (
                          <span className={`px-1.5 py-0.5 rounded ${completed ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {pct}%
                          </span>
                        )}
                      </div>
                      {pct > 0 && !completed && (
                        <div className="mt-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-2 right-2 p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition"
                      title="Tải xuống"
                    >
                      <Download size={14} />
                    </a>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {openDoc && (
        <DocViewerPanel
          doc={openDoc}
          ctx={ctx}
          open
          onClose={() => setOpenDoc(null)}
          onProgressChange={(p) => {
            setProgressByDoc((prev) => ({
              ...prev,
              [p.resource_uid]: {
                read_progress: p.read_progress,
                is_completed: p.is_completed,
                note_count: p.note_count,
              },
            }));
          }}
          t={t}
        />
      )}
    </div>
  );
}
