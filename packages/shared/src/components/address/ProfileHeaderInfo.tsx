'use client';

import * as React from 'react';
import { CalendarDays, MapPin, Mail } from 'lucide-react';

import { addressService } from '../../lib/api/address-service';
import type { Address } from '../../lib/api/address';

type Props = {
  uid: string;
  createdAt?: string | null;
  isOwner?: boolean;
  /** Pre-formatted address string from caller (e.g. public profile API). */
  addressText?: string | null;
  email?: string | null;
};

function formatJoinedDate(value: string | null | undefined, locale: 'vi' | 'en' = 'vi'): string {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}

function formatAddress(addr: Address | null): string {
  if (!addr) return '';
  const parts: string[] = [];
  if (addr.line1) parts.push(addr.line1);
  if (addr.ward_name) parts.push(addr.ward_name);
  if (addr.province_name) parts.push(addr.province_name);
  return parts.join(', ');
}

export function ProfileHeaderInfo({
  uid,
  createdAt,
  isOwner = true,
  addressText,
  email,
}: Props) {
  const [addr, setAddr] = React.useState<Address | null>(null);

  React.useEffect(() => {
    if (!isOwner || addressText) {
      setAddr(null);
      return;
    }
    let cancelled = false;
    addressService
      .getMine()
      .then((data) => {
        if (cancelled) return;
        setAddr(data);
      })
      .catch(() => {
        if (cancelled) return;
        setAddr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, isOwner, addressText]);

  const joinedLabel = formatJoinedDate(createdAt);
  const addrLabel = addressText?.trim() || (isOwner ? formatAddress(addr) : '');

  if (!joinedLabel && !addrLabel && !email) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {email && (
        <a
          href={`mailto:${email}`}
          className="group inline-flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-indigo-600 transition-colors w-fit"
        >
          <span className="flex items-center justify-center size-6 rounded-md bg-slate-100 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 transition-colors">
            <Mail className="size-3.5" />
          </span>
          <span className="truncate">{email}</span>
        </a>
      )}

      {addrLabel && (
        <div className="flex items-start gap-1.5 text-[13px] text-slate-600">
          <span className="flex items-center justify-center size-6 rounded-md bg-slate-100 text-slate-500 shrink-0 mt-0.5">
            <MapPin className="size-3.5" />
          </span>
          <span className="leading-snug">{addrLabel}</span>
        </div>
      )}

      {joinedLabel && (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 text-[11px] font-medium text-indigo-700">
            <CalendarDays className="size-3" />
            Tham gia {joinedLabel}
          </span>
        </div>
      )}
    </div>
  );
}
