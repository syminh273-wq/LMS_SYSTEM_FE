'use client';

import { useState } from 'react';
import { Smile, Send, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';

const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
  '🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚',
  '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
  '🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
  '😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮',
  '🥳','🥺','😎','🤓','🧐','😕','😟','🙁','☹️','😮',
  '😯','😲','😳','🥵','🥶','😱','😨','😰','😢','😭',
  '👍','👎','👏','🙌','🙏','💪','✌️','🤝','💯','🔥',
  '❤️','💔','💖','💯','✨','🎉','🎊','🎁','🎈','🎂',
];

type Props = {
  onSend: (payload: { content: string; attachment_url?: string }) => void;
  disabled?: boolean;
  conversationUid?: string;
};

export function MessageInput({ onSend, disabled, conversationUid }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleEmoji = (e: string) => setText((p) => p + e);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      alert('Chỉ hỗ trợ hình ảnh');
      return;
    }
    setPendingFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!conversationUid) {
      throw new Error('Missing conversationUid');
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('owner_id', conversationUid);
    fd.append('owner_type', 'conversation');
    const token = localStorage.getItem('accessToken');
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiBase}/api/v1/resource/upload/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url as string;
  };

  const handleSend = async () => {
    if (!text.trim() && !pendingFile) return;
    if (uploading) return;
    setUploading(true);
    try {
      let attachmentUrl = '';
      if (pendingFile) {
        attachmentUrl = await uploadImage(pendingFile);
      }
      onSend({ content: text.trim(), attachment_url: attachmentUrl || undefined });
      setText('');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendingFile(null);
      setPreviewUrl(null);
    } catch {
      alert('Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-t border-border bg-card p-3">
      {previewUrl && (
        <div className="mb-2 relative inline-block">
          <img src={previewUrl} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
          <button
            onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPendingFile(null); }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-700"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-2xl border border-border focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
        <input id="dm-file" type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button
          variant="ghost" size="icon"
          onClick={() => document.getElementById('dm-file')?.click()}
          className="h-9 w-9 text-muted-foreground hover:text-indigo-600"
        >
          <ImageIcon size={18} />
        </Button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t('workspace.messages.input_placeholder')}
          disabled={disabled || uploading}
          className="flex-1 bg-transparent border-none outline-none text-sm px-2 h-9 text-foreground"
        />
        <div className="relative">
          <Button
            variant="ghost" size="icon"
            onClick={() => setShowEmoji(!showEmoji)}
            className="h-9 w-9 text-muted-foreground hover:text-amber-500"
          >
            <Smile size={18} />
          </Button>
          {showEmoji && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowEmoji(false)} />
              <div className="absolute bottom-12 right-0 z-20 w-72 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl p-2 grid grid-cols-10 gap-1">
                {EMOJIS.map((e, i) => (
                  <button
                    key={i}
                    onClick={() => { handleEmoji(e); setShowEmoji(false); }}
                    className="text-xl hover:bg-slate-100 rounded p-1"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <Button
          onClick={handleSend}
          disabled={(!text.trim() && !pendingFile) || disabled || uploading}
          className="h-9 w-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </Button>
      </div>
    </div>
  );
}
