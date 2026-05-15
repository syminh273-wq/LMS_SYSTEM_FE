'use client';

import { useState, useEffect } from 'react';
import { spaceApi, SharingLink, Classroom } from '@/lib/api';
import { 
  Dialog, DialogContent 
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { QrCode, Download, Copy, Check, Loader2, Link as LinkIcon, Users, Info, ChevronRight, Share2, Calendar, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface ClassroomDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom | null;
}

export function SharingModal({ isOpen, onClose, classroom: initialClassroom }: ClassroomDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [linkData, setLinkData] = useState<SharingLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (isOpen && initialClassroom) {
      setClassroom(initialClassroom);
      setShowQr(false);
      setLinkData(initialClassroom.resolve_link || null);
      
      // Fetch fresh details
      const fetchDetails = async () => {
        try {
          setFetchingDetails(true);
          const details = await spaceApi.classrooms.retrieve(initialClassroom.uid);
          setClassroom(details);
          if (details.resolve_link) {
            setLinkData(details.resolve_link);
          }
        } catch (error) {
          console.error("Failed to fetch classroom details:", error);
        } finally {
          setFetchingDetails(false);
        }
      };
      
      void fetchDetails();
    } else if (!isOpen) {
      setClassroom(null);
      setLinkData(null);
    }
  }, [isOpen, initialClassroom]);

  const fetchLink = async () => {
    if (!classroom) return;
    try {
      setLoading(true);
      const res = await spaceApi.classrooms.getSharingLink(classroom.uid);
      setLinkData(res);
      setShowQr(true);
    } catch (error) {
      toast.error("Không thể lấy thông tin link chia sẻ");
    } finally {
      setLoading(false);
    }
  };

  const handleShowQr = () => {
    if (linkData) {
      setShowQr(true);
    } else {
      fetchLink();
    }
  };

  const copyToClipboard = () => {
    if (!linkData) return;
    const url = `${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Đã copy link tham gia");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!linkData) return;
    window.location.href = spaceApi.sharing.getDownloadQrUrl(linkData.uid);
  };

  if (!classroom) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-none shadow-2xl overflow-hidden p-0 bg-white rounded-3xl">
        {/* Header Section */}
        <div className="bg-slate-900 px-6 py-8 text-white relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                ID: {classroom.pid}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Phòng học
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-2 tracking-tight">{classroom.name}</h3>
            <p className="text-slate-400 text-sm line-clamp-2 font-medium leading-relaxed">
              {classroom.description}
            </p>
          </div>
          <div className="absolute right-[-10px] top-[-10px] opacity-5">
            <Info size={140} />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                <Users size={16} />
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sĩ số tối đa</div>
              <div className="text-sm font-bold text-slate-700">{classroom.max_students} học sinh</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                <Info size={16} />
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</div>
              <div className="text-sm font-bold text-emerald-600">Đang hoạt động</div>
            </div>
          </div>

          {/* QR Code Reveal Logic */}
          {!showQr ? (
            <div className="pt-2">
              <Button 
                onClick={handleShowQr}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl gap-2 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                {loading ? 'Đang khởi tạo...' : 'XEM MÃ QR THAM GIA'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center justify-center p-6 bg-indigo-50/50 rounded-3xl border-2 border-dashed border-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <div className="bg-white/80 backdrop-blur-sm text-[8px] font-black text-indigo-600 px-1.5 py-0.5 rounded shadow-sm">JOIN_CODE</div>
                </div>
                
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-indigo-100 mb-4">
                  {linkData ? (
                    <QRCodeSVG 
                      value={`${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`}
                      size={160}
                      level="H"
                      includeMargin={false}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center bg-slate-100 rounded-lg">
                      <Loader2 size={24} className="animate-spin text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <span className="text-3xl font-black tracking-[0.3em] text-slate-900 uppercase">
                    {linkData?.code}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Link tham gia nhanh</label>
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="flex-1 text-[11px] font-bold text-slate-500 truncate px-2">
                      {linkData ? `${window.location.origin.replace('3003', '3000')}/join/${linkData.code}` : '...'}
                    </span>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white rounded-lg" onClick={copyToClipboard}>
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button 
                    variant="outline"
                    className="flex-1 border-slate-200 hover:bg-slate-50 h-11 rounded-xl text-xs font-bold gap-2"
                    onClick={handleDownload}
                    disabled={!linkData?.qr_code_url}
                  >
                    <Download size={16} />
                    TẢI ẢNH QR
                  </Button>
                  <Button 
                    className="flex-1 bg-slate-900 hover:bg-black text-white h-11 rounded-xl text-xs font-bold gap-2"
                    onClick={copyToClipboard}
                  >
                    <Share2 size={16} />
                    CHIA SẺ LINK
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
