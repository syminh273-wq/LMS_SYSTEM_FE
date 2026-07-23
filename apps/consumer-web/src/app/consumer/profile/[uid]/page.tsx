'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MessageCircle, User as UserIcon, UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { Button } from '@shared/components/ui/button';

import { accountService, type UserProfile } from '@/lib/api/account';
import { communityApi, type WorkspaceProfile } from '@/lib/api/community';
import { portfolioApi, type Portfolio, type PortfolioEntry } from '@/lib/api/portfolio';
import { socialApi } from '@/lib/api/social';
import type { RootState } from '@/lib/redux/store';
import { useTranslation } from '@shared/components/LocaleProvider';

import { WorkspaceShell } from '@/components/WorkspaceShell';
import { BioCard } from '@/components/Me/BioCard';
import { CertificatesCard } from '@/components/Me/CertificatesCard';
import { EducationSection } from '@/components/Me/EducationSection';
import { ExperienceSection } from '@/components/Me/ExperienceSection';
import { FeaturesSection } from '@/components/Me/FeaturesSection';
import { PublicProfileSidebar } from '@/components/Me/PublicProfileSidebar';
import { UserPostsSection } from '@/components/Me/UserPostsSection';
import { MeProfileLayout } from '@shared/components/profile/MeProfileLayout';

const EMPTY_PORTFOLIO: Portfolio = {
  intro: null,
  certificate: [],
  experience: [],
  achievement: [],
  course: [],
  education: [],
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const targetUid = String(params?.uid ?? '');
  const { profile: currentUser } = useSelector((s: RootState) => s.user);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceProfile | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio>(EMPTY_PORTFOLIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);

  const isOwner = Boolean(currentUser?.uid && targetUid && currentUser.uid === targetUid);
  const isAuthed = Boolean(currentUser?.uid);

  useEffect(() => {
    if (!targetUid) return;
    (async () => {
      setLoading(true);
      try {
        const [accountData, wsData, pfData] = await Promise.all([
          accountService.getPublicProfile(targetUid).catch(() => null),
          communityApi.getPublicProfile(targetUid).catch(() => null),
          portfolioApi.getPublic('consumer', targetUid).catch(() => EMPTY_PORTFOLIO),
        ]);
        if (accountData) {
          const consumer = (accountData as { consumer?: UserProfile | null }).consumer;
          if (consumer && consumer.uid) {
            setProfile(consumer);
          } else {
            setProfile({ uid: targetUid, full_name: '', username: '' } as UserProfile);
          }
        } else {
          setProfile({ uid: targetUid, full_name: '', username: '' } as UserProfile);
        }
        setWorkspace(wsData);
        setPortfolio(pfData ?? EMPTY_PORTFOLIO);
      } catch (err) {
        console.error(err);
        setError(t('portfolio.labels.portfolio_not_found'));
      } finally {
        setLoading(false);
      }
    })();
  }, [targetUid, t]);

  useEffect(() => {
    if (!targetUid || isOwner || !isAuthed) return;
    let cancelled = false;
    (async () => {
      try {
        const status = await socialApi.getFollowStatus(targetUid);
        if (!cancelled) setIsFollowing(Boolean(status?.following));
      } catch {
        if (!cancelled) setIsFollowing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetUid, isOwner, isAuthed]);

  const handleFollowToggle = useCallback(async () => {
    if (isOwner) return;
    if (!isAuthed) {
      toast.info(t('portfolio.me.login_to_follow'));
      router.push('/login');
      return;
    }
    setFollowBusy(true);
    try {
      const res = await socialApi.toggleFollow(targetUid);
      setIsFollowing(res.following);
      setWorkspace((prev) =>
        prev
          ? { ...prev, followers_count: Math.max(0, (prev.followers_count ?? 0) + (res.following ? 1 : -1)) }
          : prev,
      );
    } catch {
      toast.error('Không thể cập nhật trạng thái theo dõi');
    } finally {
      setFollowBusy(false);
    }
  }, [isOwner, isAuthed, targetUid, router, t]);

  const handleMessage = useCallback(async () => {
    if (isOwner) return;
    if (!isAuthed) {
      toast.info(t('portfolio.me.login_to_message'));
      router.push('/login');
      return;
    }
    setMessageBusy(true);
    try {
      await communityApi.getOrCreateDirect(targetUid);
      router.push(`/consumer/messages/${targetUid}`);
    } catch {
      toast.error(t('portfolio.labels.message_failed'));
      setMessageBusy(false);
    }
  }, [isOwner, isAuthed, targetUid, router, t]);

  if (loading) {
    return (
      <WorkspaceShell>
        <div className="mx-auto w-full max-w-[75vw] py-6 sm:py-8">
          <button
            onClick={() => router.push('/consumer/classroom')}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft size={16} />
            Trở lại
          </button>
          <div className="flex items-center justify-center py-32">
            <Loader2 className="size-10 text-indigo-600 animate-spin" />
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  if (error || !profile) {
    return (
      <WorkspaceShell>
        <div className="mx-auto w-full max-w-[75vw] py-6 sm:py-8">
          <button
            onClick={() => router.push('/consumer/classroom')}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft size={16} />
            Trở lại
          </button>
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <UserIcon className="text-muted-foreground" size={36} />
            </div>
            <p className="text-muted-foreground font-medium">Không tìm thấy người dùng</p>
            <Button variant="outline" className="rounded-xl" onClick={() => router.push('/consumer/classroom')}>Quay lại</Button>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-[75vw] py-6 sm:py-8">
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
          }}
          portfolio={portfolio}
          isOwner={isOwner}
          renderBio={({ profile: ws, isOwner: owner, onSaved }) => (
            <BioCard profile={ws as WorkspaceProfile} isOwner={owner} onSaved={onSaved as (next: WorkspaceProfile) => void} />
          )}
          renderEducation={({ items, isOwner: owner, onChanged }) => (
            <EducationSection
              items={items as PortfolioEntry[]}
              isOwner={owner}
              onChanged={onChanged as (next: PortfolioEntry[]) => void}
            />
          )}
          renderExperience={({ items, isOwner: owner, onChanged }) => (
            <ExperienceSection
              items={items as PortfolioEntry[]}
              isOwner={owner}
              onChanged={onChanged as (next: PortfolioEntry[]) => void}
            />
          )}
          renderFeatures={({ items, isOwner: owner, onChanged }) => (
            <FeaturesSection
              items={items as PortfolioEntry[]}
              isOwner={owner}
              onChanged={onChanged as (next: PortfolioEntry[]) => void}
            />
          )}
          renderCertificates={({ data, isOwner: owner, onChanged }) => (
            <CertificatesCard
              data={data as Portfolio}
              isOwner={owner}
              onChanged={onChanged as (next: PortfolioEntry[]) => void}
            />
          )}
          renderMyPosts={({ profile: p, onCountChange }) => (
            <UserPostsSection
              profile={{
                uid: p.uid,
                full_name: p.full_name,
                avatar_url: p.avatar_url,
              }}
              currentUserId={currentUser?.uid ?? null}
              onCountChange={onCountChange}
            />
          )}
          renderHeaderActions={
            isOwner
              ? undefined
              : () => (
                  <>
                    <Button
                      onClick={handleFollowToggle}
                      disabled={followBusy}
                      className={
                        isFollowing
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold'
                      }
                    >
                      {followBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserCheck className="size-4" />
                          {t('portfolio.me.following')}
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-4" />
                          {t('portfolio.me.follow')}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleMessage}
                      disabled={messageBusy}
                      variant="outline"
                      className="border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:text-indigo-600"
                    >
                      {messageBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <MessageCircle className="size-4" />
                          {t('portfolio.me.message')}
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
        />
      </div>
    </WorkspaceShell>
  );
}
