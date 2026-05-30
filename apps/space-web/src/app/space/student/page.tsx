'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Users, Search, Mail, Calendar, ChevronRight, GraduationCap } from 'lucide-react';
import { studentApi, type StudentSearchResult } from '@/lib/api/student';
import type { TeacherContact } from '@/lib/api/types';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function formatDate(val: string | number | null) {
  if (!val) return '—';
  const date = typeof val === 'number' ? new Date(val * 1000) : new Date(val);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function StaffPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All students who have ever studied in your classrooms
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl px-4 py-2.5">
          <GraduationCap size={18} />
          <span className="text-sm font-bold">{totalContacts} students</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-foreground dark:placeholder:text-muted-foreground"
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
            <p className="text-base font-semibold text-foreground">No students match your search</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different name or email</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map(s => (
              <Link
                key={s.consumer_uid}
                href={`/space/student/${s.consumer_uid}`}
                className="group bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700 transition-all"
              >
                <Avatar className="h-12 w-12 border-2 border-muted flex-shrink-0">
                  <AvatarImage src={s.consumer_avatar} alt={s.consumer_name} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-bold text-sm">
                    {initials(s.consumer_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {s.consumer_name || '(No name)'}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 truncate">
                    <Mail size={11} />
                    {s.consumer_email || '—'}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Calendar size={11} />
                    First joined {formatDate(s.first_joined_at)}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-indigo-500 flex-shrink-0 mt-1 transition-colors" />
              </Link>
            ))}
          </div>
        )
      ) : (
        /* ── Full list (no search) ── */
        contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users size={40} className="text-muted-foreground/40 mb-3" />
            <p className="text-base font-semibold text-foreground">No students yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Students appear here once they are approved in one of your classrooms
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map(contact => (
              <Link
                key={contact.consumer_uid}
                href={`/space/student/${contact.consumer_uid}`}
                className="group bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700 transition-all"
              >
                <Avatar className="h-12 w-12 border-2 border-muted flex-shrink-0">
                  <AvatarImage src={contact.consumer_avatar} alt={contact.consumer_name} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-bold text-sm">
                    {initials(contact.consumer_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {contact.consumer_name || '(No name)'}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 truncate">
                    <Mail size={11} />
                    {contact.consumer_email || '—'}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Calendar size={11} />
                    First joined {formatDate(contact.first_joined_at)}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-indigo-500 flex-shrink-0 mt-1 transition-colors" />
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
