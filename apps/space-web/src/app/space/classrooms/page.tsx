'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { spaceApi, PaginatedResponse, Classroom } from '@/lib/api';
import { 
  Plus, 
  Search, 
  LayoutGrid,
  List,
  MoreVertical, 
  Users, 
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  QrCode,
  Pencil,
  Trash2,
  Download,
  GraduationCap,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
} from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@shared/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@shared/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { renderToStaticMarkup } from 'react-dom/server';

export default function ClassroomsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Classroom> | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  const fetchClassrooms = async (page: number) => {
    try {
      setLoading(true);
      const res = await spaceApi.classrooms.list(page);
      setData(res);
      setCurrentPage(res.current_page);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách phòng học');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQr = async (classroom: Classroom) => {
    try {
      let linkData = classroom.resolve_link;
      
      if (!linkData) {
        toast.info('Đang khởi tạo mã QR...');
        linkData = await spaceApi.classrooms.getSharingLink(classroom.uid);
      }
      
      if (linkData) {
        toast.info('Đang tạo ảnh QR...');
        
        // 1. Tạo joining URL
        const joinUrl = `${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`;
        
        // 2. Tạo chuỗi SVG từ QRCodeSVG component
        let svgString = renderToStaticMarkup(
          <QRCodeSVG 
            value={joinUrl}
            size={400}
            level="H"
            includeMargin={true}
          />
        );
        
        // Ensure SVG namespace is present for Blob rendering
        if (!svgString.includes('xmlns=')) {
          svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        // 3. Chuyển SVG sang Canvas để tải về dạng PNG
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = document.createElement("img");
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
          console.error('Failed to load SVG into Image');
          toast.error('Có lỗi xảy ra khi tạo ảnh QR');
          URL.revokeObjectURL(url);
        };

        img.src = url;
      }
    } catch (err) {
      console.error('Failed to download QR:', err);
      toast.error('Không thể tải mã QR');
    }
  };

  useEffect(() => {
    fetchClassrooms(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (data && newPage >= 1 && newPage <= data.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const classrooms = data?.results || [];

  const handleDelete = async (uid: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phòng học này?')) {
      try {
        await spaceApi.classrooms.delete(uid);
        toast.success('Đã xóa phòng học');
        fetchClassrooms(currentPage);
      } catch (err: any) {
        toast.error(err.message || 'Không thể xóa phòng học');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all font-medium placeholder:text-slate-400"
            placeholder="Tìm kiếm theo tên hoặc mã phòng..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="h-12 px-5 gap-2.5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            Tất cả
            <Plus size={16} className="text-slate-400 ml-1" />
          </Button>
          
          <Button variant="outline" className="h-12 px-5 gap-2.5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider">
            <Filter size={16} />
            Trạng thái
          </Button>

          <Button variant="ghost" className="h-12 px-4 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-wider" onClick={() => fetchClassrooms(1)}>
            <RotateCcw size={16} />
            <span className="ml-2 hidden lg:inline">Đặt lại</span>
          </Button>
        </div>

        <div className="h-8 w-[1px] bg-slate-100 hidden md:block mx-2" />

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-100">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          
          <Button 
            onClick={() => router.push('/space/classrooms/create')}
            className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 gap-2.5 shadow-lg shadow-indigo-500/20 font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Tạo mới
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 font-medium flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 text-slate-300">
          <Loader2 size={48} className="animate-spin mb-4 text-indigo-500" />
          <p className="text-sm font-bold uppercase tracking-widest">Đang tải dữ liệu...</p>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-32 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 text-slate-300">
            <List size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Không có dữ liệu</h3>
          <p className="text-slate-500 mb-8 font-medium">Chưa có phòng học nào được tạo trong hệ thống của bạn.</p>
          <Button 
            onClick={() => router.push('/space/classrooms/create')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 shadow-lg shadow-indigo-500/20 font-bold uppercase tracking-widest"
          >
            <Plus size={20} className="mr-2" />
            Tạo ngay
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  <th className="px-8 py-5 border-b border-slate-100">Thông tin phòng</th>
                  <th className="px-6 py-5 border-b border-slate-100 text-center">Mã phòng</th>
                  <th className="px-6 py-5 border-b border-slate-100 text-center">Sĩ số tối đa</th>
                  <th className="px-6 py-5 border-b border-slate-100 text-center">Ngày tạo</th>
                  <th className="px-6 py-5 border-b border-slate-100 text-center">Trạng thái</th>
                  <th className="px-8 py-5 border-b border-slate-100 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {classrooms.map((classroom) => (
                  <tr key={classroom.uid} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/space/classrooms/${classroom.uid}/details`)}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border-2 border-white shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all uppercase">
                          {classroom.name.substring(0, 2)}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{classroom.name}</div>
                          <div className="text-[11px] text-slate-400 font-semibold line-clamp-1 max-w-[300px]">{classroom.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 uppercase tracking-wider">
                        {classroom.pid}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="text-sm font-bold text-slate-700">{classroom.max_students}</div>
                    </td>
                    <td className="px-6 py-5 text-center text-xs text-slate-500 font-bold">
                      {new Date(classroom.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Hoạt động
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/space/classrooms/${classroom.uid}/details`)}
                          className="text-slate-300 hover:text-indigo-600 p-2 transition-all rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
                          title="Xem chi tiết"
                        >
                          <ChevronRight size={20} />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-slate-300 hover:text-slate-900 p-2 transition-all rounded-xl hover:bg-slate-100 border border-transparent">
                              <MoreVertical size={20} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-100">
                            <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-slate-600 hover:text-indigo-600 cursor-pointer" onClick={() => router.push(`/space/classrooms/edit/${classroom.uid}`)}>
                              <Pencil size={16} className="mr-3 text-slate-400" />
                              <span>Chỉnh sửa</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-slate-600 hover:text-indigo-600 cursor-pointer" onClick={() => handleDownloadQr(classroom)}>
                              <Download size={16} className="mr-3 text-slate-400" />
                              <span>Tải mã QR</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2 bg-slate-50" />
                            <DropdownMenuItem 
                              variant="destructive"
                              className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase cursor-pointer"
                              onClick={() => handleDelete(classroom.uid)}
                            >
                              <Trash2 size={16} className="mr-3" />
                              <span>Xóa phòng</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with Pagination */}
          <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số hàng mỗi trang</span>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer hover:border-indigo-500 transition-colors">
                20
                <ChevronLeft size={16} className="-rotate-90 text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Trang <span className="text-slate-900 text-xs mx-1">{data?.current_page}</span> trên {data?.total_pages}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:bg-white hover:text-indigo-600 border-2 border-transparent hover:border-slate-200 rounded-xl transition-all shadow-none" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                  <ChevronsLeft size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:bg-white hover:text-indigo-600 border-2 border-transparent hover:border-slate-200 rounded-xl transition-all shadow-none" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:bg-white hover:text-indigo-600 border-2 border-transparent hover:border-slate-200 rounded-xl transition-all shadow-none" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === data?.total_pages}>
                  <ChevronRight size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:bg-white hover:text-indigo-600 border-2 border-transparent hover:border-slate-200 rounded-xl transition-all shadow-none" onClick={() => handlePageChange(data?.total_pages || 1)} disabled={currentPage === data?.total_pages}>
                  <ChevronsRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classrooms.map((classroom) => (
            <Card key={classroom.uid} className="group overflow-hidden border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 rounded-2xl flex flex-col bg-white">
              <div className="p-6 flex-1 flex flex-col relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-lg border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all uppercase shadow-sm">
                    {classroom.name ? classroom.name.substring(0, 2) : '??'}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-wider">
                      {classroom.pid}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-slate-300 hover:text-slate-900 p-1.5 transition-all rounded-lg hover:bg-slate-50 border border-transparent">
                          <MoreVertical size={18} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-100">
                        <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-slate-600 hover:text-indigo-600 cursor-pointer" onClick={() => router.push(`/space/classrooms/edit/${classroom.uid}`)}>
                          <Pencil size={16} className="mr-3 text-slate-400" />
                          <span>Chỉnh sửa</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-slate-600 hover:text-indigo-600 cursor-pointer" onClick={() => handleDownloadQr(classroom)}>
                          <Download size={16} className="mr-3 text-slate-400" />
                          <span>Tải mã QR</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2 bg-slate-50" />
                        <DropdownMenuItem 
                          variant="destructive"
                          className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase cursor-pointer"
                          onClick={() => handleDelete(classroom.uid)}
                        >
                          <Trash2 size={16} className="mr-3" />
                          <span>Xóa phòng</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-lg mb-2 line-clamp-1 leading-tight">
                  {classroom.name}
                </h3>
                
                <p className="text-xs text-slate-500 line-clamp-2 mb-8 font-medium leading-relaxed">
                  {classroom.description}
                </p>

                <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Users size={14} className="text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Học sinh</span>
                      <span className="text-xs font-bold text-slate-900 leading-none">0 / {classroom.max_students}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none block mb-1">Ngày tạo</span>
                    <span className="text-[10px] font-bold text-slate-500 leading-none">{new Date(classroom.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                <Button 
                  onClick={() => router.push(`/space/classrooms/${classroom.uid}/details`)}
                  variant="ghost" 
                  className="w-full text-[11px] font-bold tracking-[0.2em] text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all h-10 rounded-xl"
                >
                  CHI TIẾT PHÒNG HỌC
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Section */}
      {!loading && classrooms.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          {/* Total Classrooms Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <GraduationCap size={160} strokeWidth={1} />
            </div>
            
            <div className="relative">
              <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-2 opacity-80">Tổng số lớp học</p>
              <h2 className="text-6xl font-bold mb-8">148</h2>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                <TrendingUp size={16} className="text-emerald-400" />
                <span className="text-xs font-bold">+12% <span className="text-indigo-200 font-medium">so với tháng trước</span></span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-32 opacity-20 pointer-events-none">
              <svg viewBox="0 0 400 100" className="w-full h-full preserve-3d">
                <path d="M0,80 C50,70 100,90 150,70 C200,50 250,80 300,60 C350,40 400,60 400,60 L400,100 L0,100 Z" fill="white" />
              </svg>
            </div>
          </div>

          {/* Resource Allocation Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Phân bổ nguồn lực</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Thống kê sĩ số trung bình theo khối</p>
              </div>
              <button className="text-indigo-600 text-xs font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                Chi tiết
              </button>
            </div>

            <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-2">
              {[
                { label: 'K10', value: 35, color: 'bg-indigo-100' },
                { label: 'K11', value: 85, color: 'bg-indigo-600' },
                { label: 'K12', value: 45, color: 'bg-indigo-100' },
                { label: 'NGHỀ', value: 95, color: 'bg-emerald-400' },
                { label: 'IELTS', value: 25, color: 'bg-indigo-100' }
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="w-full relative h-48 bg-slate-50 rounded-xl overflow-hidden">
                    <div 
                      className={`absolute bottom-0 left-0 w-full transition-all duration-700 ease-out group-hover:brightness-110 shadow-lg ${item.color}`}
                      style={{ height: `${item.value}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
