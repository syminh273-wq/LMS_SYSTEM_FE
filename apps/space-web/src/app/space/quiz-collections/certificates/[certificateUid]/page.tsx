'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Edit3, Check, X, Award } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { certificateApi } from '@/lib/api/quiz-collection';
import type { Certificate } from '@/lib/api/types';

interface Props {
  params: Promise<{ certificateUid: string }>;
}

export default function CertificateDetailPage({ params }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [uid, setUid] = useState<string | null>(null);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateUrl, setTemplateUrl] = useState('');

  useEffect(() => {
    params.then(p => setUid(p.certificateUid));
  }, [params]);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      const c = await certificateApi.retrieve(uid);
      setCert(c);
      setName(c.name);
      setDescription(c.description ?? '');
      setTemplateUrl(c.template_url ?? '');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('certificate.load_error'));
    } finally {
      setLoading(false);
    }
  }, [uid, t]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    if (!cert) return;
    try {
      const updated = await certificateApi.update(cert.uid, {
        name: name.trim(),
        description: description.trim(),
        template_url: templateUrl.trim() || null,
      });
      setCert(updated);
      setEditing(false);
      toast.success(t('certificate.update_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('certificate.save_error', 'Cannot save'))
    }
  };

  if (loading || !cert) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 size={36} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <button
        onClick={() => router.push('/space/quiz-collections/certificates')}
        className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        {t('certificate.detail.back')}
      </button>

      <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Award size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {t('certificate.detail.name_section')}
            </p>
            {editing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xl font-black bg-background border border-border rounded-lg px-2 py-1 mt-1"
                autoFocus
              />
            ) : (
              <h1 className="text-xl font-black text-foreground">{cert.name}</h1>
            )}
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <Button size="icon" onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Check size={16} />
              </Button>
              <Button size="icon" variant="outline" onClick={() => setEditing(false)}>
                <X size={16} />
              </Button>
            </div>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
              <Edit3 size={14} />
            </Button>
          )}
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
            {t('certificate.detail.description_section')}
          </p>
          {editing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{cert.description || '—'}</p>
          )}
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
            {t('certificate.detail.template_section')}
          </p>
          {editing ? (
            <input
              type="url"
              value={templateUrl}
              onChange={(e) => setTemplateUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          ) : cert.template_url ? (
            <a href={cert.template_url} target="_blank" rel="noreferrer" className="text-sm text-primary-brand underline break-all">
              {cert.template_url}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground italic">{t('certificate.detail.template_none')}</p>
          )}
        </div>
      </section>
    </div>
  );
}
