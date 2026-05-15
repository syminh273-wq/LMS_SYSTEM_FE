'use client';

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
  QrCode
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
import { SharingModal } from '@/components/resource/SharingModal';

export default function ClassroomsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Classroom> | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [sharingClassroom, setSharingClassroom] = useState<Classroom | null>(null);

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

  useEffect(() => {
    fetchClassrooms(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (data && newPage >= 1 && newPage <= data.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const classrooms = data?.results || [];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Search and Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
            placeholder="Tìm kiếm theo tên hoặc mã phòng..."
          />
        </div>

        <div className="h-8 w-[1px] bg-slate-200 hidden md:block mx-1" />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9 gap-2 text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Tất cả
            <Plus size={14} className="text-slate-400" />
          </Button>
          
          <Button variant="ghost" size="sm" className="h-9 gap-2 text-slate-600 border border-slate-200 hover:bg-slate-100">
            <Filter size={14} />
            Trạng thái
          </Button>

          <Button variant="ghost" size="sm" className="h-9 text-slate-500 hover:text-slate-900" onClick={() => fetchClassrooms(1)}>
            Đặt lại
            <RotateCcw size={14} className="ml-2" />
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50">
            <Settings2 size={18} />
          </Button>

          <Button 
            onClick={() => router.push('/space/classrooms/create')}
            className="h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-lg px-4 gap-2 shadow-sm font-medium"
          >
            <Plus size={18} />
            Tạo mới
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Loader2 size={40} className="animate-spin mb-4" />
          <p className="text-sm font-medium">Đang tải dữ liệu...</p>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-400">
            <List size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Không có dữ liệu</h3>
          <p className="text-slate-500 mb-6 text-sm">Chưa có phòng học nào được tạo trong hệ thống của bạn.</p>
          <Button 
            onClick={() => router.push('/space/classrooms/create')}
            className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
          >
            <Plus size={18} className="mr-2" />
            Tạo ngay
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Thông tin phòng</th>
                  <th className="px-6 py-4 font-bold text-center">Mã phòng</th>
                  <th className="px-6 py-4 font-bold text-center">Sĩ số tối đa</th>
                  <th className="px-6 py-4 font-bold text-center">Ngày tạo</th>
                  <th className="px-6 py-4 font-bold text-center">Trạng thái</th>
                  <th className="px-6 py-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {classrooms.map((classroom) => (
                  <tr key={classroom.uid} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSharingClassroom(classroom)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors uppercase">
                          {classroom.name.substring(0, 2)}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{classroom.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[240px] font-medium">{classroom.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {classroom.pid}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-bold text-slate-700">{classroom.max_students}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-500 font-medium">
                      {new Date(classroom.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Hoạt động
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setSharingClassroom(classroom)}
                          className="text-slate-400 hover:text-indigo-600 p-1.5 transition-colors rounded-md hover:bg-indigo-50"
                          title="Xem chi tiết"
                        >
                          <ChevronRight size={18} />
                        </button>
                        <button className="text-slate-300 hover:text-slate-900 p-1.5 transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with Pagination */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Số hàng mỗi trang</span>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-600">
                20
                <ChevronLeft size={14} className="-rotate-90 text-slate-400" />
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500">
              Trang <span className="text-slate-900">{data?.current_page}</span> trên {data?.total_pages}
            </div>

            <Pagination className="w-auto mx-0">
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 shadow-none" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                    <ChevronsLeft size={16} />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 shadow-none" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    <ChevronLeft size={16} />
                  </Button>
                </PaginationItem>
                
                <PaginationItem>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 shadow-none" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === (data?.total_pages || 1)}>
                    <ChevronRight size={16} />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 shadow-none" onClick={() => handlePageChange(data?.total_pages || 1)} disabled={currentPage === (data?.total_pages || 1)}>
                    <ChevronsRight size={16} />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classrooms.map((classroom) => (
            <Card key={classroom.uid} className="group border-slate-200 hover:border-indigo-400 transition-all hover:shadow-lg overflow-hidden flex flex-col h-full bg-white rounded-2xl">
              <div className="h-1.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-[10px] font-black text-white bg-slate-900 px-2 py-0.5 rounded shadow-sm">
                    {classroom.pid}
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="text-slate-300 hover:text-slate-900 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-lg mb-2 line-clamp-1">
                  {classroom.name}
                </h3>
                
                <p className="text-xs text-slate-500 line-clamp-3 mb-6 font-medium leading-relaxed">
                  {classroom.description}
                </p>

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">0 / {classroom.max_students}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500">{new Date(classroom.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <Button 
                  onClick={() => setSharingClassroom(classroom)}
                  variant="ghost" 
                  className="w-full text-[11px] font-bold tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all h-9 rounded-lg"
                >
                  CHI TIẾT PHÒNG HỌC
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SharingModal 
        isOpen={!!sharingClassroom}
        onClose={() => setSharingClassroom(null)}
        classroom={sharingClassroom}
      />
    </div>
  );
}
