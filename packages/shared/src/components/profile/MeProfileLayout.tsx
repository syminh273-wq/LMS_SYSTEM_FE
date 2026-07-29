'use client';

import * as React from 'react';
import { Camera, FileText, User } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';

type MeProfileLite = {
  uid: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
};

export type MeWorkspaceProfile = {
  owner_id?: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  major?: string;
  department?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
  website?: string;
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
};

export type MePortfolio = {
  education?: unknown[];
  experience?: unknown[];
  achievement?: unknown[];
  certificate?: unknown[];
};

export type MeTab = 'posts' | 'about';

export type MeProfileLayoutProps = {
  profile: MeProfileLite;
  workspace: MeWorkspaceProfile;
  portfolio?: MePortfolio | null;

  isOwner?: boolean;

  onWorkspaceChange?: (next: MeWorkspaceProfile) => void;
  onPortfolioChange?: (next: MePortfolio) => void;

  onEditProfile?: () => void;
  onEditCover?: () => void;
  onEditAvatar?: () => void;

  renderBio: (props: {
    profile: MeWorkspaceProfile;
    isOwner: boolean;
    onSaved: (next: MeWorkspaceProfile) => void;
  }) => React.ReactNode;
  renderTeachingClasses?: () => React.ReactNode;
  renderCertificates?: (props: {
    data: MePortfolio;
    isOwner: boolean;
    onChanged: (next: unknown[]) => void;
  }) => React.ReactNode;
  renderEducation?: (props: {
    items: unknown[];
    isOwner: boolean;
    onChanged: (next: unknown[]) => void;
  }) => React.ReactNode;
  renderExperience?: (props: {
    items: unknown[];
    isOwner: boolean;
    onChanged: (next: unknown[]) => void;
  }) => React.ReactNode;
  renderFeatures?: (props: {
    items: unknown[];
    isOwner: boolean;
    onChanged: (next: unknown[]) => void;
  }) => React.ReactNode;
  renderMyPosts?: (props: {
    profile: { uid: string; full_name: string; avatar_url: string };
    onCountChange?: (count: number) => void;
  }) => React.ReactNode;
  renderRightAnalytics?: (props: {
    profile: MeWorkspaceProfile;
    onUpdated: (next: MeWorkspaceProfile) => void;
  }) => React.ReactNode;
  renderRightActions?: () => React.ReactNode;
  renderHeaderActions?: () => React.ReactNode;
  renderAddress?: (props: { isOwner: boolean }) => React.ReactNode;
  renderHeaderInfo?: (props: { isOwner: boolean; uid: string }) => React.ReactNode;

  initialTab?: MeTab;
};

export function MeProfileLayout(props: MeProfileLayoutProps) {
  const {
    profile,
    workspace,
    portfolio = null,
    isOwner = true,
    onWorkspaceChange,
    onPortfolioChange,
    onEditProfile,
    onEditCover,
    onEditAvatar,
    renderBio,
    renderTeachingClasses,
    renderCertificates,
    renderEducation,
    renderExperience,
    renderFeatures,
    renderMyPosts,
    renderRightAnalytics,
    renderRightActions,
    renderHeaderActions,
    renderAddress,
    renderHeaderInfo,
    initialTab = 'about',
  } = props;

  const [activeTab, setActiveTab] = React.useState<MeTab>(initialTab);
  const [postsCount, setPostsCount] = React.useState<number>(0);

  const displayName = profile.full_name || profile.username || 'User';

  const updateWorkspace = React.useCallback(
    (next: MeWorkspaceProfile) => {
      onWorkspaceChange?.(next);
    },
    [onWorkspaceChange],
  );

  const updatePortfolioSection = React.useCallback(
    <K extends keyof MePortfolio>(key: K, next: MePortfolio[K]) => {
      if (!portfolio || !onPortfolioChange) return;
      onPortfolioChange({ ...portfolio, [key]: next });
    },
    [portfolio, onPortfolioChange],
  );

  return (
    <div className="mx-auto w-full max-w-[95vw] py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-6">
        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden card-elevated">
            <div
              className="h-36 sm:h-48 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 relative bg-cover bg-center"
              style={workspace.cover_url ? { backgroundImage: `url(${workspace.cover_url})` } : undefined}
            >
              {isOwner && onEditCover && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onEditCover}
                  className="absolute top-3 right-3 bg-white/95 hover:bg-white text-slate-700 font-bold"
                >
                  <Camera className="size-3.5" /> Sửa ảnh bìa
                </Button>
              )}
            </div>

            <div className="px-6 pb-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="relative shrink-0">
                  {workspace.avatar_url || profile.avatar_url ? (
                    <img
                      src={(workspace.avatar_url || profile.avatar_url) as string}
                      alt={displayName}
                      className="w-28 h-28 rounded-full ring-4 ring-white object-cover"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full ring-4 ring-white bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-500">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isOwner && onEditAvatar && (
                    <Button
                      onClick={onEditAvatar}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50"
                      aria-label="Sửa ảnh đại diện"
                    >
                      <Camera className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="sm:pb-2 min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-slate-900 truncate">{displayName}</h1>
                  {renderHeaderInfo && (
                    <div className="mt-2">
                      {renderHeaderInfo({ isOwner, uid: profile.uid })}
                    </div>
                  )}
                </div>
                {isOwner ? null : renderHeaderActions && (
                  <div className="flex flex-wrap gap-2 sm:pb-2">{renderHeaderActions()}</div>
                )}
              </div>
            </div>
          </section>

          {renderBio({
            profile: workspace,
            isOwner,
            onSaved: updateWorkspace,
          })}

          {renderTeachingClasses && renderTeachingClasses()}

          {renderAddress && renderAddress({ isOwner })}

          {isOwner ? (
            <MeTabBar
              active={activeTab}
              counts={{ posts: postsCount, about: 0 }}
              onChange={setActiveTab}
            />
          ) : renderMyPosts ? (
            <MeTabBar
              active={activeTab}
              counts={{ posts: postsCount, about: 0 }}
              onChange={setActiveTab}
            />
          ) : null}

          {activeTab === 'about' ? (
            <>
              {portfolio && renderEducation && (
                <EducationSlot
                  render={renderEducation}
                  items={portfolio.education ?? []}
                  isOwner={isOwner}
                  onChanged={(next) => updatePortfolioSection('education', next)}
                />
              )}

              {portfolio && renderExperience && (
                <ExperienceSlot
                  render={renderExperience}
                  items={portfolio.experience ?? []}
                  isOwner={isOwner}
                  onChanged={(next) => updatePortfolioSection('experience', next)}
                />
              )}

              {portfolio && renderFeatures && (
                <FeaturesSlot
                  render={renderFeatures}
                  items={portfolio.achievement ?? []}
                  isOwner={isOwner}
                  onChanged={(next) => updatePortfolioSection('achievement', next)}
                />
              )}

              {portfolio && renderCertificates && (
                <CertificatesSlot
                  render={renderCertificates}
                  data={portfolio}
                  isOwner={isOwner}
                  onChanged={(next) => updatePortfolioSection('certificate', next)}
                />
              )}
            </>
          ) : (
            renderMyPosts && (
              <MyPostsSlot
                render={renderMyPosts}
                profile={{
                  uid: profile.uid,
                  full_name: profile.full_name || profile.username || 'User',
                  avatar_url: workspace.avatar_url || profile.avatar_url || '',
                }}
                onCountChange={setPostsCount}
              />
            )
          )}
        </div>

        {isOwner && renderRightAnalytics && (
          <RightAnalyticsSlot
            render={renderRightAnalytics}
            profile={workspace}
            onUpdated={updateWorkspace}
          />
        )}

        {!isOwner && renderRightActions && (
          <RightActionsSlot render={renderRightActions} />
        )}
      </div>
    </div>
  );
}

const TAB_ITEMS: { key: MeTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'about', label: 'Giới thiệu', Icon: User },
  { key: 'posts', label: 'Bài đăng', Icon: FileText },
];

function MeTabBar({
  active,
  counts,
  onChange,
}: {
  active: MeTab;
  counts: Record<MeTab, number>;
  onChange: (tab: MeTab) => void;
}) {
  return (
    <nav
      role="tablist"
      aria-label="Các mục hồ sơ"
      className="bg-white border border-slate-200 rounded-xl p-1.5 flex gap-1 overflow-x-auto [scrollbar-width:thin] card-elevated"
    >
      {TAB_ITEMS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <Button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={cn(
              'flex-1 min-w-fit inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 h-10 rounded-lg text-[13px] font-semibold transition-colors whitespace-nowrap',
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <Icon className="size-4" />
            <span>{label}</span>
            <span
              className={cn(
                'text-[11px] font-bold px-1.5 py-0.5 rounded-md',
                isActive ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-500',
              )}
            >
              {counts[key]}
            </span>
          </Button>
        );
      })}
    </nav>
  );
}

type RenderFn<P> = (props: P) => React.ReactNode;

function EducationSlot({
  render,
  items,
  isOwner,
  onChanged,
}: {
  render: RenderFn<{ items: unknown[]; isOwner: boolean; onChanged: (next: unknown[]) => void }>;
  items: unknown[];
  isOwner: boolean;
  onChanged: (next: unknown[]) => void;
}) {
  return <>{render({ items, isOwner, onChanged })}</>;
}

function ExperienceSlot({
  render,
  items,
  isOwner,
  onChanged,
}: {
  render: RenderFn<{ items: unknown[]; isOwner: boolean; onChanged: (next: unknown[]) => void }>;
  items: unknown[];
  isOwner: boolean;
  onChanged: (next: unknown[]) => void;
}) {
  return <>{render({ items, isOwner, onChanged })}</>;
}

function FeaturesSlot({
  render,
  items,
  isOwner,
  onChanged,
}: {
  render: RenderFn<{ items: unknown[]; isOwner: boolean; onChanged: (next: unknown[]) => void }>;
  items: unknown[];
  isOwner: boolean;
  onChanged: (next: unknown[]) => void;
}) {
  return <>{render({ items, isOwner, onChanged })}</>;
}

function CertificatesSlot({
  render,
  data,
  isOwner,
  onChanged,
}: {
  render: RenderFn<{ data: MePortfolio; isOwner: boolean; onChanged: (next: unknown[]) => void }>;
  data: MePortfolio;
  isOwner: boolean;
  onChanged: (next: unknown[]) => void;
}) {
  return <>{render({ data, isOwner, onChanged })}</>;
}

function MyPostsSlot({
  render,
  profile,
  onCountChange,
}: {
  render: RenderFn<{ profile: { uid: string; full_name: string; avatar_url: string }; onCountChange?: (count: number) => void }>;
  profile: { uid: string; full_name: string; avatar_url: string };
  onCountChange?: (count: number) => void;
}) {
  return <>{render({ profile, onCountChange })}</>;
}

function RightAnalyticsSlot({
  render,
  profile,
  onUpdated,
}: {
  render: RenderFn<{ profile: MeWorkspaceProfile; onUpdated: (next: MeWorkspaceProfile) => void }>;
  profile: MeWorkspaceProfile;
  onUpdated: (next: MeWorkspaceProfile) => void;
}) {
  return <>{render({ profile, onUpdated })}</>;
}

function RightActionsSlot({
  render,
}: {
  render: () => React.ReactNode;
}) {
  return <>{render()}</>;
}
