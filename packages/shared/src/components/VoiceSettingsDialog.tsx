'use client';

import * as React from 'react';
import { Button } from './ui/button';
import { Settings, Loader2, Volume2, VolumeX, Check, Play } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { toast } from 'sonner';

export interface VoiceSetting {
  user_id: string;
  user_type: string;
  voice_name: string;
  is_voice_enabled: boolean | string;
  language: string;
  updated_at: string;
}

export interface AvailableVoice {
  id: string;
  name: string;
}

interface VoiceSettingsDialogProps {
  getSettings: () => Promise<VoiceSetting | Record<string, string>>;
  updateSettings: (data: Record<string, any>) => Promise<VoiceSetting | Record<string, string>>;
  getAvailableVoices: () => Promise<AvailableVoice[]>;
  previewVoice?: (voiceId: string, text?: string) => Promise<{ url: string }>;
  trigger?: React.ReactNode;
}

export function VoiceSettingsDialog({
  getSettings,
  updateSettings,
  getAvailableVoices,
  previewVoice,
  trigger
}: VoiceSettingsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [settings, setSettings] = React.useState<VoiceSetting | Record<string, string> | null>(null);
  const [voices, setVoices] = React.useState<AvailableVoice[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [previewingId, setPreviewingId] = React.useState<string | null>(null);

  const isVoiceEnabled = React.useMemo(() => {
    if (!settings) return false;
    return settings.is_voice_enabled === true || settings.is_voice_enabled === 'true' || settings.is_voice_enabled === '1';
  }, [settings]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, v] = await Promise.all([getSettings(), getAvailableVoices()]);
      setSettings(s);
      
      // Chỉ hiển thị các giọng nói tiếng Việt
      const vietnameseVoices = v.filter(voice => {
        const lowerId = voice.id.toLowerCase();
        const lowerName = voice.name.toLowerCase();
        return lowerId.includes('vi-vn') || 
               lowerId.includes('vi_vn') ||
               lowerId === 'vi' ||
               lowerName.includes('vietnam') ||
               lowerName.includes('tiếng việt');
      });
      
      setVoices(vietnameseVoices.length > 0 ? vietnameseVoices : v);
    } catch (error) {
      toast.error('Không thể tải cấu hình giọng nói');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      void fetchData();
    }
  }, [open]);

  const handleToggleVoice = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const nextValue = !isVoiceEnabled;
      // Convert to string to ensure compatibility with backend that uses generic settings table
      const updated = await updateSettings({ is_voice_enabled: nextValue.toString() });
      setSettings(updated);
      
      const newIsEnabled = updated.is_voice_enabled === true || updated.is_voice_enabled === 'true' || updated.is_voice_enabled === '1';
      toast.success(newIsEnabled ? 'Đã bật giọng nói' : 'Đã tắt giọng nói');
    } catch (error) {
      toast.error('Không thể cập nhật cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectVoice = async (voiceId: string) => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateSettings({ voice_name: voiceId });
      setSettings(updated);
      toast.success('Đã thay đổi giọng nói');
    } catch (error) {
      toast.error('Không thể thay đổi giọng nói');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation();
    if (!previewVoice) return;
    
    setPreviewingId(voiceId);
    try {
      const { url } = await previewVoice(voiceId);
      const audio = new Audio(url);
      await audio.play();
    } catch (error) {
      toast.error('Không thể phát bản nghe thử');
    } finally {
      setPreviewingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-xl text-gray-400 hover:text-[#4F46E5] hover:bg-indigo-50 transition-all">
            <Settings size={18} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-sm font-black">
            <Settings size={18} className="text-[#4F46E5]" />
            Cấu hình giọng nói AI
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
          </div>
        ) : settings ? (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isVoiceEnabled ? 'bg-indigo-50 text-[#4F46E5]' : 'bg-gray-100 text-gray-400'}`}>
                  {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-wide">Phản hồi bằng giọng nói</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tự động đọc câu trả lời của AI</p>
                </div>
              </div>
              <Button
                variant={isVoiceEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => void handleToggleVoice()}
                disabled={saving}
                className={`rounded-xl px-4 font-black text-[10px] uppercase tracking-widest h-9 ${isVoiceEnabled ? 'bg-[#4F46E5] hover:bg-[#4338CA]' : ''}`}
              >
                {saving ? <Loader2 className="animate-spin mr-2" size={12} /> : null}
                {isVoiceEnabled ? 'Đang bật' : 'Đang tắt'}
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Danh sách giọng nói</h4>
              <div className="grid gap-2">
                {voices.map((voice) => (
                  <Button
                    key={voice.id}
                    onClick={() => void handleSelectVoice(voice.id)}
                    disabled={saving}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      settings.voice_name === voice.id
                        ? 'border-indigo-200 bg-indigo-50/50 ring-1 ring-indigo-200'
                        : 'border-gray-100 bg-white hover:border-indigo-100 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${settings.voice_name === voice.id ? 'bg-[#4F46E5] text-white' : 'bg-gray-50 text-gray-400'}`}>
                        <Volume2 size={14} />
                      </div>
                      <span className={`text-xs font-bold ${settings.voice_name === voice.id ? 'text-indigo-900' : 'text-gray-600'}`}>
                        {voice.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {previewVoice && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-[#4F46E5]"
                          onClick={(e) => void handlePreview(e, voice.id)}
                          disabled={previewingId === voice.id}
                        >
                          {previewingId === voice.id ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            <Play size={12} fill="currentColor" />
                          )}
                        </Button>
                      )}
                      {settings.voice_name === voice.id && (
                        <Check size={16} className="text-[#4F46E5]" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-500 font-bold uppercase tracking-widest">
            Không tìm thấy cấu hình
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
