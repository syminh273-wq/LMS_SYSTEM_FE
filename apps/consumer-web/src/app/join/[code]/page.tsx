'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { consumerApi, classroomApi, SharingLink } from '@/lib/api';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { sendJoinClassroomNotification } from '@/lib/firebase-notifications';

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [linkData, setLinkData] = useState<SharingLink | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (code) {
      handleResolve();
    }
  }, [code]);

  const handleResolve = async () => {
    try {
      setStatus('loading');
      const res = await consumerApi.sharing.resolve(code);
      setLinkData(res);

      if (res.resource_type === 'classroom' && res.action === 'join') {
        await classroomApi.joinByCode(code);
        void sendJoinClassroomNotification({ classroomId: res.resource_id, classroomName: res.metadata.name || '', code });
        toast.success('Yêu cầu tham gia đã được gửi, chờ giáo viên phê duyệt!');
        setStatus('success');
      } else {
        setStatus('success');
      }
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Mã tham gia không hợp lệ hoặc đã hết hạn');
      toast.error('Tham gia thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-100 animate-pulse"></div>
                <Loader2 className="absolute top-0 left-0 w-20 h-20 text-indigo-600 animate-spin p-4" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Đang xử lý mã tham gia...</h2>
            <p className="text-slate-500 text-sm">Vui lòng đợi trong giây lát khi chúng tôi xác nhận quyền truy cập của bạn.</p>
          </div>
        )}

        {status === 'success' && linkData && (
          <div className="space-y-4 animate-in zoom-in duration-300">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <CheckCircle2 size={48} />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Yêu cầu đã được gửi!</h2>
              <p className="text-slate-500 text-sm">
                Yêu cầu tham gia {linkData.resource_type === 'classroom' ? 'lớp học' : 'tài nguyên'} đang chờ giáo viên phê duyệt:
              </p>
              <p className="font-bold text-indigo-600 text-lg">{linkData.metadata.name || 'Phòng học mới'}</p>
            </div>
            <div className="pt-4 space-y-3">
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 font-medium text-center">
                Bạn sẽ có thể vào lớp sau khi giáo viên chấp thuận yêu cầu.
              </div>
              <Button
                onClick={() => router.push('/classroom')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl gap-2 font-bold"
              >
                Về danh sách lớp học
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 animate-in zoom-in duration-300">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <XCircle size={48} />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Rất tiếc, đã có lỗi xảy ra</h2>
              <p className="text-slate-500 text-sm">{errorMsg}</p>
            </div>
            <div className="pt-4 space-y-3">
              <Button 
                onClick={() => handleResolve()}
                variant="outline"
                className="w-full h-12 rounded-xl font-bold"
              >
                Thử lại
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="ghost"
                className="w-full h-12 rounded-xl text-slate-500 font-medium"
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
