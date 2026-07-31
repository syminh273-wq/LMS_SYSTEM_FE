'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Loader2, MessageCircle, UserCheck, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { accountService, type PublicAccountProfile } from '@/lib/api/account';
import { portfolioApi, type Portfolio, type PortfolioEntry } from '@/lib/api/portfolio';
import { classroomApi, type Classroom } from '@/lib/api/classroom';
import { communityApi, type WorkspaceProfile } from '@/lib/api/community';
import { socialApi } from '@/lib/api/social';
import type { RootState } from '@/lib/redux/store';
import { TeachingClassesCard } from '@shared/components/profile/TeachingClassesCard';

import { WorkspaceShell } from '@/components/WorkspaceShell';
import { BioCard } from '@/components/Me/BioCard';
import { CertificatesCard } from '@/components/Me/CertificatesCard';
import { EducationSection } from '@/components/Me/EducationSection';
import { ExperienceSection } from '@/components/Me/ExperienceSection';
import { FeaturesSection } from '@/components/Me/FeaturesSection';
import { PublicProfileSidebar } from '@/components/Me/PublicProfileSidebar';
import { UserPostsSection } from '@/components/Me/UserPostsSection';
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

const EMPTY_WORKSPACE: WorkspaceProfile = {
  owner_id: '',
  owner_type: 'consumer',
  avatar_url: '',
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
  updated_at: null,
};

type SpaceProfile = {
  uid: string;
  full_name?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
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
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);
  const [publicAddress, setPublicAddress] = useState('');
  const [publicShowAddress, setPublicShowAddress] = useState(true);

  useEffect(() => {
    if (!targetUid) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const owner = isAuthed && me ? me.uid === targetUid : false;

        const [account, ws]: [PublicAccountProfile | null, WorkspaceProfile | null] = await Promise.all([
          accountService.getPublicProfile(targetUid).catch(() => null),
          communityApi.getPublicProfile(targetUid).catch(() => null),
        ]);
        if (cancelled) return;

        setIsOwner(owner);
        const consumer = account?.consumer;
        setProfile({
          uid: targetUid,
          full_name: consumer?.full_name || '',
          avatar_url: ws?.avatar_url || consumer?.avatar_url || '',
          created_at: consumer?.created_at,
        });
        if (typeof account?.address === 'string') setPublicAddress(account.address);
        if (typeof account?.show_address === 'boolean') setPublicShowAddress(account.show_address);
        setWorkspace(ws);

        const ownerType: 'space' | 'consumer' = ws?.owner_type === 'space' ? 'space' : 'consumer';

        const [pf, classes, followStatus] = await Promise.all([
          portfolioApi.getPublic(ownerType, targetUid).catch(() => null),
          ownerType === 'space'
            ? classroomApi.getByTeacher(targetUid).catch(() => [] as Classroom[])
            : Promise.resolve([] as Classroom[]),
          !owner ? socialApi.getFollowStatus(targetUid).catch(() => ({ following: false })) : Promise.resolve({ following: false }),
        ]);
        if (cancelled) return;
        setPortfolio(pf ?? EMPTY_PORTFOLIO);
        setTeachingClasses(Array.isArray(classes) ? classes : []);
        setFollowing(Boolean(followStatus.following));
      } catch (err) {
        console.error(err);
        setError(t('portfolio.labels.portfolio_not_found'));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTeachingLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetUid, t, isAuthed, me]);

  const handleFollow = async () => {
    if (followBusy || !targetUid) return;
    setFollowBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      const res = await socialApi.toggleFollow(targetUid);
      setFollowing(Boolean(res.following));
      try {
        const ws = await communityApi.getPublicProfile(targetUid);
        setWorkspace(ws);
      } catch {
        /* keep optimistic state if refetch fails */
      }
    } catch (err) {
      console.error(err);
      setFollowing(!next);
      toast.error('Không thể cập nhật trạng thái theo dõi');
    } finally {
      setFollowBusy(false);
    }
  };

  const handleMessage = async () => {
    if (messageBusy || !targetUid) return;
    setMessageBusy(true);
    try {
      router.push(`/space/messages/${targetUid}`);
    } catch (err) {
      console.error(err);
      toast.error('Không thể mở cuộc trò chuyện');
    } finally {
      setMessageBusy(false);
    }
  };

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

  const isSpaceProfile = workspace?.owner_type === 'space';

  return (
    <WorkspaceShell>
      <MeProfileLayout
        profile={profile}
        workspace={workspace ?? EMPTY_WORKSPACE}
        portfolio={portfolio}
        isOwner={isOwner}
        renderBio={({ profile: ws, isOwner: owner, onSaved }) => (
          <BioCard profile={ws as WorkspaceProfile} isOwner={owner} onSaved={onSaved as (next: WorkspaceProfile) => void} />
        )}
        renderTeachingClasses={
          isSpaceProfile
            ? () => (
                <TeachingClassesCard
                  classes={teachingClasses}
                  loading={teachingLoading}
                  detailHrefBase="/space/classroom/preview"
                />
              )
            : undefined
        }
        renderCertificates={({ data, isOwner: owner, onChanged }) => (
          <CertificatesCard
            data={data as unknown as Portfolio}
            isOwner={owner}
            onChanged={onChanged as (next: Portfolio['certificate']) => void}
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
        renderMyPosts={({ profile: p, onCountChange }) => (
          <UserPostsSection
            profile={{
              uid: p.uid,
              full_name: p.full_name,
              avatar_url: p.avatar_url,
            }}
            currentUserId={me?.uid ?? null}
            onCountChange={onCountChange}
          />
        )}
        renderHeaderActions={
          isOwner
            ? undefined
            : () => (
                <>
                  <Button
                    onClick={handleFollow}
                    disabled={followBusy}
                    variant={following ? 'secondary' : 'default'}
                  >
                    {followBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : following ? (
                      <>
                        <UserCheck className="size-4" />
                        Đang theo dõi
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-4" />
                        Theo dõi
                      </>
                    )}
                  </Button>
                  <Button onClick={handleMessage} disabled={messageBusy} variant="outline">
                    {messageBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="size-4" />
                        Nhắn tin
                      </>
                    )}
                  </Button>
                </>
              )
        }
        renderRightActions={
          isOwner
            ? undefined
            : () => (
                <PublicProfileSidebar
                  followersCount={workspace?.followers_count ?? 0}
                  followingCount={workspace?.following_count ?? 0}
                  postsCount={workspace?.posts_count ?? 0}
                />
              )
        }
        renderHeaderInfo={({ isOwner: owner, uid }) => (
          <ProfileHeaderInfo
            uid={uid}
            createdAt={profile.created_at}
            isOwner={owner}
            addressText={publicShowAddress ? publicAddress : null}
          />
        )}
      />
    </WorkspaceShell>
  );
}
