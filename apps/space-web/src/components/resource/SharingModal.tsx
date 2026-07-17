'use client';

import { useState, useEffect } from 'react';
import { spaceApi, SharingLink, Classroom } from '@/lib/api';
import { 
  Dialog, DialogContent 
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  Loader2, 
  Link as LinkIcon, 
  Users, 
  Info, 
  ChevronRight, 
  Share2, 
  Calendar, 
  ShieldCheck,
  Send,
  FileText,
  Paperclip,
  MessageSquare,
  SendHorizontal,
  Trash,
  File,
  X,
  UploadCloud
} from 'lucide-react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { formatDate, formatTime } from '@shared/lib/datetime';

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
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'chat'>('info');

  // Mock state for messages and documents
  const [messages, setMessages] = useState<{id: number, sender: string, text: string, time: string, isMe: boolean}[]>([
    { id: 1, sender: "Giảng viên", text: "Chào mừng các em đến với lớp học!", time: "09:00", isMe: false },
    { id: 2, sender: "Bạn", text: "Em chào thầy ạ.", time: "09:05", isMe: true },
  ]);
  const [newMessage, setNewMessage] = useState("");
  
  const [documents, setDocuments] = useState<{id: number, name: string, size: string, date: string}[]>([
    { id: 1, name: "Giao_trinh_toan_cao_cap.pdf", size: "2.4 MB", date: "15/05/2026" },
    { id: 2, name: "Bai_tap_ve_nha_tuan_1.docx", size: "450 KB", date: "16/05/2026" },
  ]);

  useEffect(() => {
    if (isOpen && initialClassroom) {
      setClassroom(initialClassroom);
      setShowQr(false);
      setActiveTab('info');
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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now(),
      sender: "Bạn",
      text: newMessage,
      time: formatTime(new Date()),
      isMe: true
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

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
    
    const svg = document.getElementById('classroom-qr') as unknown as SVGGraphicsElement;
    if (!svg) {
      toast.error("Không tìm thấy mã QR để tải");
      return;
    }

    const canvas = document.createElement("canvas");
    let svgData = new XMLSerializer().serializeToString(svg);
    if (!svgData.includes('xmlns=')) {
      svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    const img = document.createElement("img");
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 400, 400); 
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `QR_Lop_${classroom?.name || 'Code'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success("Đã tải ảnh QR về máy");
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  if (!classroom) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl border-none shadow-2xl overflow-hidden p-0 bg-card rounded-3xl flex flex-col h-[600px]">
        {/* Header Section */}
        <div className="bg-slate-900 px-6 py-6 text-white shrink-0">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-primary-brand text-white px-2 py-0.5 rounded uppercase tracking-wider">
                  ID: {classroom.pid}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Phòng học
                </span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">{classroom.name}</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          {/* Custom Tabs */}
          <div className="flex gap-1 mt-6 bg-slate-800/50 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab('info')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'info' ? 'bg-primary-brand text-white shadow-lg shadow-primary-brand/20' : 'text-muted-foreground hover:text-white'}`}
            >
              Thông tin
            </button>
            <button 
              onClick={() => setActiveTab('docs')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'docs' ? 'bg-primary-brand text-white shadow-lg shadow-primary-brand/20' : 'text-muted-foreground hover:text-white'}`}
            >
              Tài liệu
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-primary-brand text-white shadow-lg shadow-primary-brand/20' : 'text-muted-foreground hover:text-white'}`}
            >
              Tin nhắn
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {activeTab === 'info' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Mô tả</div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{classroom.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                    <Users size={16} />
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sĩ số tối đa</div>
                  <div className="text-sm font-bold text-foreground">{classroom.max_students} học sinh</div>
                </div>
                <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                    <Info size={16} />
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ngày tạo</div>
                  <div className="text-sm font-bold text-foreground">{formatDate(classroom.created_at)}</div>
                </div>
              </div>

              {!showQr ? (
                <Button 
                  onClick={handleShowQr}
                  className="w-full bg-primary-brand hover:bg-primary-brand-dark text-white h-12 rounded-xl gap-2 font-bold shadow-lg shadow-primary-brand/20"
                  disabled={loading}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                  {loading ? 'Đang khởi tạo...' : 'XEM MÃ QR THAM GIA'}
                </Button>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col items-center">
                    <div className="p-4 bg-muted/50 rounded-2xl border border-border mb-4">
                      {linkData && (
                        <QRCodeSVG 
                          id="classroom-qr"
                          value={`${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`}
                          size={160}
                          level="H"
                        />
                      )}
                    </div>
                    <div className="text-3xl font-black tracking-[0.3em] text-foreground uppercase mb-6">{linkData?.code}</div>
                    <div className="flex gap-2 w-full">
                      <Button variant="outline" onClick={handleDownload} className="flex-1 h-11 rounded-xl font-bold text-xs gap-2">
                        <Download size={16} /> TẢI QR
                      </Button>
                      <Button onClick={copyToClipboard} className="flex-1 bg-slate-900 text-white h-11 rounded-xl font-bold text-xs gap-2">
                        <Copy size={16} /> COPY LINK
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-primary-brand p-6 rounded-3xl text-white relative overflow-hidden mb-6">
                <div className="relative z-10">
                  <h4 className="font-bold mb-1">Tải lên tài liệu</h4>
                  <p className="text-xs text-primary-brand-light mb-4">Chia sẻ tài liệu học tập với tất cả học sinh trong lớp</p>
                  <Button className="bg-card text-primary-brand hover:bg-primary-brand-light font-bold text-xs rounded-xl h-9 px-4">
                    <UploadCloud size={16} className="mr-2" /> CHỌN TỆP
                  </Button>
                </div>
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                  <FileText size={100} />
                </div>
              </div>

              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1 mb-2">Tài liệu đã tải lên ({documents.length})</div>
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4 group hover:border-primary-brand-muted transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary-brand-light group-hover:text-primary-brand transition-colors">
                      <File size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground truncate">{doc.name}</div>
                      <div className="text-[10px] font-medium text-muted-foreground">{doc.size} • {doc.date}</div>
                    </div>
                    <button className="p-2 text-muted-foreground/60 hover:text-rose-500 transition-colors">
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex-1 space-y-4 mb-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                    {!msg.isMe && <div className="text-[10px] font-bold text-muted-foreground ml-3 mb-1">{msg.sender}</div>}
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium ${msg.isMe ? 'bg-primary-brand text-white rounded-br-none' : 'bg-card border border-border text-foreground rounded-bl-none shadow-sm'}`}>
                      {msg.text}
                    </div>
                    <div className="text-[9px] font-bold text-muted-foreground mt-1 px-1">{msg.time}</div>
                  </div>
                ))}
              </div>
              
              <div className="sticky bottom-0 bg-muted/50/80 backdrop-blur-md pt-2">
                <div className="flex items-center gap-2 bg-card p-2 rounded-2xl border border-border shadow-lg">
                  <button className="p-2 text-muted-foreground hover:text-primary-brand">
                    <Paperclip size={20} />
                  </button>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium px-2 py-2"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    size="icon" 
                    className="bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl h-10 w-10 shrink-0"
                  >
                    <SendHorizontal size={18} />
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
