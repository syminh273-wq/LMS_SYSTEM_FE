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
  GraduationCap
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@shared/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/components/ui/tooltip";
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useTranslation } from '@shared/components/LocaleProvider';

export default function ClassroomsPage() {
  const router = useRouter();
  const { t, formatDate: localeFormatDate } = useTranslation();
  const [data, setData] = useState<PaginatedResponse<Classroom> | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const fetchClassrooms = async (page: number) => {
    try {
      setLoading(true);
      const res = await spaceApi.classrooms.list(page);
      setData(res);
      setCurrentPage(res.current_page);
    } catch (err: any) {
      setError(err.message || t('classroom.ui.list_message_load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQr = async (classroom: Classroom) => {
    try {
      const code = classroom.resolve_link?.code || classroom.pid;

      if (code) {
        toast.info(t('classroom.ui.list_message_qr_creating'));

        // 1. Tạo joining URL
        const joinUrl = `${window.location.origin.replace('3003', '3000')}/join/${code}`;

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

            toast.success(t('classroom.ui.list_message_qr_downloaded'));
          }
          URL.revokeObjectURL(url);
        };

        img.onerror = () => {
          console.error('Failed to load SVG into Image');
          toast.error(t('classroom.ui.list_message_qr_error'));
          URL.revokeObjectURL(url);
        };

        img.src = url;
      }
    } catch (err) {
      console.error('Failed to download QR:', err);
      toast.error(t('classroom.ui.list_message_qr_download_error'));
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

  const filteredClassrooms = classrooms.filter(classroom =>
    classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classroom.pid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (uid: string) => {
    if (confirm(t('classroom.ui.list_confirm_delete'))) {
      try {
        await spaceApi.classrooms.delete(uid);
        toast.success(t('classroom.ui.list_delete_success'));
        fetchClassrooms(currentPage);
      } catch (err: any) {
        toast.error(err.message || t('classroom.ui.list_delete_error'));
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Search and Filter Bar */}
      <div className="bg-transparent p-0 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={20} />
          <Input
            type="text"
            className="w-full pl-12 pr-4 h-12 bg-transparent border-border rounded-xl focus-visible:ring-primary/10"
            placeholder={t('classroom.ui.list_search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="ghost" className="h-12 px-5 gap-2.5 rounded-xl text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-wider">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            {t('classroom.ui.list_filter_all')}
            <Plus size={16} className="text-muted-foreground ml-1" />
          </Button>

          <Button variant="ghost" className="h-12 px-5 gap-2.5 rounded-xl text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-wider">
            <Filter size={16} />
            {t('classroom.ui.list_filter_status')}
          </Button>

          <Button
            variant="ghost"
            className="h-12 px-4 text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-wider"
            onClick={() => {
              setSearchQuery('');
              fetchClassrooms(1);
            }}
          >
            <RotateCcw size={16} />
            <span className="ml-2 hidden lg:inline">{t('classroom.ui.list_reset')}</span>
          </Button>
        </div>

        <div className="h-8 w-[1px] bg-border hidden md:block mx-2" />

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex bg-transparent p-0">
            <Button
              variant="ghost"
              size="icon"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className="rounded-lg text-muted-foreground"
            >
              <List size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              className="rounded-lg text-muted-foreground"
            >
              <LayoutGrid size={18} />
            </Button>
          </div>

          <Button
            onClick={() => router.push('/space/classrooms/create')}
            className="h-12 bg-primary text-primary-foreground rounded-xl px-6 gap-2.5 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            {t('classroom.ui.list_create_btn')}
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
        <div className="flex flex-col items-center justify-center py-40 text-muted-foreground/60">
          <Loader2 size={48} className="animate-spin mb-4 text-primary" />
          <p className="text-sm font-bold uppercase tracking-widest">{t('classroom.ui.list_loading')}</p>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-32 bg-card border border-border rounded-3xl shadow-sm">
          <div className="bg-muted/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-border text-muted-foreground/60">
            <List size={40} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{t('classroom.ui.list_no_data_title')}</h3>
          <p className="text-muted-foreground mb-8 font-medium">{t('classroom.ui.list_no_data_desc')}</p>
          <Button
            onClick={() => router.push('/space/classrooms/create')}
            className="bg-primary text-primary-foreground rounded-xl px-8 h-12 shadow-lg shadow-primary/20"
          >
            <Plus size={20} className="mr-2" />
            {t('classroom.ui.list_message_create_first')}
          </Button>
        </div>
      ) : filteredClassrooms.length === 0 ? (
        <div className="text-center py-32 bg-card border border-border rounded-3xl shadow-sm">
          <div className="bg-muted/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-border text-muted-foreground/60">
            <Search size={40} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{t('classroom.ui.list_no_match_title')}</h3>
          <p className="text-muted-foreground mb-8 font-medium">{t('classroom.ui.list_no_match_desc', undefined, { query: searchQuery })}</p>
          <Button
            onClick={() => setSearchQuery('')}
            variant="outline"
            className="rounded-xl px-8 h-12 font-bold uppercase tracking-widest"
          >
            <RotateCcw size={20} className="mr-2" />
            {t('classroom.ui.list_clear_search')}
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {t('classroom.ui.list_th_info')}
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">
                  {t('classroom.ui.list_th_code')}
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">
                  {t('classroom.ui.list_th_max_students')}
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">
                  {t('classroom.ui.list_th_created_at')}
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">
                  {t('classroom.ui.list_th_status')}
                </TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">
                  {t('classroom.ui.list_th_actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClassrooms.map((classroom) => (
                <TableRow
                  key={classroom.uid}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/space/classrooms/${classroom.uid}/details`)}
                >
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11 border-2 border-card shadow-sm bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                        <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs uppercase group-hover:bg-primary group-hover:text-primary-foreground">
                          {classroom.name?.substring(0, 2) || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-foreground group-hover:text-primary">
                            {classroom.name}
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              classroom.pricing_type === 'paid'
                                ? 'text-[9px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100 hover:bg-amber-100'
                                : 'text-[9px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 hover:bg-emerald-100'
                            }
                          >
                            {classroom.pricing_type === 'paid'
                              ? classroom.price_vnd
                                ? `${(classroom.price_vnd / 1000).toFixed(0)}k`
                                : 'PAID'
                              : 'FREE'}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-semibold line-clamp-1 max-w-[300px]">
                          {classroom.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <Badge
                      variant="outline"
                      className="text-[11px] font-bold text-primary bg-accent border-primary/30 uppercase tracking-wider"
                    >
                      {classroom.pid}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <div className="text-sm font-bold text-foreground">{classroom.max_students}</div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center text-xs text-muted-foreground font-bold">
                    {localeFormatDate(classroom.created_at)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <Badge
                      variant="secondary"
                      className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border border-emerald-100 gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {t('classroom.ui.list_status_active')}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => router.push(`/space/classrooms/${classroom.uid}/details`)}
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground/60 hover:text-primary rounded-xl hover:bg-accent"
                            title={t('classroom.ui.list_view_detail')}
                          >
                            <ChevronRight size={20} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('classroom.ui.list_view_detail')}</TooltipContent>
                      </Tooltip>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground/60 hover:text-foreground rounded-xl hover:bg-muted">
                            <MoreVertical size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-border">
                          <DropdownMenuItem
                            className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-muted-foreground hover:text-primary cursor-pointer"
                            onClick={() => router.push(`/space/classrooms/edit/${classroom.uid}`)}
                          >
                            <Pencil size={16} className="mr-3 text-muted-foreground" />
                            <span>{t('classroom.ui.list_action_edit')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-muted-foreground hover:text-primary cursor-pointer"
                            onClick={() => handleDownloadQr(classroom)}
                          >
                            <Download size={16} className="mr-3 text-muted-foreground" />
                            <span>{t('classroom.ui.list_action_download_qr')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-2 bg-muted/50" />
                          <DropdownMenuItem
                            variant="destructive"
                            className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase cursor-pointer"
                            onClick={() => handleDelete(classroom.uid)}
                          >
                            <Trash2 size={16} className="mr-3" />
                            <span>{t('classroom.ui.list_action_delete')}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Footer with Pagination */}
          <div className="px-8 py-5 bg-muted/30 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('classroom.labels.rows_per_page')}</span>
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground cursor-pointer">
                20
                <ChevronLeft size={16} className="-rotate-90 text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {t('classroom.labels.page_of', undefined, { current: data?.current_page ?? 1, total: data?.total_pages ?? 1 })}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-card hover:text-primary border-2 border-transparent hover:border-border rounded-xl shadow-none" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                  <ChevronsLeft size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-card hover:text-primary border-2 border-transparent hover:border-border rounded-xl shadow-none" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-card hover:text-primary border-2 border-transparent hover:border-border rounded-xl shadow-none" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === data?.total_pages}>
                  <ChevronRight size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-card hover:text-primary border-2 border-transparent hover:border-border rounded-xl shadow-none" onClick={() => handlePageChange(data?.total_pages || 1)} disabled={currentPage === data?.total_pages}>
                  <ChevronsRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredClassrooms.map((classroom) => (
            <Card
              key={classroom.uid}
              onClick={() => router.push(`/space/classrooms/${classroom.uid}/details`)}
              className="group cursor-pointer overflow-hidden border-border bg-card p-5 flex flex-col gap-4 aspect-square justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <Avatar className="h-10 w-10 rounded-lg bg-muted text-muted-foreground">
                  <AvatarFallback className="rounded-lg bg-muted text-muted-foreground font-bold text-sm">
                    {classroom.name ? classroom.name.substring(0, 2).toUpperCase() : '??'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    {classroom.pid}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-muted-foreground">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2">
                      <DropdownMenuItem onClick={() => router.push(`/space/classrooms/edit/${classroom.uid}`)}>
                        <Pencil />
                        {t('classroom.ui.list_action_edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadQr(classroom)}>
                        <Download />
                        {t('classroom.ui.list_action_download_qr')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(classroom.uid)}>
                        <Trash2 />
                        {t('classroom.ui.list_action_delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col gap-1.5">
                <h3 className="font-bold text-foreground text-base line-clamp-2 leading-tight">
                  {classroom.name}
                </h3>
                {classroom.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {classroom.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users size={12} />
                  0 / {classroom.max_students}
                </span>
                <span>{localeFormatDate(classroom.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Section */}
      {!loading && classrooms.length > 0 && (
        <div className="grid grid-cols-1 gap-8 mt-4">
          {/* Total Classrooms Card */}
          <div className="bg-gradient-to-br from-primary-brand to-primary-brand-dark rounded-3xl p-8 text-white shadow-xl shadow-primary-brand/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <GraduationCap size={160} strokeWidth={1} />
            </div>

            <div className="relative">
              <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-2 opacity-80">{t('classroom.ui.list_stats_title')}</p>
              <h2 className="text-6xl font-bold mb-8">{data?.count ?? classrooms.length}</h2>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-32 opacity-20 pointer-events-none">
              <svg viewBox="0 0 400 100" className="w-full h-full preserve-3d">
                <path d="M0,80 C50,70 100,90 150,70 C200,50 250,80 300,60 C350,40 400,60 400,60 L400,100 L0,100 Z" fill="white" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
