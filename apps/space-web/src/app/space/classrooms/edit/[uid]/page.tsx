'use client';

import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { spaceApi, UpdateClassroomRequest, ValidationException, Classroom } from '@/lib/api';
import { 
  ArrowLeft,
  Loader2,
  BookOpen,
  Users,
  Info,
  Save,
  QrCode,
  Download
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { renderToStaticMarkup } from 'react-dom/server';

interface EditClassroomPageProps {
  params: Promise<{ uid: string }>;
}

export default function EditClassroomPage({ params }: EditClassroomPageProps) {
  const { uid } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [linkData, setLinkData] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, setError: setFormError, reset } = useForm<UpdateClassroomRequest>({
    defaultValues: {
      name: '',
      description: '',
      max_students: 30
    }
  });

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setFetching(true);
        const data = await spaceApi.classrooms.retrieve(uid);
        setClassroom(data);
        if (data.resolve_link) {
          setLinkData(data.resolve_link);
        } else {
          // Fetch sharing link if not resolved
          try {
            const link = await spaceApi.classrooms.getSharingLink(uid);
            setLinkData(link);
          } catch (e) {
            console.error("Failed to fetch sharing link", e);
          }
        }
        reset({
          name: data.name,
          description: data.description,
          max_students: data.max_students
        });
      } catch (err: any) {
        setGlobalError(err.message || 'Không thể tải thông tin phòng học');
        toast.error('Không thể tải thông tin phòng học');
      } finally {
        setFetching(false);
      }
    };

    fetchClassroom();
  }, [uid, reset]);

  const handleDownloadQr = () => {
    if (!linkData || !classroom) return;
    
    try {
      toast.info('Đang tạo ảnh QR...');
      const joinUrl = `${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`;
      
      let svgString = renderToStaticMarkup(
        <QRCodeSVG 
          value={joinUrl}
          size={400}
          level="H"
          includeMargin={true}
        />
      );
      
      if (!svgString.includes('xmlns=')) {
        svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = 500;
        canvas.height = 500;
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 50, 50, 400, 400); 
          
          const pngUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `QR_Lop_${classroom.name}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          toast.success('Đã tải mã QR xuống');
        }
        URL.revokeObjectURL(url);
      };
      
      img.onerror = () => {
        toast.error('Có lỗi xảy ra khi tạo ảnh QR');
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (err) {
      toast.error('Không thể tải mã QR');
    }
  };

  const onSubmit = async (data: UpdateClassroomRequest) => {
    setLoading(true);
    setGlobalError('');
    try {
      await spaceApi.classrooms.update(uid, data);
      toast.success('Cập nhật phòng học thành công');
      router.push('/space/classrooms');
    } catch (err: any) {
      if (err instanceof ValidationException) {
        Object.entries(err.errors).forEach(([field, message]) => {
          setFormError(field as any, { type: 'server', message });
        });
      } else {
        setGlobalError(err.message || 'Đã có lỗi xảy ra khi cập nhật phòng học');
        toast.error(err.message || 'Cập nhật thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="text-sm font-medium">Đang tải thông tin phòng học...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/space/classrooms')}
          className="rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Chỉnh sửa phòng học</h1>
          <p className="text-slate-500 text-sm font-medium">Cập nhật thông tin cấu hình cho phòng học {classroom?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="h-2 bg-indigo-500" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <Info size={20} className="text-indigo-500" />
              Thông tin cấu hình
            </CardTitle>
            <CardDescription className="font-medium text-slate-400">Chỉnh sửa các thông tin cần thiết bên dưới</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {globalError && (
              <div className="bg-rose-50 border border-rose-100 p-4 text-rose-600 text-sm rounded-xl font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                {globalError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
                Tên phòng học <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <BookOpen size={18} />
                </div>
                <input 
                  {...register('name', { required: 'Tên phòng học là bắt buộc' })}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all font-medium text-slate-900 ${errors.name ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'}`}
                  placeholder="Ví dụ: Toán học nâng cao lớp 12A1"
                />
              </div>
              {errors.name && <p className="text-rose-500 text-[11px] font-bold px-1 uppercase tracking-tighter">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 px-1">Mô tả khóa học <span className="text-rose-500">*</span></label>
              <textarea 
                {...register('description', { required: 'Mô tả là bắt buộc' })}
                rows={4}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all font-medium text-slate-900 resize-none ${errors.description ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'}`}
                placeholder="Mô tả tóm tắt về mục tiêu, kiến thức sẽ đạt được trong khóa học này..."
              />
              {errors.description && <p className="text-rose-500 text-[11px] font-bold px-1 uppercase tracking-tighter">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
                Giới hạn học sinh <span className="text-rose-500">*</span>
              </label>
              <div className="relative group max-w-[240px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Users size={18} />
                </div>
                <input 
                  type="number"
                  {...register('max_students', { 
                    required: 'Vui lòng nhập số lượng',
                    min: { value: 1, message: 'Tối thiểu 1 học sinh' }
                  })}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-900 ${errors.max_students ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'}`}
                />
              </div>
              {errors.max_students && <p className="text-rose-500 text-[11px] font-bold px-1 uppercase tracking-tighter">{errors.max_students.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* QR Code Section */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <QrCode size={20} className="text-indigo-500" />
              Mã QR tham gia
            </CardTitle>
            <CardDescription className="font-medium text-slate-400">Học sinh có thể quét mã này để tham gia phòng học nhanh chóng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                {linkData ? (
                  <QRCodeSVG 
                    value={`${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`}
                    size={140}
                    level="H"
                    includeMargin={false}
                  />
                ) : (
                  <div className="w-[140px] h-[140px] flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Loader2 size={24} className="animate-spin text-slate-300" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-4 text-center sm:text-left w-full">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mã tham gia</div>
                  <div className="text-3xl font-black text-slate-900 tracking-[0.2em] uppercase">
                    {linkData?.code || '------'}
                  </div>
                </div>
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleDownloadQr}
                  disabled={!linkData}
                  className="w-full sm:w-auto border-slate-200 hover:bg-white hover:border-indigo-500 hover:text-indigo-600 h-10 rounded-xl px-6 font-bold text-xs gap-2 transition-all shadow-sm"
                >
                  <Download size={16} />
                  TẢI ẢNH QR
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => router.push('/space/classrooms')}
            disabled={loading}
            className="text-slate-500 font-bold text-xs tracking-widest hover:bg-slate-100 rounded-xl px-6"
          >
            HỦY BỎ
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-widest min-w-[180px] h-12 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                ĐANG LƯU...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                LƯU THAY ĐỔI
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
