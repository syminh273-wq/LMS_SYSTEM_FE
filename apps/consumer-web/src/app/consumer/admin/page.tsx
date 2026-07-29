'use client';

import * as React from 'react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  consumerApi,
  type Consumer,
  type CreateConsumerRequest,
  type CreateSpaceRequest,
  type Space,
} from '@/lib/api';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@shared/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@shared/components/ui/card';
import { ProtectedPageShell } from '@/components/layout/protected-page-shell';
import { ResourceManagementSection } from '@/components/resource/resource-management-section';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import {
  Mail,
  User,
  Phone,
  Globe,
  Layout,
  Trash2,
  ShieldOff,
  Eye,
  Plus,
  RotateCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

type ConsumerForm = CreateConsumerRequest;
type SpaceForm = CreateSpaceRequest;

const emptyConsumerForm: ConsumerForm = {
  username: '',
  email: '',
  full_name: '',
  phone: '',
  avatar_url: '',
};

const emptySpaceForm: SpaceForm = {
  name: '',
  slug: '',
  description: '',
  logo_url: '',
  cover_url: '',
};

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated } = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedConsumer, setSelectedConsumer] = useState<Consumer | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [consumerForm, setConsumerForm] = useState<ConsumerForm>(emptyConsumerForm);
  const [spaceForm, setSpaceForm] = useState<SpaceForm>(emptySpaceForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [consumerList, spaceList] = await Promise.all([
        consumerApi.consumers.list(),
        consumerApi.spaces.list(),
      ]);
      setConsumers(consumerList);
      setSpaces(spaceList);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải dữ liệu quản trị.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      queueMicrotask(() => {
      void loadData();
      });
    }
  }, [isAuthenticated, loadData]);

  const handleCreateConsumer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runAction('Đã tạo consumer.', async () => {
      await consumerApi.consumers.create(cleanPayload(consumerForm) as any);
      setConsumerForm(emptyConsumerForm);
      await loadData();
    });
  };

  const handleRetrieveConsumer = async (uid: string) => {
    await runAction('', async () => {
      const consumer = await consumerApi.consumers.retrieve(uid);
      setSelectedConsumer(consumer);
      setConsumerForm({
        username: consumer.username,
        email: consumer.email,
        full_name: consumer.full_name,
        phone: consumer.phone,
        avatar_url: consumer.avatar_url,
      });
    });
  };

  const handleUpdateConsumer = async () => {
    if (!selectedConsumer) return;

    await runAction('Đã cập nhật consumer.', async () => {
      const updated = await consumerApi.consumers.update(selectedConsumer.uid, {
        full_name: consumerForm.full_name,
        phone: consumerForm.phone,
        avatar_url: consumerForm.avatar_url,
      });
      setSelectedConsumer(updated);
      await loadData();
    });
  };

  const handleDeactivateConsumer = async (uid: string) => {
    await runAction('Đã vô hiệu hóa consumer.', async () => {
      await consumerApi.consumers.deactivate(uid);
      await loadData();
    });
  };

  const handleDeleteConsumer = async (uid: string) => {
    await runAction('Đã xóa consumer.', async () => {
      await consumerApi.consumers.delete(uid);
      if (selectedConsumer?.uid === uid) {
        setSelectedConsumer(null);
        setConsumerForm(emptyConsumerForm);
      }
      await loadData();
    });
  };

  const handleCreateSpace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runAction('Đã tạo space.', async () => {
      await consumerApi.spaces.create(cleanPayload(spaceForm) as any);
      setSpaceForm(emptySpaceForm);
      await loadData();
    });
  };

  const handleRetrieveSpace = async (uid: string) => {
    await runAction('', async () => {
      const space = await consumerApi.spaces.retrieve(uid);
      setSelectedSpace(space);
      setSpaceForm({
        name: space.name,
        slug: space.slug,
        description: space.description,
        logo_url: space.logo_url,
        cover_url: space.cover_url,
      });
    });
  };

  const handleUpdateSpace = async () => {
    if (!selectedSpace) return;

    await runAction('Đã cập nhật space.', async () => {
      const updated = await consumerApi.spaces.update(selectedSpace.uid, {
        name: spaceForm.name,
        description: spaceForm.description,
        logo_url: spaceForm.logo_url,
        cover_url: spaceForm.cover_url,
      });
      setSelectedSpace(updated);
      await loadData();
    });
  };

  const handleDeactivateSpace = async (uid: string) => {
    await runAction('Đã vô hiệu hóa space.', async () => {
      await consumerApi.spaces.deactivate(uid);
      await loadData();
    });
  };

  const handleDeleteSpace = async (uid: string) => {
    await runAction('Đã xóa space.', async () => {
      await consumerApi.spaces.delete(uid);
      if (selectedSpace?.uid === uid) {
        setSelectedSpace(null);
        setSpaceForm(emptySpaceForm);
      }
      await loadData();
    });
  };

  const runAction = async (successMessage: string, action: () => Promise<void>) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await action();
      if (successMessage) {
        setMessage(successMessage);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Thao tác thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <ProtectedPageShell
      title="Quản trị LMS"
      description="Quản lý Consumers và Spaces từ Backend."
      message={message}
      error={error}
      actions={
        <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/consumer/dashboard')}>
              <Layout className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button size="sm" onClick={() => void loadData()} disabled={loading || saving}>
              <RotateCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Tải lại
            </Button>
        </div>
      }
    >
        <div className="grid gap-8 lg:grid-cols-2">
          <ResourceManagementSection
            title="Consumers"
            items={consumers}
            loading={loading}
            emptyText="Chưa có consumer nào được tạo."
            loadingText="Đang tải danh sách consumers..."
            form={
            <form onSubmit={handleCreateConsumer} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="c-username">Username</Label>
                  <Input id="c-username" placeholder="johndoe" value={consumerForm.username} onChange={(event) => setConsumerForm({ ...consumerForm, username: event.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-email">Email</Label>
                  <Input id="c-email" type="email" placeholder="john@example.com" value={consumerForm.email} onChange={(event) => setConsumerForm({ ...consumerForm, email: event.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-fullname">Họ tên</Label>
                  <Input id="c-fullname" placeholder="John Doe" value={consumerForm.full_name} onChange={(event) => setConsumerForm({ ...consumerForm, full_name: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone">Số điện thoại</Label>
                  <Input id="c-phone" placeholder="0987654321" value={consumerForm.phone} onChange={(event) => setConsumerForm({ ...consumerForm, phone: event.target.value })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="c-avatar">Avatar URL</Label>
                  <Input id="c-avatar" placeholder="https://example.com/avatar.jpg" value={consumerForm.avatar_url} onChange={(event) => setConsumerForm({ ...consumerForm, avatar_url: event.target.value })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={saving} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo mới
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={!selectedConsumer || saving} onClick={() => void handleUpdateConsumer()}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Cập nhật đã chọn
                </Button>
                {selectedConsumer && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedConsumer(null); setConsumerForm(emptyConsumerForm); }}>
                    Bỏ chọn
                  </Button>
                )}
              </div>
            </form>
            }
            renderItemAction={(consumer) => (
              <Card key={consumer.uid} className="relative overflow-hidden">
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <Avatar size="lg">
                    <AvatarImage src={consumer.avatar_url} alt={consumer.username} />
                    <AvatarFallback>
                      {consumer.username?.[0]?.toUpperCase() || consumer.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground truncate">{consumer.full_name || consumer.username || 'No Name'}</p>
                      <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${consumer.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {consumer.is_active ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {consumer.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{consumer.email}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground/80">
                        <User className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{consumer.username || 'no-username'}</span>
                      </div>
                      {consumer.phone && (
                        <div className="flex items-center text-xs text-muted-foreground/80">
                          <Phone className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                          <span>{consumer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" className="h-8" onClick={() => void handleRetrieveConsumer(consumer.uid)} disabled={saving}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Chi tiết
                  </Button>
                  <Button size="sm" variant="outline" className="h-8" onClick={() => void handleDeactivateConsumer(consumer.uid)} disabled={saving || !consumer.is_active}>
                    <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                    Vô hiệu hóa
                  </Button>
                  <Button size="sm" variant="destructive" className="h-8" onClick={() => void handleDeleteConsumer(consumer.uid)} disabled={saving}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Xóa
                  </Button>
                </div>
              </Card>
            )}
          />

          <ResourceManagementSection
            title="Spaces"
            items={spaces}
            loading={loading}
            emptyText="Chưa có space nào được tạo."
            loadingText="Đang tải danh sách spaces..."
            form={
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="s-name">Tên Space</Label>
                  <Input id="s-name" placeholder="Học viện Công nghệ" value={spaceForm.name} onChange={(event) => setSpaceForm({ ...spaceForm, name: event.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-slug">Slug</Label>
                  <Input id="s-slug" placeholder="hoc-vien" value={spaceForm.slug} onChange={(event) => setSpaceForm({ ...spaceForm, slug: event.target.value })} required disabled={Boolean(selectedSpace)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="s-desc">Mô tả</Label>
                  <Input id="s-desc" placeholder="Nền tảng học tập trực tuyến..." value={spaceForm.description} onChange={(event) => setSpaceForm({ ...spaceForm, description: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-logo">Logo URL</Label>
                  <Input id="s-logo" placeholder="https://..." value={spaceForm.logo_url} onChange={(event) => setSpaceForm({ ...spaceForm, logo_url: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-cover">Cover URL</Label>
                  <Input id="s-cover" placeholder="https://..." value={spaceForm.cover_url} onChange={(event) => setSpaceForm({ ...spaceForm, cover_url: event.target.value })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={saving || Boolean(selectedSpace)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo mới
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={!selectedSpace || saving} onClick={() => void handleUpdateSpace()}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Cập nhật đã chọn
                </Button>
                {selectedSpace && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedSpace(null); setSpaceForm(emptySpaceForm); }}>
                    Bỏ chọn
                  </Button>
                )}
              </div>
            </form>
            }
            renderItemAction={(space) => (
              <Card key={space.uid} className="relative overflow-hidden">
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="h-12 w-12 rounded-lg border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {space.logo_url ? (
                      <img src={space.logo_url} alt={space.name} className="h-full w-full object-cover" />
                    ) : (
                      <Globe className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground truncate">{space.name}</p>
                      <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${space.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {space.is_active ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {space.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <div className="flex items-center text-sm font-mono text-primary">
                        <span className="text-muted-foreground mr-1">/</span>
                        <span className="truncate">{space.slug}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {space.description || 'Không có mô tả cho không gian này.'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" className="h-8" onClick={() => void handleRetrieveSpace(space.uid)} disabled={saving}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Chi tiết
                  </Button>
                  <Button size="sm" variant="outline" className="h-8" onClick={() => void handleDeactivateSpace(space.uid)} disabled={saving || !space.is_active}>
                    <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                    Vô hiệu hóa
                  </Button>
                  <Button size="sm" variant="destructive" className="h-8" onClick={() => void handleDeleteSpace(space.uid)} disabled={saving}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Xóa
                  </Button>
                </div>
              </Card>
            )}
          />
        </div>
    </ProtectedPageShell>
  );
}

function cleanPayload<T>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload as Record<string, any>).filter(([, value]) => value !== '')
  ) as T;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
