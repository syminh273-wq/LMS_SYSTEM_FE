'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Plus, Loader2, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { certificateApi } from '@/lib/api/quiz-collection';
import type { Certificate } from '@/lib/api/types';
import { CreateCertificateDialog } from '@/components/quiz-collection/CreateCertificateDialog';

export default function CertificatesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setItems(await certificateApi.list());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('certificate.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleDelete = async (c: Certificate) => {
    if (!window.confirm(t('certificate.delete_confirm', undefined, { name: c.name }))) return;
    try {
      await certificateApi.deleteCertificate(c.uid);
      setItems(prev => prev.filter(x => x.uid !== c.uid));
      toast.success(t('certificate.delete_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('certificate.delete_error'));
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">{t('certificate.library_title')}</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">{t('certificate.subtitle')}</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 shadow-lg shadow-primary-brand/20"
        >
          <Plus size={16} />
          {t('certificate.create_btn')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 size={36} className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
          <Award size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">{t('certificate.empty')}</p>
          <p className="text-xs mt-1 mb-6">{t('certificate.empty_hint')}</p>
          <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-xl gap-2 font-bold text-xs">
            <Plus size={16} /> {t('certificate.create_first_btn')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(c => (
            <div
              key={c.uid}
              onClick={() => router.push(`/space/quiz-collections/certificates/${c.uid}`)}
              className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary-brand/50 transition-all group p-5 flex flex-col gap-4 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <Award size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  c.is_active
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border-border'
                }`}>
                  {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-foreground text-sm leading-snug line-clamp-2">{c.name}</h3>
                {c.description && (
                  <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-2">{c.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); void handleDelete(c); }}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary-brand group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCertificateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(c) => {
          setItems(prev => [c, ...prev]);
          setShowCreate(false);
          toast.success(t('certificate.create_success'));
        }}
      />
    </div>
  );
}
