'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { portfolioApi, type Portfolio, type PortfolioEntry } from '@/lib/api/portfolio';
import { classroomApi, type Classroom } from '@/lib/api/classroom';
import { communityApi, type WorkspaceProfile } from '@/lib/api/community';
import type { RootState } from '@/lib/redux/store';
import { TeachingClassesCard } from '@shared/components/profile/TeachingClassesCard';

import { WorkspaceShell } from '@/components/WorkspaceShell';
import { BioCard } from '@/components/Me/BioCard';
import { EducationSection } from '@/components/Me/EducationSection';
import { ExperienceSection } from '@/components/Me/ExperienceSection';
import { FeaturesSection } from '@/components/Me/FeaturesSection';
import { MeProfileLayout } from '@shared/components/profile/MeProfileLayout';
import { ProfileHeaderInfo } from '@shared/components/address';

const EMPTY_PORTFOLIO: Portfolio & { education: PortfolioEntry[] } = {
  intro: null,
  certificate: [],
  experience: [],
  achievement: [],
  course: [],
  education: [],
};

type SpaceProfile = {
  uid: string;
  full_name?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const targetUid = String(params?.uid ?? '');
  const isAuthed = useSelector((s: RootState) => s.user.isAuthenticated);
  const me = useSelector((s: RootState) => s.user.profile);

  const [profile, setProfile] = useState<SpaceProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceProfile | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [teachingClasses, setTeachingClasses] = useState<Classroom[]>([]);
  const [teachingLoading, setTeachingLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!targetUid) return;
    (async () => {
      setLoading(true);
      try {
        const [pf, ws, classes] = await Promise.all([
          portfolioApi.getPublic('space', targetUid).catch(() => null),
          communityApi.getPublicProfile(targetUid).catch(() => null),
          classroomApi.getByTeacher(targetUid).catch(() => [] as Classroom[]),
        ]);
        setPortfolio(pf ?? EMPTY_PORTFOLIO);
        if (isAuthed && me) {
          setIsOwner(me.uid === targetUid);
        }
        if (ws) {
          setWorkspace(ws);
          setProfile({
            uid: targetUid,
            full_name: '',
            avatar_url: ws.avatar_url,
          });
        } else {
          setProfile({
            uid: targetUid,
            full_name: '',
            avatar_url: '',
          });
        }
        setTeachingClasses(Array.isArray(classes) ? classes : []);
      } catch (err) {
        console.error(err);
        setError(t('portfolio.labels.portfolio_not_found'));
      } finally {
        setLoading(false);
        setTeachingLoading(false);
      }
    })();
  }, [targetUid, t, isAuthed, me]);

  if (loading) {
    return (
      <WorkspaceShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-10 text-indigo-600 animate-spin" />
        </div>
      </WorkspaceShell>
    );
  }

  if (error || !profile) {
    return (
      <WorkspaceShell>
        <Card className="rounded-3xl border-border">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground font-medium">{error || t('portfolio.labels.portfolio_not_found')}</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => router.back()}>
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </WorkspaceShell>
    );
  }

  const displayName = profile.full_name || profile.name || t('portfolio.personal.default_name') || 'người dùng này';

  return (
    <WorkspaceShell>
      <MeProfileLayout
        profile={profile}
        workspace={workspace ?? {
          avatar_url: profile.avatar_url ?? '',
          cover_url: '',
          bio: '',
          major: '',
          department: '',
          skills: [],
          github: '',
          linkedin: '',
          website: '',
          posts_count: 0,
          followers_count: 0,
          following_count: 0,
        } as unknown as WorkspaceProfile}
        portfolio={portfolio}
        isOwner={isOwner}
        renderBio={({ profile: ws, isOwner: owner, onSaved }) => (
          <BioCard profile={ws as WorkspaceProfile} isOwner={owner} onSaved={onSaved as (next: WorkspaceProfile) => void} />
        )}
        renderTeachingClasses={() => (
          <TeachingClassesCard
            classes={teachingClasses}
            loading={teachingLoading}
            detailHrefBase="/space/classroom/preview"
          />
        )}
        renderEducation={({ items, isOwner: owner, onChanged }) => (
          <EducationSection
            items={items as Portfolio['education']}
            isOwner={owner}
            onChanged={onChanged as (next: Portfolio['education']) => void}
          />
        )}
        renderExperience={({ items, isOwner: owner, onChanged }) => (
          <ExperienceSection
            items={items as Portfolio['experience']}
            isOwner={owner}
            onChanged={onChanged as (next: Portfolio['experience']) => void}
          />
        )}
        renderFeatures={({ items, isOwner: owner, onChanged }) => (
          <FeaturesSection
            items={items as Portfolio['achievement']}
            isOwner={owner}
            onChanged={onChanged as (next: Portfolio['achievement']) => void}
          />
        )}
        renderHeaderInfo={({ isOwner: owner, uid }) => (
          <ProfileHeaderInfo
            uid={uid}
            createdAt={(workspace as { created_at?: string } | null)?.created_at}
            isOwner={owner}
          />
        )}
      />
    </WorkspaceShell>
  );
}
