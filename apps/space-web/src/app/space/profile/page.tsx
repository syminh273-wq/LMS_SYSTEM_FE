'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  Award,
  CalendarDays,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UserCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
  accountService,
  type ContactMethod,
  type ContactMethodType,
  type SpaceAccountProfile,
} from '@/lib/api/account';
import { setProfile } from '@/lib/redux/userSlice';
import type { RootState } from '@/lib/redux/store';
import { getAvatarText } from '@/lib/avatar';

const CONTACT_LABEL: Record<ContactMethodType, string> = {
  gmail: 'Gmail',
  phone: 'Số điện thoại',
  zalo: 'Zalo',
};

const CONTACT_ICONS: Record<ContactMethodType, ComponentType<{ size?: number; className?: string }>> = {
  gmail: Mail,
  phone: Phone,
  zalo: MessageCircle,
};

function getCertificates(profile: SpaceAccountProfile | null) {
  return (
    profile?.learning_certificates ||
    profile?.certificates ||
    profile?.metadata?.learning_certificates ||
    profile?.metadata?.certificates ||
    []
  );
}

function getDateOfBirth(profile: SpaceAccountProfile | null) {
  return profile?.date_of_birth || profile?.metadata?.date_of_birth || '';
}

function formatDateForDisplay(value: string) {
  if (!value) return 'Chưa thiết lập';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function createContact(type: ContactMethodType, value = ''): ContactMethod {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return { id: randomId, type, value };
}

function getContacts(profile: SpaceAccountProfile | null): ContactMethod[] {
  const metadataContacts = profile?.metadata?.contacts;
  if (Array.isArray(metadataContacts) && metadataContacts.length > 0) {
    return metadataContacts
      .filter((contact): contact is ContactMethod => (
        Boolean(contact?.id) &&
        ['gmail', 'phone', 'zalo'].includes(contact.type) &&
        typeof contact.value === 'string'
      ))
      .map(contact => ({ ...contact }));
  }

  const contacts: ContactMethod[] = [];
  const gmail = profile?.gmail || profile?.email;
  const phone = profile?.phone_number || profile?.phone;
  const zalo = profile?.zalo || profile?.metadata?.zalo;

  if (gmail) contacts.push(createContact('gmail', gmail));
  if (phone) contacts.push(createContact('phone', phone));
  if (zalo) contacts.push(createContact('zalo', zalo));

  return contacts;
}

type EditForm = {
  hometown: string;
  date_of_birth: string;
  certificates: string[];
  contacts: ContactMethod[];
};

function buildForm(profile: SpaceAccountProfile | null): EditForm {
  return {
    hometown: profile?.hometown || profile?.metadata?.hometown || '',
    date_of_birth: getDateOfBirth(profile),
    certificates: getCertificates(profile),
    contacts: getContacts(profile).filter(contact => contact.type !== 'gmail'),
  };
}

export default function SpaceProfilePage() {
  const dispatch = useDispatch();
  const storedProfile = useSelector((state: RootState) => state.user.profile);
  const [profile, setLocalProfile] = useState<SpaceAccountProfile | null>(storedProfile);
  const [form, setForm] = useState<EditForm>(() => buildForm(storedProfile));
  const [loading, setLoading] = useState(!storedProfile);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await accountService.getProfile();
      setLocalProfile(data);
      setForm(buildForm(data));
      dispatch(setProfile(data));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Không thể tải hồ sơ Space'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await accountService.getProfile();
        if (!mounted) return;
        setLocalProfile(data);
        setForm(buildForm(data));
        dispatch(setProfile(data));
      } catch (err: unknown) {
        if (!mounted) return;
        setError(getErrorMessage(err, 'Không thể tải hồ sơ Space'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const certificates = useMemo(() => getCertificates(profile), [profile]);
  const contacts = useMemo(() => getContacts(profile), [profile]);
  const displayName = profile?.full_name || profile?.email || 'Space Admin';
  const role = 'Space Admin';
  const displayEmail = profile?.email || profile?.gmail || 'Chưa thiết lập';
  const avatarText = getAvatarText(displayName, 'SA');
  const hometown = profile?.hometown || profile?.metadata?.hometown || 'Chưa thiết lập';
  const dateOfBirth = formatDateForDisplay(getDateOfBirth(profile));
  const phoneNumber = profile?.phone_number || profile?.phone || contacts.find(contact => contact.type === 'phone')?.value || '';
  const zalo = profile?.zalo || profile?.metadata?.zalo || contacts.find(contact => contact.type === 'zalo')?.value || '';
  const contactCards = (['gmail', 'phone', 'zalo'] as ContactMethodType[]).map(type => ({
    type,
    value:
      (type === 'gmail'
        ? displayEmail
        : contacts.find(contact => contact.type === type)?.value ||
          (type === 'phone' ? phoneNumber : zalo) ||
          'Chưa thiết lập'),
  }));

  const updateCertificate = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      certificates: prev.certificates.map((certificate, itemIndex) => itemIndex === index ? value : certificate),
    }));
  };

  const removeCertificate = (index: number) => {
    setForm(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateContact = (index: number, contact: Partial<ContactMethod>) => {
    setForm(prev => ({
      ...prev,
      contacts: prev.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, ...contact } : item),
    }));
  };

  const removeContact = (index: number) => {
    setForm(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const resetForm = () => {
    setForm(buildForm(profile));
    setIsEditing(false);
  };

  const saveProfile = async () => {
    const nextCertificates = form.certificates.map(item => item.trim()).filter(Boolean);
    const nextContacts = form.contacts
      .map(contact => ({ ...contact, value: contact.value.trim() }))
      .filter(contact => contact.value);
    const primaryGmail = displayEmail === 'Chưa thiết lập' ? '' : displayEmail;
    const primaryPhone = nextContacts.find(contact => contact.type === 'phone')?.value || '';
    const primaryZalo = nextContacts.find(contact => contact.type === 'zalo')?.value || '';

    const optimisticProfile: SpaceAccountProfile = {
      ...(profile || {}),
      hometown: form.hometown.trim(),
      date_of_birth: form.date_of_birth,
      gmail: primaryGmail,
      phone_number: primaryPhone,
      phone: primaryPhone,
      zalo: primaryZalo,
      learning_certificates: nextCertificates,
      certificates: nextCertificates,
      metadata: {
        ...(profile?.metadata || {}),
        hometown: form.hometown.trim(),
        date_of_birth: form.date_of_birth,
        contacts: nextContacts,
        learning_certificates: nextCertificates,
        certificates: nextCertificates,
        zalo: primaryZalo,
      },
    };

    setSaving(true);
    try {
      const response = await accountService.updateProfile({
        hometown: optimisticProfile.hometown,
        date_of_birth: optimisticProfile.date_of_birth,
        gmail: primaryGmail,
        phone: primaryPhone,
        phone_number: primaryPhone,
        zalo: primaryZalo,
        learning_certificates: nextCertificates,
        certificates: nextCertificates,
        metadata: optimisticProfile.metadata,
      });
      const updatedProfile = response.data || response || optimisticProfile;
      const mergedProfile = { ...optimisticProfile, ...updatedProfile };
      setLocalProfile(mergedProfile);
      setForm(buildForm(mergedProfile));
      dispatch(setProfile(mergedProfile));
      setIsEditing(false);
      toast.success('Đã cập nhật hồ sơ Space!');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật hồ sơ'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-white shadow-sm">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24 border-4 border-white shadow-xl shadow-pink-200/60">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={displayName} /> : null}
              <AvatarFallback className="bg-pink-500 text-3xl font-extrabold text-white">
                {avatarText}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-pink-500">Hồ sơ Space</p>
              <h2 className="mt-2 break-words text-3xl font-extrabold tracking-tight text-foreground">
                {loading ? 'Đang tải...' : displayName}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
                <span className="rounded-full border border-pink-100 bg-white/80 px-3 py-1 text-pink-600 shadow-sm">{role}</span>
                <span className="break-all rounded-full border border-border/70 bg-white/80 px-3 py-1 shadow-sm">{displayEmail}</span>
                <span className="rounded-full border border-border/70 bg-white/80 px-3 py-1 shadow-sm">{hometown}</span>
                <span className="rounded-full border border-border/70 bg-white/80 px-3 py-1 shadow-sm">{dateOfBirth}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={fetchProfile}
              disabled={loading || saving}
              className="h-11 rounded-xl border-pink-100 bg-white/80 font-bold text-foreground shadow-sm hover:bg-white"
            >
              <RefreshCw size={16} />
              Tải lại
            </Button>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={resetForm} disabled={saving} className="h-11 rounded-xl border-pink-100 bg-white/80 font-bold">
                  Hủy
                </Button>
                <Button onClick={saveProfile} disabled={saving} className="h-11 rounded-xl bg-pink-500 px-5 font-bold text-white shadow-lg shadow-pink-200 hover:bg-pink-600">
                  <Save size={16} />
                  {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="h-11 rounded-xl bg-pink-500 px-5 font-bold text-white shadow-lg shadow-pink-200 hover:bg-pink-600">
                <Pencil size={16} />
                Chỉnh sửa hồ sơ
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">
        <Card className="h-fit rounded-3xl border-border bg-card shadow-md shadow-pink-100/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 border-b border-border/60 pb-5">
              <Avatar className="h-16 w-16 border-2 border-pink-100 shadow-sm">
                {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={displayName} /> : null}
                <AvatarFallback className="bg-pink-500 text-xl font-extrabold text-white">
                  {avatarText}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-extrabold text-foreground">{loading ? 'Đang tải...' : displayName}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-pink-500">{role}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <QuickInfoItem icon={UserCircle} label="Vai trò" value={role} />
              <QuickInfoItem icon={Mail} label="Email" value={displayEmail} />
              <QuickInfoItem icon={MapPin} label="Quê quán" value={hometown} />
              <QuickInfoItem icon={CalendarDays} label="Ngày sinh" value={dateOfBirth} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <ProfileSectionCard
            icon={UserCircle}
            title="Thông tin cá nhân"
            description="Thông tin định danh cơ bản của tài khoản quản trị Space"
          >
            <CardContent className="p-6">
              {isEditing ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label htmlFor="hometown" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quê quán</Label>
                    <Input
                      id="hometown"
                      value={form.hometown}
                      onChange={(event) => setForm(prev => ({ ...prev, hometown: event.target.value }))}
                      className="h-12 rounded-xl bg-muted/30 border-border focus:bg-card"
                      placeholder="Ho Chi Minh City"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="dateOfBirth" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ngày sinh</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={form.date_of_birth}
                      onChange={(event) => setForm(prev => ({ ...prev, date_of_birth: event.target.value }))}
                      className="h-12 rounded-xl bg-muted/30 border-border focus:bg-card"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoItem icon={UserCircle} label="Họ và tên" value={displayName} />
                  <InfoItem icon={MapPin} label="Quê quán" value={hometown} />
                  <InfoItem icon={CalendarDays} label="Ngày sinh" value={dateOfBirth} />
                </div>
              )}
            </CardContent>
          </ProfileSectionCard>

          <ProfileSectionCard
            icon={Phone}
            title="Thông tin liên hệ"
            description="Gmail đăng nhập và các phương thức liên hệ bổ sung của quản trị viên"
            action={isEditing ? (
              <Button
                variant="outline"
                onClick={() => setForm(prev => ({ ...prev, contacts: [...prev.contacts, createContact('phone')] }))}
                className="h-10 rounded-xl border-border font-bold"
              >
                <Plus size={16} />
                Thêm liên hệ
              </Button>
            ) : null}
          >
            <CardContent className="p-6">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-pink-100 bg-pink-50/40 p-4 md:grid-cols-[160px_1fr]">
                    <div className="flex h-12 items-center rounded-xl border border-pink-100 bg-white px-3 text-sm font-bold text-pink-600">
                      Gmail
                    </div>
                    <Input
                      value={displayEmail}
                      readOnly
                      className="h-12 rounded-xl border-pink-100 bg-white text-muted-foreground"
                    />
                  </div>
                  {form.contacts.map((contact, index) => (
                    <div key={contact.id} className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-[160px_1fr_auto]">
                      <select
                        value={contact.type}
                        onChange={(event) => updateContact(index, { type: event.target.value as ContactMethodType })}
                        className="h-12 rounded-xl border border-border bg-card px-3 text-sm font-bold outline-none focus:ring-3 focus:ring-primary-brand/10"
                      >
                        <option value="phone">Số điện thoại</option>
                        <option value="zalo">Zalo</option>
                      </select>
                      <Input
                        value={contact.value}
                        onChange={(event) => updateContact(index, { value: event.target.value })}
                        className="h-12 rounded-xl bg-card border-border"
                        placeholder={CONTACT_LABEL[contact.type]}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeContact(index)}
                        className="h-12 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                  {form.contacts.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm font-medium text-muted-foreground">
                      Chưa thêm thông tin liên hệ bổ sung. Gmail đăng nhập luôn được hiển thị ở chế độ chỉ đọc.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {contactCards.map(contact => (
                    <ContactItem
                      key={contact.type}
                      icon={CONTACT_ICONS[contact.type]}
                      label={CONTACT_LABEL[contact.type]}
                      value={contact.value}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </ProfileSectionCard>

          <ProfileSectionCard
            icon={Award}
            title="Chứng chỉ học tập"
            description="Quản lý các chứng chỉ học tập và bồi dưỡng chuyên môn"
            action={isEditing ? (
              <Button
                variant="outline"
                onClick={() => setForm(prev => ({ ...prev, certificates: [...prev.certificates, ''] }))}
                className="h-10 rounded-xl border-border font-bold"
              >
                <Plus size={16} />
                Thêm chứng chỉ
              </Button>
            ) : null}
          >
            <CardContent className="p-6">
              {isEditing ? (
                <div className="space-y-3">
                  {form.certificates.map((certificate, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-border bg-muted/20 p-4">
                      <Input
                        value={certificate}
                        onChange={(event) => updateCertificate(index, event.target.value)}
                        className="h-12 rounded-xl bg-card border-border"
                        placeholder="Tên chứng chỉ"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeCertificate(index)}
                        className="h-12 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                  {form.certificates.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm font-medium text-muted-foreground">
                      Chưa có chứng chỉ học tập. Thêm chứng chỉ để hoàn thiện hồ sơ.
                    </p>
                  )}
                </div>
              ) : certificates.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {certificates.map((certificate, index) => (
                    <div key={`${certificate}-${index}`} className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4 font-semibold text-foreground">
                      {certificate}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-pink-200 bg-pink-50/40 p-6">
                  <p className="text-sm font-bold text-muted-foreground">Chưa có chứng chỉ học tập</p>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setForm(prev => ({ ...prev, certificates: [...prev.certificates, ''] }));
                    }}
                    className="h-10 rounded-xl bg-pink-500 px-4 font-bold text-white hover:bg-pink-600"
                  >
                    <Plus size={16} />
                    Thêm chứng chỉ
                  </Button>
                </div>
              )}
            </CardContent>
          </ProfileSectionCard>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-500 ring-1 ring-pink-100">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function QuickInfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 px-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-pink-500 shadow-sm ring-1 ring-pink-100">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-pink-100 bg-pink-50/50 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-pink-500 shadow-sm ring-1 ring-pink-100">
          <Icon size={18} />
        </div>
        <p className="text-sm font-extrabold text-foreground">{label}</p>
      </div>
      <p className="mt-3 break-words text-sm font-semibold text-muted-foreground">{value}</p>
    </div>
  );
}

function ProfileSectionCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 ring-1 ring-pink-100">
              <Icon size={24} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl font-extrabold text-foreground">{title}</CardTitle>
              <CardDescription className="mt-1 font-medium">{description}</CardDescription>
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      {children}
    </Card>
  );
}
