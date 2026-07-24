'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Camera } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { accountService, type UserProfile } from '@/lib/api/account';
import { classroomApi, type Classroom } from '@/lib/api/classroom';
import { communityApi, type WorkspaceProfile } from '@/lib/api/community';
import { portfolioApi, type Portfolio } from '@/lib/api/portfolio';
import { setProfile } from '@/lib/redux/userSlice';
import { useTranslation } from '@shared/components/LocaleProvider';
import { TeachingClassesCard } from '@shared/components/profile/TeachingClassesCard';

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
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [profile, setLocalProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceProfile | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [teachingClasses, setTeachingClasses] = useState<Classroom[]>([]);
  const [teachingLoading, setTeachingLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.replace('/space/login');
      return;
    }
    (async () => {
      try {
        const [me, ws, pf] = await Promise.all([
          accountService.getProfile(),
          communityApi.getMyProfile(),
          portfolioApi.getMine().catch(() => null),
        ]);
        setLocalProfile(me);
        setWorkspace(ws);
        setPortfolio(pf);
        dispatch(setProfile(me));
        if (me?.uid) {
          try {
            const list = await classroomApi.getByTeacher(me.uid);
            setTeachingClasses(list);
          } catch {
            setTeachingClasses([]);
          } finally {
            setTeachingLoading(false);
          }
        } else {
          setTeachingLoading(false);
        }
      } catch (err) {
        console.error(err);
        toast.error(t('workspace.common.error'));
        setTeachingLoading(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, t, dispatch]);

  const uploadFile = async (file: File, kind: 'avatar' | 'cover') => {
    try {
      if (kind === 'avatar') {
        const res = await communityApi.uploadAvatar(file);
        const newUrl = res.url || res.avatar_url || '';
        setWorkspace((w) => w ? { ...w, avatar_url: newUrl } : w);
        if (profile) {
          dispatch(setProfile({ ...profile, avatar_url: newUrl }));
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('space:profile-updated', { detail: { avatar_url: newUrl } }));
        }
        toast.success('Đã cập nhật ảnh đại diện');
      } else {
        const res = await communityApi.uploadCover(file);
        const newUrl = res.url || res.cover_url || '';
        setWorkspace((w) => w ? { ...w, cover_url: newUrl } : w);
        toast.success('Đã cập nhật ảnh bìa');
      }
    } catch {
      toast.error('Upload thất bại');
    }
  };

  if (loading || !workspace || !profile) {
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
        onWorkspaceChange={(next) => setWorkspace(next as WorkspaceProfile)}
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
