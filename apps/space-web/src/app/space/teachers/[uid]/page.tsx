'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This route used to render its own (out-of-date, buggy) teacher profile page.
// Public profile viewing is now consolidated under /space/me/[uid] — redirect
// old/bookmarked links there instead of duplicating that page.
export default function TeacherPublicPageRedirect() {
  const params = useParams();
  const router = useRouter();
  const targetUid = String(params?.uid ?? '');

  useEffect(() => {
    router.replace(targetUid ? `/space/me/${targetUid}` : '/space/me');
  }, [targetUid, router]);

  return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="size-10 text-indigo-600 animate-spin" />
    </div>
  );
}
