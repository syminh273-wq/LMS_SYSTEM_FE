'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import { Avatar, AvatarImage, AvatarFallback } from '@shared/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@shared/components/ui/card';
import { ProtectedPageShell } from '@/components/layout/protected-page-shell';
import { ResourceManagementSection } from '@/components/resource/resource-management-section';
import { useRequireAuth } from '@/features/auth/hooks/useRequireAuth';
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
  AlertCircle,
} from 'lucide-react';

const consumerSchema = z.object({
  username: z.string().min(1, 'Username là bắt buộc'),
  email: z.string().email('Email không hợp lệ'),
  full_name: z.string(),
  phone: z.string(),
  avatar_url: z.string(),
});

type ConsumerForm = z.infer<typeof consumerSchema>;

const spaceSchema = z.object({
  name: z.string().min(1, 'Tên Space là bắt buộc'),
  slug: z.string().min(1, 'Slug là bắt buộc'),
  description: z.string(),
  logo_url: z.string(),
  cover_url: z.string(),
});

type SpaceForm = z.infer<typeof spaceSchema>;

const emptyConsumer: CreateConsumerRequest = {
  username: '',
  email: '',
  full_name: '',
  phone: '',
  avatar_url: '',
};

const emptySpace: CreateSpaceRequest = {
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

  const consumerForm = useForm<ConsumerForm>({
    resolver: zodResolver(consumerSchema),
    defaultValues: emptyConsumer,
  });

  const spaceForm = useForm<SpaceForm>({
    resolver: zodResolver(spaceSchema),
    defaultValues: emptySpace,
  });

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

  const handleCreateConsumer = async (data: ConsumerForm) => {
    await runAction('Đã tạo consumer.', async () => {
      await consumerApi.consumers.create(cleanPayload(data) as any);
      consumerForm.reset(emptyConsumer);
      await loadData();
    });
  };

  const handleRetrieveConsumer = async (uid: string) => {
    await runAction('', async () => {
      const consumer = await consumerApi.consumers.retrieve(uid);
      setSelectedConsumer(consumer);
      consumerForm.reset({
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
    const data = consumerForm.getValues();
    await runAction('Đã cập nhật consumer.', async () => {
      const updated = await consumerApi.consumers.update(selectedConsumer.uid, {
        full_name: data.full_name,
        phone: data.phone,
        avatar_url: data.avatar_url,
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
        consumerForm.reset(emptyConsumer);
      }
      await loadData();
    });
  };

  const handleCreateSpace = async (data: SpaceForm) => {
    await runAction('Đã tạo space.', async () => {
      await consumerApi.spaces.create(cleanPayload(data) as any);
      spaceForm.reset(emptySpace);
      await loadData();
    });
  };

  const handleRetrieveSpace = async (uid: string) => {
    await runAction('', async () => {
      const space = await consumerApi.spaces.retrieve(uid);
      setSelectedSpace(space);
      spaceForm.reset({
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
    const data = spaceForm.getValues();
    await runAction('Đã cập nhật space.', async () => {
      const updated = await consumerApi.spaces.update(selectedSpace.uid, {
        name: data.name,
        description: data.description,
        logo_url: data.logo_url,
        cover_url: data.cover_url,
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
        spaceForm.reset(emptySpace);
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
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
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
            <Form {...consumerForm}>
              <form onSubmit={consumerForm.handleSubmit(handleCreateConsumer)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={consumerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={consumerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={consumerForm.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ tên</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={consumerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <Input placeholder="0987654321" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={consumerForm.control}
                    name="avatar_url"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/avatar.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedConsumer(null); consumerForm.reset(emptyConsumer); }}>
                      Bỏ chọn
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          }
          renderItemAction={(consumer) => (
            <Card key={consumer.uid} className="relative overflow-hidden border-border/60">
              <CardHeader className="flex-row items-start gap-4 space-y-0">
                <Avatar size="lg" className="border">
                  <AvatarImage src={consumer.avatar_url} alt={consumer.username} />
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {consumer.username?.[0]?.toUpperCase() || consumer.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground truncate">{consumer.full_name || consumer.username || 'No Name'}</p>
                    <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${consumer.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
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
            <Form {...spaceForm}>
              <form onSubmit={spaceForm.handleSubmit(handleCreateSpace)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={spaceForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên Space</FormLabel>
                        <FormControl>
                          <Input placeholder="Học viện Công nghệ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={spaceForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="hoc-vien" disabled={Boolean(selectedSpace)} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={spaceForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Mô tả</FormLabel>
                        <FormControl>
                          <Input placeholder="Nền tảng học tập trực tuyến..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={spaceForm.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={spaceForm.control}
                    name="cover_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedSpace(null); spaceForm.reset(emptySpace); }}>
                      Bỏ chọn
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          }
          renderItemAction={(space) => (
            <Card key={space.uid} className="relative overflow-hidden border-border/60">
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
                    <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${space.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
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
