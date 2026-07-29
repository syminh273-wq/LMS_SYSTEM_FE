'use client';

import * as React from 'react';
import { Button } from '../ui/button';
import { AlertTriangle, MapPin, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { useTranslation } from '../LocaleProvider';

import { addressService } from '../../lib/api/address-service';
import { locationService } from '../../lib/api/location';
import type { ReferenceProvince, ReferenceWard } from '../../lib/api/location-types';
import { ApiException, ValidationException } from '../../lib/api/exceptions';
import type { Address, AddressPayload } from '../../lib/api/address';

type Props = {
  /** If true, shows the pencil/delete buttons and the add CTA. */
  isOwner?: boolean;
  /** Optional className for the outer section. */
  className?: string;
};

export function AddressSection({ isOwner = true, className }: Props) {
  const { t } = useTranslation();
  const [address, setAddress] = React.useState<Address | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await addressService.getMine();
      setAddress(data);
    } catch (err) {
      // 404 → already null; other errors → log
      if (!(err instanceof ApiException && err.status === 404)) {
        console.error('[AddressSection] load failed:', err);
      }
      setAddress(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const handleSaved = (next: Address) => {
    setAddress(next);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!address) return;
    setConfirmingDelete(true);
  };

  const confirmDelete = async () => {
    if (!address) return;
    setDeleting(true);
    try {
      await addressService.remove();
      setAddress(null);
      setConfirmingDelete(false);
    } catch (err) {
      console.error('[AddressSection] delete failed:', err);
      setConfirmingDelete(false);
      window.alert(t('address.delete_failed', 'Không thể xoá địa chỉ. Vui lòng thử lại.'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <section
        className={cn(
          'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm',
          className,
        )}
      >
        <div className="flex items-center gap-3 p-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20">
            <MapPin className="size-5" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="h-2.5 w-40 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/40 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25">
            <MapPin className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              {t('address.title', 'Địa chỉ')}
            </h2>
            <p className="text-xs text-slate-500">
              {address
                ? t('address.subtitle_saved', 'Thông tin liên hệ của bạn')
                : t('address.subtitle_empty', 'Cập nhật địa chỉ để hoàn thiện hồ sơ')}
            </p>
          </div>
        </div>
        {isOwner && !address && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setEditing(true)}
            className="gap-1.5 shadow-sm shadow-indigo-500/20"
          >
            <Plus className="size-4" />
            {t('address.add', 'Thêm địa chỉ')}
          </Button>
        )}
      </header>

      <div className="p-6">
        {address ? (
          <div className="space-y-4">
            <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/20 p-4 transition-all hover:border-indigo-200 hover:shadow-sm">
              <div className="absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-indigo-100/60 to-violet-100/40 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-sm ring-1 ring-indigo-100">
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  {address.label && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                      {address.label}
                    </div>
                  )}
                  <div className="space-y-0.5 text-sm leading-relaxed text-slate-700">
                    {address.line1 && <div className="font-medium text-slate-900">{address.line1}</div>}
                    {address.line2 && <div className="text-slate-600">{address.line2}</div>}
                    {(address.ward_name || address.province_name) && (
                      <div className="text-slate-600">
                        {address.ward_name}
                        {address.ward_name && address.province_name && ', '}
                        {address.province_name}
                      </div>
                    )}
                    {address.country && (
                      <div className="text-xs text-slate-400">{address.country}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="gap-1.5 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
                >
                  <Pencil className="size-3.5" />
                  {t('common.edit', 'Sửa')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="gap-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                  {t('common.delete', 'Xoá')}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => isOwner && setEditing(true)}
            disabled={!isOwner}
            className={cn(
              'group flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center transition-all',
              isOwner && 'cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40',
              !isOwner && 'cursor-default',
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm ring-1 ring-slate-200 transition-all group-hover:text-indigo-500 group-hover:ring-indigo-200">
              <MapPin className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-slate-700">
                {t('address.empty', 'Chưa có địa chỉ.')}
              </p>
              {isOwner && (
                <p className="text-xs text-slate-500">
                  {t('address.empty_cta', 'Nhấn để thêm địa chỉ của bạn')}
                </p>
              )}
            </div>
          </Button>
        )}
      </div>

      <AddressDialog
        open={editing}
        initial={address}
        onClose={() => setEditing(false)}
        onSaved={handleSaved}
      />

      <Dialog
        open={confirmingDelete}
        onOpenChange={(o) => !o && !deleting && setConfirmingDelete(false)}
      >
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col items-center gap-3 px-2 pt-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-4 ring-red-50/60">
              <AlertTriangle className="size-6" />
            </div>
            <DialogHeader className="items-center gap-1">
              <DialogTitle className="text-base">
                {t('address.confirm_delete', 'Bạn có chắc muốn xoá địa chỉ này?')}
              </DialogTitle>
              <DialogDescription className="text-center text-[13px] leading-relaxed">
                {t(
                  'address.confirm_delete_desc',
                  'Hành động này không thể hoàn tác. Địa chỉ sẽ bị xoá khỏi hồ sơ của bạn.',
                )}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              {t('address.action.cancel', 'Huỷ')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" />
              {deleting
                ? t('common.deleting', 'Đang xoá...')
                : t('address.action.delete', 'Xoá')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

type DialogProps = {
  open: boolean;
  initial: Address | null;
  onClose: () => void;
  onSaved: (next: Address) => void;
};

function AddressDialog({ open, initial, onClose, onSaved }: DialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [label, setLabel] = React.useState(initial?.label ?? '');
  const [line1, setLine1] = React.useState(initial?.line1 ?? '');
  const [line2, setLine2] = React.useState(initial?.line2 ?? '');
  const [provinceCode, setProvinceCode] = React.useState<number | null>(
    initial?.province_code ?? null,
  );
  const [wardCode, setWardCode] = React.useState<number | null>(
    initial?.ward_code ?? null,
  );
  const [country] = React.useState(initial?.country ?? 'Việt Nam');

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setLabel(initial?.label ?? '');
      setLine1(initial?.line1 ?? '');
      setLine2(initial?.line2 ?? '');
      setProvinceCode(initial?.province_code ?? null);
      setWardCode(initial?.ward_code ?? null);
      setErrors({});
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (provinceCode == null) {
      setErrors({ province_code: t('address.error.province_required', 'Vui lòng chọn tỉnh/thành.') });
      return;
    }
    if (wardCode == null) {
      setErrors({ ward_code: t('address.error.ward_required', 'Vui lòng chọn xã/phường.') });
      return;
    }
    setSubmitting(true);
    setErrors({});
    const payload: AddressPayload = {
      type: 'home',
      label: label.trim() || undefined,
      line1: line1.trim() || undefined,
      line2: line2.trim() || undefined,
      province_code: provinceCode,
      ward_code: wardCode,
      country: country.trim() || 'Việt Nam',
    };
    try {
      const next = await addressService.upsert(payload);
      onSaved(next);
    } catch (err) {
      if (err instanceof ValidationException) {
        const map: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.errors || {})) {
          map[k] = String(v);
        }
        setErrors(map);
      } else {
        console.error('[AddressDialog] save failed:', err);
        setErrors({ _form: t('address.error.save_failed', 'Không thể lưu. Vui lòng thử lại.') });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? t('address.edit_title', 'Sửa địa chỉ')
              : t('address.add_title', 'Thêm địa chỉ')}
          </DialogTitle>
          <DialogDescription>
            {t('address.dialog_desc', 'Chọn tỉnh/thành phố và xã/phường áp dụng mô hình hành chính 2025.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* country */}
          <div className="space-y-1">
            <Label htmlFor="addr-country">{t('address.field.country', 'Quốc gia')}</Label>
            <Input
              id="addr-country"
              value={country}
              readOnly
              disabled
              className="bg-slate-50 text-slate-500"
            />
          </div>

          {/* province */}
          <div className="space-y-1">
            <Label>{t('address.field.province', 'Tỉnh / Thành phố')}</Label>
            <ProvinceCombobox
              value={provinceCode}
              onChange={(code) => {
                setProvinceCode(code);
                setWardCode(null);
                setErrors((e) => {
                  const { province_code, ward_code, ...rest } = e;
                  return rest;
                });
              }}
              error={errors.province_code}
            />
          </div>

          {/* ward */}
          <div className="space-y-1">
            <Label>{t('address.field.ward', 'Xã / Phường')}</Label>
            <WardCombobox
              provinceCode={provinceCode}
              value={wardCode}
              onChange={(code) => {
                setWardCode(code);
                setErrors((e) => {
                  const { ward_code, ...rest } = e;
                  return rest;
                });
              }}
              disabled={provinceCode == null}
              error={errors.ward_code}
            />
          </div>

          {/* label */}
          <div className="space-y-1">
            <Label htmlFor="addr-label">
              {t('address.field.label', 'Nhãn')}
              <span className="ml-1 text-xs font-normal text-slate-400">({t('common.optional', 'tuỳ chọn')})</span>
            </Label>
            <Input
              id="addr-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('address.placeholder.label', 'Vd: Nhà riêng, VP HCM...')}
              maxLength={120}
            />
          </div>

          {/* line1 */}
          <div className="space-y-1">
            <Label htmlFor="addr-line1">{t('address.field.line1', 'Số nhà, đường')}</Label>
            <Input
              id="addr-line1"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder={t('address.placeholder.line1', 'Vd: 12 Nguyễn Huệ')}
              maxLength={200}
            />
          </div>

          {/* line2 */}
          <div className="space-y-1">
            <Label htmlFor="addr-line2">
              {t('address.field.line2', 'Căn hộ / toà nhà / tầng')}
              <span className="ml-1 text-xs font-normal text-slate-400">({t('common.optional', 'tuỳ chọn')})</span>
            </Label>
            <Input
              id="addr-line2"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              maxLength={200}
            />
          </div>

          {errors._form && (
            <p className="text-sm text-red-600">{errors._form}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              {t('common.cancel', 'Huỷ')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('common.saving', 'Đang lưu...') : t('common.save', 'Lưu')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ComboboxProps<T extends { code: number; name: string }> = {
  value: number | null;
  onChange: (code: number | null) => void;
  options?: T[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
};

function useFilteredOptions<T extends { name: string }>(options: T[], query: string): T[] {
  return React.useMemo(() => {
    const q = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    if (!q) return options;
    return options.filter((o) =>
      o.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(q),
    );
  }, [options, query]);
}

function ProvinceCombobox({
  value,
  onChange,
  error,
  disabled,
}: ComboboxProps<ReferenceProvince> & { disabled?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [provinces, setProvinces] = React.useState<ReferenceProvince[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    locationService
      .getAllProvincesWithWards()
      .then((data) => {
        if (!cancelled) setProvinces(data);
      })
      .catch((err) => {
        console.error('[ProvinceCombobox] load failed:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useFilteredOptions(provinces, query);
  const selected = provinces.find((p) => p.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm transition-colors',
            'border-slate-300 hover:border-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50',
            error && 'border-red-500 ring-2 ring-red-500/20',
          )}
          aria-invalid={!!error}
        >
          <span className={cn(!selected && 'text-slate-400')}>
            {selected?.name ?? (loading
              ? t('common.loading', 'Đang tải...')
              : t('address.placeholder.province', 'Chọn tỉnh/thành'))}
          </span>
          <Search className="size-4 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--anchor-width)] p-0"
      >
        <div className="border-b border-slate-100 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('address.placeholder.search', 'Tìm kiếm...')}
              className="h-9 w-full rounded-md border border-slate-200 bg-white pr-2 pl-8 text-sm outline-none focus:border-indigo-500"
            />
            {query && (
              <Button
                type="button"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="clear"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">
              {t('common.no_results', 'Không có kết quả')}
            </p>
          ) : (
            filtered.map((p) => (
              <Button
                key={p.code}
                type="button"
                onClick={() => {
                  onChange(p.code);
                  setOpen(false);
                  setQuery('');
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-slate-100',
                  p.code === value && 'bg-indigo-50 font-semibold text-indigo-700',
                )}
              >
                <span>{p.name}</span>
                {p.code === value && <span className="text-indigo-600">✓</span>}
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function WardCombobox({
  provinceCode,
  value,
  onChange,
  disabled,
  error,
}: {
  provinceCode: number | null;
  value: number | null;
  onChange: (code: number | null) => void;
  disabled?: boolean;
  error?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [wards, setWards] = React.useState<ReferenceWard[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (provinceCode == null) {
      setWards([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    locationService
      .getWardsByProvince(provinceCode)
      .then((data) => {
        if (!cancelled) setWards(data);
      })
      .catch((err) => console.error('[WardCombobox] load failed:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [provinceCode]);

  const filtered = useFilteredOptions(wards, query);
  const selected = wards.find((w) => w.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm transition-colors',
            'border-slate-300 hover:border-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50',
            error && 'border-red-500 ring-2 ring-red-500/20',
          )}
          aria-invalid={!!error}
        >
          <span className={cn(!selected && 'text-slate-400')}>
            {!provinceCode
              ? t('address.placeholder.ward_first', 'Chọn tỉnh/thành trước')
              : selected?.name ?? (loading
                  ? t('common.loading', 'Đang tải...')
                  : t('address.placeholder.ward', 'Chọn xã/phường'))}
          </span>
          <Search className="size-4 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--anchor-width)] p-0">
        <div className="border-b border-slate-100 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('address.placeholder.search', 'Tìm kiếm...')}
              className="h-9 w-full rounded-md border border-slate-200 bg-white pr-2 pl-8 text-sm outline-none focus:border-indigo-500"
            />
            {query && (
              <Button
                type="button"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="clear"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">
              {t('common.no_results', 'Không có kết quả')}
            </p>
          ) : (
            filtered.map((w) => (
              <Button
                key={w.code}
                type="button"
                onClick={() => {
                  onChange(w.code);
                  setOpen(false);
                  setQuery('');
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-slate-100',
                  w.code === value && 'bg-indigo-50 font-semibold text-indigo-700',
                )}
              >
                <span>{w.name}</span>
                {w.code === value && <span className="text-indigo-600">✓</span>}
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
