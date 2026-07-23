'use client';

import { type Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Code,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  Image as ImageIcon, Undo, Redo,
} from 'lucide-react';
import { useRef } from 'react';

type Props = {
  editor: Editor | null;
};

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={[
        'relative p-1.5 rounded transition border',
        isActive
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
          : 'text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-900',
        disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95',
      ].join(' ')}
    >
      <div className="w-4 h-4 [&_svg]:w-4 [&_svg]:h-4">{children}</div>
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 mx-0.5" />;
}

export function CMenuBar({ editor }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      editor.chain().focus().insertContent({
        type: 'image',
        attrs: { src: url },
      }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="px-2 py-1.5 rounded-t-lg flex items-center gap-0.5 w-full border border-b-0 border-slate-200 bg-slate-50 flex-wrap">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImage}
      />
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        isActive={editor.isActive('bold')}
        tooltip="Bold"
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        isActive={editor.isActive('italic')}
        tooltip="Italic"
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
        isActive={editor.isActive('underline')}
        tooltip="Underline"
      >
        <Underline />
      </ToolbarButton>
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }}
        isActive={editor.isActive('strike')}
        tooltip="Strikethrough"
      >
        <Strikethrough />
      </ToolbarButton>
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleCode().run(); }}
        isActive={editor.isActive('code')}
        tooltip="Inline code"
      >
        <Code />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
        isActive={editor.isActive('heading', { level: 1 })}
        tooltip="Heading 1"
      >
        <Heading1 />
      </ToolbarButton>
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
        isActive={editor.isActive('heading', { level: 2 })}
        tooltip="Heading 2"
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
        isActive={editor.isActive('heading', { level: 3 })}
        tooltip="Heading 3"
      >
        <Heading3 />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
        isActive={editor.isActive('bulletList')}
        tooltip="Bullet list"
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
        isActive={editor.isActive('orderedList')}
        tooltip="Numbered list"
      >
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }}
        isActive={editor.isActive('blockquote')}
        tooltip="Quote"
      >
        <Quote />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        onClick={() => fileInputRef.current?.click()}
        tooltip="Insert image"
      >
        <ImageIcon />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }}
        disabled={!editor.can().undo()}
        tooltip="Undo"
      >
        <Undo />
      </ToolbarButton>
      <ToolbarButton
        onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }}
        disabled={!editor.can().redo()}
        tooltip="Redo"
      >
        <Redo />
      </ToolbarButton>
    </div>
  );
}

export default CMenuBar;
