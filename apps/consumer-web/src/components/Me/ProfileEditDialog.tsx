'use client';

import { useState } from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { communityApi, type WorkspaceProfile } from '@/lib/api/community';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { CEditor } from '@/components/CEditor';

const SKILL_LIMIT = 5;

type Props = {
  profile: WorkspaceProfile;
  onClose: () => void;
  onSaved: (p: WorkspaceProfile) => void;
};

export function ProfileEditDialog({ profile, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [bio, setBio] = useState(profile.bio || '');
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (skills.includes(s)) { setSkillInput(''); return; }
    if (skills.length >= SKILL_LIMIT) { setSkillInput(''); return; }
    setSkills([...skills, s]);
    setSkillInput('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = await communityApi.updateMyProfile({
        bio, skills,
      });
      toast.success(t('workspace.common.save'));
      onSaved(next);
    } catch {
      toast.error(t('workspace.common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold">
            {t('workspace.profile.edit_about')}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            {t('workspace.profile.edit_about_desc')}
          </p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          <div>
            <CEditor
              value={bio}
              onChange={setBio}
              placeholder={t('workspace.profile.fields.bio_placeholder')}
              minHeight="280px"
            />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t('workspace.profile.fields.skills')}
            </h3>
            <p className="text-sm text-slate-500 mb-3 leading-relaxed">
              {t('workspace.profile.fields.skills_desc')}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.map((s, i) => (
                <span
                  key={`${s}-${i}`}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold"
                >
                  <Button
                    onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                    aria-label="Remove skill"
                    className="-ml-1 hover:text-rose-600"
                  >
                    <X size={12} />
                  </Button>
                  {s}
                </span>
              ))}
              {skills.length === 0 && (
                <span className="text-xs text-slate-400 italic">—</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
                }}
                placeholder={t('workspace.profile.fields.skills_placeholder')}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <Button
                type="button"
                onClick={addSkill}
                size="sm"
                variant="outline"
                disabled={skills.length >= SKILL_LIMIT}
                className="px-3"
              >
                <Plus size={14} />
              </Button>
            </div>
            {skills.length >= SKILL_LIMIT && (
              <p className="text-[11px] text-amber-600 mt-1.5">
                {SKILL_LIMIT}/{SKILL_LIMIT}
              </p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('workspace.common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t('workspace.common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
