import { useState } from 'react';
import { Award, ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { portfolioApi, type Portfolio, type PortfolioEntry } from '@/lib/api/portfolio';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Label } from '@shared/components/ui/label';
import { CollapsibleItem } from './CollapsibleItem';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short' });
  } catch { return ''; }
}

type Props = {
  data: Portfolio;
  isOwner: boolean;
  onChanged: (next: PortfolioEntry[]) => void;
};

type CertValue = {
  title?: string;
  issuer?: string;
  year?: string | number;
  description?: string;
  file_url?: string;
};

export function CertificatesCard({ data, isOwner, onChanged }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioEntry | null>(null);
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [year, setYear] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const items = data.certificate || [];

  const startCreate = () => {
    setEditing(null);
    setTitle(''); setIssuer(''); setYear(''); setFileUrl('');
    setOpen(true);
  };

  const startEdit = (entry: PortfolioEntry) => {
    setEditing(entry);
    const v = (entry.value || {}) as CertValue;
    setTitle(v.title || '');
    setIssuer(v.issuer || '');
    setYear(String(v.year || ''));
    setFileUrl(v.file_url || '');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Vui lòng nhập tên chứng chỉ'); return; }
    setSaving(true);
    try {
      const value: CertValue = {
        title: title.trim(),
        issuer: issuer.trim(),
        year: year.trim(),
        file_url: fileUrl.trim(),
      };
      const saved = await portfolioApi.upsertEntry(
        editing?.uid ?? null,
        {
          key: 'certificate',
          value: value as unknown as Record<string, unknown>,
          is_public: true,
        }
      );
      let next: PortfolioEntry[];
      if (editing) {
        next = items.map((it) => it.uid === saved.uid ? saved : it);
      } else {
        next = [...items, saved];
      }
      onChanged(next);
      setOpen(false);
      toast.success('Đã lưu chứng chỉ');
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: PortfolioEntry) => {
    if (!confirm('Xoá chứng chỉ này?')) return;
    try {
      await portfolioApi.deleteEntry(entry.uid);
      onChanged(items.filter((it) => it.uid !== entry.uid));
      toast.success('Đã xoá');
    } catch {
      toast.error('Xoá thất bại');
    }
  };

  return (
    <section className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-amber-500" />
          <h2 className="text-xl font-bold text-foreground">Chứng chỉ & Giải thưởng</h2>
          <span className="text-xs text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        {isOwner && (
          <Button
            onClick={startCreate}
            className="inline-flex items-center gap-1 bg-amber-500 text-white"
          >
            <Plus size={13} /> Thêm
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          {isOwner ? 'Thêm chứng chỉ để học viên thấy năng lực của bạn.' : 'Chưa có chứng chỉ nào.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((it) => {
            const v = (it.value || {}) as CertValue;
            return (
              <div
                key={it.uid}
                className="relative border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Award size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CollapsibleItem
                      summary={
                        <>
                          <p className="text-sm font-bold text-foreground line-clamp-2">{v.title}</p>
                          {v.issuer && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{v.issuer}</p>
                          )}
                          {v.year && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{v.year}</p>
                          )}
                        </>
                      }
                      details={
                        v.description ? (
                          <p className="text-[11px] text-muted-foreground whitespace-pre-line">{v.description}</p>
                        ) : null
                      }
                    />
                  </div>
                </div>
                {v.file_url && (
                  <a
                    href={v.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 font-semibold"
                  >
                    Mở file <ExternalLink size={11} />
                  </a>
                )}
                {isOwner && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startEdit(it)}
                      className="w-6 h-6 flex items-center justify-center"
                    >
                      <Pencil size={11} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(it)}
                      className="w-6 h-6 flex items-center justify-center text-destructive"
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(false)}>
          <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
            <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
              <DialogTitle>{editing ? 'Sửa chứng chỉ' : 'Thêm chứng chỉ'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-5 space-y-3">
              <Label className="block">
                <span className="block text-xs font-bold text-foreground mb-1">Tên chứng chỉ *</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: AWS Solutions Architect"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-amber-500"
                />
              </Label>
              <Label className="block">
                <span className="block text-xs font-bold text-foreground mb-1">Nơi cấp</span>
                <input
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="VD: Amazon Web Services"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-amber-500"
                />
              </Label>
              <Label className="block">
                <span className="block text-xs font-bold text-foreground mb-1">Năm</span>
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="VD: 2024"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-amber-500"
                />
              </Label>
              <Label className="block">
                <span className="block text-xs font-bold text-foreground mb-1">URL file đính kèm (tùy chọn)</span>
                <input
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-amber-500"
                />
              </Label>
            </div>
            <div className="sticky bottom-0 bg-card border-t border-border px-6 py-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Huỷ
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-amber-500 text-white">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
