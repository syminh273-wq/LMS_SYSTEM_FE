import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Languages, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { communityApi, type WorkspaceProfile } from '@/lib/api/community';

type Props = {
  profile: WorkspaceProfile;
  isEditable?: boolean;
  onUpdated?: (next: WorkspaceProfile) => void;
};

export function MeRightAnalytics({ profile, isEditable = true, onUpdated }: Props) {
  const [skills, setSkills] = useState<string[]>(profile.skills ?? []);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const commit = async (next: string[]) => {
    const unique = Array.from(new Set(next.map((s) => s.trim()).filter(Boolean)));
    setSkills(unique);
    setSaving(true);
    try {
      const updated = await communityApi.updateMyProfile({ skills: unique });
      onUpdated?.(updated);
    } catch {
      toast.error('Không thể lưu ngôn ngữ');
      setSkills(profile.skills ?? []);
    } finally {
      setSaving(false);
    }
  };

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (skills.includes(v)) {
      toast.error('Ngôn ngữ đã tồn tại');
      return;
    }
    setDraft('');
    void commit([...skills, v]);
  };

  const remove = (s: string) => {
    void commit(skills.filter((x) => x !== s));
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <div className="bg-card border border-border rounded-xl p-5 card-elevated">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Languages size={13} className="text-muted-foreground" />
            <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">
              Ngôn ngữ
            </h3>
            {saving && <Loader2 size={11} className="text-muted-foreground animate-spin" />}
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">{skills.length}</span>
        </div>

        {isEditable && (
          <div className="flex gap-1.5 mb-3">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder="VD. English"
              className="flex-1 min-w-0 px-2.5 py-1.5 text-[12.5px] border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              maxLength={40}
            />
            <Button
              type="button"
              onClick={add}
              disabled={!draft.trim() || saving}
              className="shrink-0 w-8 h-8"
              title="Thêm"
            >
              <Plus size={14} />
            </Button>
          </div>
        )}

        {skills.length === 0 ? (
          <p className="text-[12px] text-muted-foreground italic">Chưa thêm ngôn ngữ nào.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <li
                key={s}
                className={`inline-flex items-center gap-1 pl-2 pr-1 py-1 text-[11.5px] font-semibold rounded-md bg-primary/10 text-primary border border-primary/20 ${isEditable ? '' : 'pr-2'}`}
              >
                {s}
                {isEditable && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(s)}
                    disabled={saving}
                    className="w-4 h-4 text-primary"
                    title="Xoá"
                  >
                    <X size={10} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
