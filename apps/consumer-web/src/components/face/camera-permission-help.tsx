'use client';

import { Lock, RefreshCw, VideoOff } from 'lucide-react';
import { Button } from '@shared/components/ui/button';

type Props = {
  reason: 'denied' | 'not_found' | 'unknown';
  onRetry: () => void;
};

export function CameraPermissionHelp({ reason, onRetry }: Props) {
  if (reason === 'not_found') {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-5 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <VideoOff size={22} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Không tìm thấy camera</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Thiết bị của bạn không có camera hoặc camera chưa được kết nối.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onRetry}
          className="h-9 gap-2 rounded-xl text-xs font-bold"
        >
          <RefreshCw size={13} /> Thử lại
        </Button>
      </div>
    );
  }

  // denied or unknown — show address-bar guide
  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {/* Address bar mock */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-medium text-slate-600">
          <Lock size={13} className="shrink-0 text-amber-600" />
          <span className="flex-1 truncate text-slate-400">localhost:3000</span>
          <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-black text-amber-800">
            Nhấn vào đây
          </span>
        </div>
        {/* Arrow pointing up */}
        <div className="absolute -top-3 left-6 flex flex-col items-center">
          <div className="h-3 w-0.5 bg-amber-400" />
          <div className="h-0 w-0 border-x-4 border-b-4 border-x-transparent border-b-amber-400" />
        </div>
      </div>

      <ol className="space-y-2 text-xs font-medium text-slate-600">
        <Step n={1} text='Nhấn vào biểu tượng 🔒 trên thanh địa chỉ trình duyệt' />
        <Step n={2} text='Tìm mục "Camera" và chọn "Cho phép"' />
        <Step n={3} text='Nhấn "Thử lại" bên dưới' />
      </ol>

      <Button
        onClick={onRetry}
        className="h-10 w-full gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700"
      >
        <RefreshCw size={14} /> Thử lại
      </Button>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700">
        {n}
      </span>
      <span>{text}</span>
    </li>
  );
}
