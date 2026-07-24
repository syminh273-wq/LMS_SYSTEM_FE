'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { communityApi, type WorkspaceProfile } from '@/lib/api/community';
import { portfolioApi, type Portfolio, type PublicTeacher } from '@/lib/api/portfolio';
import { socialApi } from '@/lib/api/social';

import { ProfileHero } from '@/components/Me/ProfileHero';
import { BioCard } from '@/components/Me/BioCard';
import { CertificatesCard } from '@/components/Me/CertificatesCard';
import { EducationSection } from '@/components/Me/EducationSection';
import { ExperienceSection } from '@/components/Me/ExperienceSection';
import { FeaturesSection } from '@/components/Me/FeaturesSection';
import { MeRightAnalytics } from '@/components/Me/RightAnalytics';

const EMPTY_PORTFOLIO: Portfolio = {
  intro: null,
  certificate: [],
  experience: [],
  achievement: [],
  course: [],
  education: [],
};

const EMPTY_WORKSPACE: WorkspaceProfile = {
  owner_id: '',
  owner_type: 'space',
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

export default function TeacherPublicPage() {
  const params = useParams();
  const router = useRouter();
  const targetUid = String(params?.uid ?? '');

  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<PublicTeacher | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceProfile>(EMPTY_WORKSPACE);
  const [portfolio, setPortfolio] = useState<Portfolio>(EMPTY_PORTFOLIO);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);
  const [followerDelta, setFollowerDelta] = useState(0);

  useEffect(() => {
    if (!targetUid) return;
    let cancelled = false;

    const loadTeacher = async () => {
      try {
        const t = await portfolioApi.getPublicTeacher(targetUid);
        if (cancelled) return;
        setTeacher(t);
        if (t.portfolio) setPortfolio(t.portfolio);
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error('Không tìm thấy giáo viên');
      }
    };

    const loadWorkspace = async () => {
      try {
        const ws = await communityApi.getPublicProfile(targetUid);
        if (!cancelled) setWorkspace(ws);
      } catch {
        if (!cancelled) setWorkspace(EMPTY_WORKSPACE);
      }
    };

    const loadFollow = async () => {
      try {
        const s = await socialApi.getFollowStatus(targetUid);
        if (!cancelled) setFollowing(Boolean(s.following));
      } catch {
        if (!cancelled) setFollowing(false);
      }
    };

    (async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          router.replace(`/space/login?next=${encodeURIComponent(`/space/teachers/${targetUid}`)}`);
          return;
        }
        await loadTeacher();
        await Promise.all([loadWorkspace(), loadFollow()]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetUid, router]);

  const handleFollow = async () => {
    if (followBusy || !targetUid) return;
    setFollowBusy(true);
    const next = !following;
    setFollowing(next);
    setFollowerDelta((d) => d + (next ? 1 : -1));
    try {
      const res = await socialApi.toggleFollow(targetUid);
      setFollowing(Boolean(res.following));
      try {
        const ws = await communityApi.getPublicProfile(targetUid);
        setWorkspace(ws);
        setFollowerDelta(0);
      } catch {
        /* keep optimistic delta if refetch fails */
      }
    } catch (err) {
      console.error(err);
      setFollowing(!next);
      setFollowerDelta((d) => d - (next ? 1 : -1));
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

  if (loading || !teacher) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const displayName = teacher.full_name || teacher.name || 'Giáo viên';

  return (
    <div className="mx-auto w-full max-w-[95vw] py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-6">
        <div className="space-y-4">
          <ProfileHero
            avatarUrl={teacher.avatar_url || workspace.avatar_url}
            coverUrl={teacher.cover_url || workspace.cover_url}
            name={displayName}
            tagline={teacher.description || workspace.major || workspace.department}
            connections={Math.max(0, workspace.followers_count + followerDelta)}
            isFollowing={following}
            isConnecting={followBusy}
            isOwner={false}
            onConnect={handleFollow}
            onMessage={handleMessage}
          />

          <BioCard profile={workspace} isOwner={false} onSaved={() => {}} />

          <EducationSection
            items={portfolio.education ?? []}
            isOwner={false}
            onChanged={() => {}}
          />

          <ExperienceSection
            items={portfolio.experience ?? []}
            isOwner={false}
            onChanged={() => {}}
          />

          <FeaturesSection
            items={portfolio.achievement ?? []}
            isOwner={false}
            onChanged={() => {}}
          />

          <CertificatesCard
            data={portfolio}
            isOwner={false}
            onChanged={() => {}}
          />
        </div>

        <MeRightAnalytics profile={workspace} isEditable={false} onUpdated={() => {}} />
      </div>
    </div>
  );
}
