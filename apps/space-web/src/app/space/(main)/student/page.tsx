'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Users, Search, Mail, Calendar, ChevronRight, GraduationCap } from 'lucide-react';
import { studentApi, type StudentSearchResult } from '@/lib/api/student';
import type { TeacherContact } from '@/lib/api/types';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { useTranslation } from '@shared/components/LocaleProvider';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export default function StaffPage() {
  const { t, formatDate: localeFormatDate } = useTranslation();
  const formatJoinedAt = (val: string | number | null | undefined) =>
    val ? localeFormatDate(val) : '—';
  const [contacts, setContacts] = useState<TeacherContact[]>([]);
  const [searchResults, setSearchResults] = useState<StudentSearchResult[] | null>(null);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    studentApi.listMyStudents()
      .then(data => { setContacts(data); setTotalContacts(data.length); })
      .finally(() => setLoading(false));
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await studentApi.searchStudents(q, { limit: 30 });
      setSearchResults(res.results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const isSearchMode = query.trim().length > 0;
  const isLoadingAny = loading || (isSearchMode && searching);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('student.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('student.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary-brand-light dark:bg-indigo-950/40 text-primary-brand dark:text-primary-brand rounded-xl px-4 py-2.5">
          <GraduationCap size={18} />
          <span className="text-sm font-bold">{t('student.total_badge', undefined, { count: totalContacts })}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder={t('student.search_placeholder')}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-brand/20 dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>

      {/* List */}
      {isLoadingAny ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : isSearchMode ? (
        /* ── Typesense search results ── */
        !searchResults || searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users size={40} className="text-muted-foreground/40 mb-3" />
            <p className="text-base font-semibold text-foreground">{t('student.search_empty_title')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('student.search_empty_desc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map(s => (
              <Link
                key={s.consumer_uid}
                href={`/space/student/${s.consumer_uid}`}
                className="group bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:border-primary-brand hover:shadow-md dark:hover:border-indigo-700 transition-all"
              >
                <Avatar className="h-12 w-12 border-2 border-muted flex-shrink-0">
                  <AvatarImage src={s.consumer_avatar} alt={s.consumer_name} />
                  <AvatarFallback className="bg-accent text-primary font-bold text-sm">
                    {initials(s.consumer_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary-brand dark:group-hover:text-primary-brand transition-colors">
                    {s.consumer_name || t('student.no_name')}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 truncate">
                    <Mail size={11} />
                    {s.consumer_email || t('student.no_email')}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Calendar size={11} />
                    {t('student.first_joined', undefined, { date: formatJoinedAt(s.first_joined_at) })}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-primary-brand flex-shrink-0 mt-1 transition-colors" />
              </Link>
            ))}
          </div>
        )
      ) : (
        /* ── Full list (no search) ── */
        contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users size={40} className="text-muted-foreground/40 mb-3" />
            <p className="text-base font-semibold text-foreground">{t('student.list_empty_title')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('student.list_empty_desc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map(contact => (
              <Link
                key={contact.consumer_uid}
                href={`/space/student/${contact.consumer_uid}`}
                className="group bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:border-primary-brand hover:shadow-md dark:hover:border-indigo-700 transition-all"
              >
                <Avatar className="h-12 w-12 border-2 border-muted flex-shrink-0">
                  <AvatarImage src={contact.consumer_avatar} alt={contact.consumer_name} />
                  <AvatarFallback className="bg-accent text-primary font-bold text-sm">
                    {initials(contact.consumer_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary-brand dark:group-hover:text-primary-brand transition-colors">
                    {contact.consumer_name || t('student.no_name')}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 truncate">
                    <Mail size={11} />
                    {contact.consumer_email || t('student.no_email')}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Calendar size={11} />
                    {t('student.first_joined', undefined, { date: formatJoinedAt(contact.first_joined_at) })}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-primary-brand flex-shrink-0 mt-1 transition-colors" />
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
