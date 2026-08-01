'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Camera } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

import { classroomApi } from '@/features/classroom/api';
import type { Classroom } from '@/lib/api/types';
import { communityApi, type WorkspaceProfile } from '@/lib/api/community';
import { portfolioApi, type Portfolio } from '@/lib/api/portfolio';
import { setProfile } from '@/features/auth/store';
import { updateSocialAvatar } from '@/lib/redux/socialProfileSlice';
import { RootState, useAppDispatch } from '@/lib/redux/store';
import { useTranslation } from '@shared/components/LocaleProvider';
import { TeachingClassesCard } from '@shared/components/profile/TeachingClassesCard';
import { Button } from '@shared/components/ui/button';

import { WorkspaceShell } from '@/components/WorkspaceShell';
import { BioCard } from '@/components/Me/BioCard';
import { CertificatesCard } from '@/components/Me/CertificatesCard';
import { EducationSection } from '@/components/Me/EducationSection';
import { ExperienceSection } from '@/components/Me/ExperienceSection';
import { FeaturesSection } from '@/components/Me/FeaturesSection';
import { MyPostsSection } from '@/components/Me/MyPostsSection';
import { MeRightAnalytics } from '@/components/Me/RightAnalytics';
import { MeProfileLayout } from '@shared/components/profile/MeProfileLayout';
import { AddressSection, ProfileHeaderInfo } from '@shared/components/address';

export default function MePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const profile = useSelector((s: RootState) => s.user.profile);
  const profileStatus = useSelector((s: RootState) => s.user.status);
  const socialProfile = useSelector((s: RootState) => s.socialProfile.profile);
  const socialProfileStatus = useSelector((s: RootState) => s.socialProfile.status);
  // Local edit buffer for workspace (bio/analytics cards mutate it in place);
  // falls back to the shared Redux cache until the first local edit happens.
  const [workspaceOverride, setWorkspaceOverride] = useState<WorkspaceProfile | null>(null);
  const workspace = workspaceOverride ?? socialProfile;
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [teachingClasses, setTeachingClasses] = useState<Classroom[]>([]);
  const [teachingLoading, setTeachingLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.replace('/space/login');
    }
  }, [router]);

  useEffect(() => {
    if (!profile?.uid) return;
    (async () => {
      try {
        const [pf, list] = await Promise.all([
          portfolioApi.getMine().catch(() => null),
          classroomApi.getClassroomsByTeacher(profile.uid).catch(() => [] as Classroom[]),
        ]);
        setPortfolio(pf);
        setTeachingClasses(list);
      } catch (err) {
        console.error(err);
        toast.error(t('workspace.common.error'));
      } finally {
        setTeachingLoading(false);
      }
    })();
  }, [profile?.uid, t]);

  const uploadFile = async (file: File, kind: 'avatar' | 'cover') => {
    try {
      if (kind === 'avatar') {
        const res = await communityApi.uploadAvatar(file);
        const newUrl = res.url || res.avatar_url || '';
        setWorkspaceOverride(workspace ? { ...workspace, avatar_url: newUrl } : workspace);
        dispatch(updateSocialAvatar(newUrl));
        if (profile) {
          dispatch(setProfile({ ...profile, avatar_url: newUrl }));
        }
        toast.success('Đã cập nhật ảnh đại diện');
      } else {
        const res = await communityApi.uploadCover(file);
        const newUrl = res.url || res.cover_url || '';
        setWorkspaceOverride(workspace ? { ...workspace, cover_url: newUrl } : workspace);
        toast.success('Đã cập nhật ảnh bìa');
      }
    } catch {
      toast.error('Upload thất bại');
    }
  };

  if (!workspace || !profile) {
    if (profileStatus === 'failed' || socialProfileStatus === 'failed') {
      return (
        <WorkspaceShell>
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
            <p className="text-muted-foreground text-sm">{t('workspace.common.error')}</p>
            <Button variant="link" onClick={() => window.location.reload()}>
              {t('workspace.common.retry')}
            </Button>
          </div>
        </WorkspaceShell>
      );
    }
    return (
      <WorkspaceShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-10 text-indigo-600 animate-spin" />
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <MeProfileLayout
        profile={profile}
        workspace={workspace}
        portfolio={portfolio}
        onWorkspaceChange={(next) => setWorkspaceOverride(next as WorkspaceProfile)}
        onPortfolioChange={(next) => setPortfolio(next as Portfolio)}
        onEditProfile={() => router.push('/space/me/edit')}
        onEditCover={() => coverRef.current?.click()}
        onEditAvatar={() => fileRef.current?.click()}
        renderBio={({ profile: ws, isOwner, onSaved }) => (
          <BioCard profile={ws as WorkspaceProfile} isOwner={isOwner} onSaved={onSaved as (next: WorkspaceProfile) => void} />
        )}
        renderTeachingClasses={() => (
          <TeachingClassesCard
            classes={teachingClasses}
            loading={teachingLoading}
            detailHrefBase="/space/classroom/preview"
          />
        )}
        renderCertificates={({ data, isOwner, onChanged }) => (
          <CertificatesCard
            data={data as unknown as Portfolio}
            isOwner={isOwner}
            onChanged={onChanged as (next: Portfolio['certificate']) => void}
          />
        )}
        renderEducation={({ items, isOwner, onChanged }) => (
          <EducationSection
            items={items as Portfolio['education']}
            isOwner={isOwner}
            onChanged={onChanged as (next: Portfolio['education']) => void}
          />
        )}
        renderExperience={({ items, isOwner, onChanged }) => (
          <ExperienceSection
            items={items as Portfolio['experience']}
            isOwner={isOwner}
            onChanged={onChanged as (next: Portfolio['experience']) => void}
          />
        )}
        renderFeatures={({ items, isOwner, onChanged }) => (
          <FeaturesSection
            items={items as Portfolio['achievement']}
            isOwner={isOwner}
            onChanged={onChanged as (next: Portfolio['achievement']) => void}
          />
        )}
        renderMyPosts={({ profile: lite, onCountChange }) => (
          <MyPostsSection
            profile={lite}
            onCountChange={onCountChange}
          />
        )}
        renderRightAnalytics={({ profile: ws, onUpdated }) => (
          <MeRightAnalytics
            profile={ws as WorkspaceProfile}
            onUpdated={onUpdated as (next: WorkspaceProfile) => void}
          />
        )}
        renderAddress={({ isOwner }) => <AddressSection isOwner={isOwner} />}
        renderHeaderInfo={({ isOwner: owner, uid }) => (
          <ProfileHeaderInfo
            uid={uid}
            createdAt={profile.created_at}
            isOwner={owner}
            email={profile.email}
          />
        )}
      />

      <input
        ref={coverRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f, 'cover');
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f, 'avatar');
        }}
      />
    </WorkspaceShell>
  );
}
